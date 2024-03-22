import { Cheerio, CheerioAPI, Element as CheerioElement } from 'cheerio';
import * as cheerio from 'cheerio';
import { Browser as PuppeteerBrowser, Page } from 'puppeteer';
import { Logger } from 'winston';
import { winstonLogger } from '../../shared/logger/winston.logger';
import { envConfig } from '../../shared/settings/env-config';
import { CurrencyConverterApiService } from '../../shared/services/currency-converter.service';
import { InventoryJob } from '../../shared/interfaces/sync-inventory.interface';
import { WebsiteRepository } from '../../shared/database/repositories/website.repository';
import {
  ML_VEHICLES_BY_PAGE,
  getMultiplesOfFortyEight,
} from './utils/get-pages.utils';
import {
  convertToNumber,
  getVehicleName,
  parsePrice,
} from './utils/vehicle.utils';
import { Vehicle } from '@prisma/client';
import { PriceCurrency } from '../../shared/enums/currency.enum';
import { SyncMercadolibreVehicle } from './types/mercadolibre-sync';
import { VehicleRepository } from '../../shared/database/repositories/vehicle.repository';
import { Condition } from '../../shared/enums/vehicle.enum';
import { CreateVehicleDto } from '../../shared/database/dtos/vehicle.dto';
import { formatLocation } from '../../shared/utils/extract-vehicle-data';
import { getDurationTime } from '../../shared/utils/time';
import { TagCurrency } from './types/tag-price';

const PRICE_LIMIT_PEN = 4500;
const PRICE_LIMIT_USD = 1500;

export class MercadolibreInventory implements InventoryJob {
  private readonly MERCADOLIBRE_URL: string = envConfig.mercadolibre;
  private readonly logger: Logger = winstonLogger(MercadolibreInventory.name);

  constructor(
    private readonly browser: PuppeteerBrowser,
    private readonly exchangeRateApiService: CurrencyConverterApiService,
  ) {}

  async syncAll(): Promise<void> {
    try {
      const startTime = new Date();
      const syncedVehiclesIds: string[] = [];
      const { currentWebsite, exchangeRate } = await this.getSyncConfig();
      const pages = await this.getPages();
      const page: Page = await this.browser.newPage();

      for (const [currentPage, vehicleNumber] of pages.entries()) {
        const paginationLimit =
          vehicleNumber !== 1 ? `_Desde_${vehicleNumber}_` : '_';
        await page.goto(
          `${this.MERCADOLIBRE_URL}/autos/autos-camionetas/${paginationLimit}OrderId_PRICE_NoIndex_True`,
          { timeout: 0 },
        );
        await page.evaluate(this.scrollToEndOfPage);
        const html: string = await page.content();
        const $: CheerioAPI = cheerio.load(html);
        const vehicleBlocks = $(
          'section.ui-search-results li.ui-search-layout__item',
        );
        await this.syncVehiclesOfHtmlBlock(
          $,
          vehicleBlocks,
          currentWebsite.id,
          syncedVehiclesIds,
          exchangeRate,
        );
        const carsSynced = (currentPage + 1) * ML_VEHICLES_BY_PAGE;
        const percent = Number(
          (((currentPage + 1) / pages.length) * 100).toFixed(2),
        );
        this.logger.info(
          `[USED CARS] total vehicles synced = ${carsSynced} (${percent}%)`,
        );
      }
      const deletedCars = await VehicleRepository.updateStatusForAllInventory({
        syncedVehiclesIds,
        websiteId: currentWebsite.id,
      });
      const endTime = new Date();
      const duration = getDurationTime(startTime, endTime);
      this.logger.info(
        `[USED CARS] Job to sync vehicles finished successfully, deleted cars: ${deletedCars.count}, elapsed time: ${duration}`,
      );
    } catch (error) {
      this.logger.error('fail to sync all inventory', error);
    }
  }

  private async syncVehiclesOfHtmlBlock(
    $: CheerioAPI,
    vehiclesBlock: Cheerio<CheerioElement>,
    websiteId: string,
    syncedVehiclesIds: string[],
    exchangeRate?: number,
  ): Promise<void> {
    const block = vehiclesBlock.map((_index, element) => element);
    for (const element of block) {
      const tagPriceHtml = $(element).find(
        'div.ui-search-price div.ui-search-price__second-line span.andes-money-amount span.andes-money-amount__currency-symbol',
      );
      const tagPrice = <TagCurrency>tagPriceHtml.html().trim();
      const syncedVehicle = await this.SyncVehicleByCurrency({
        $,
        vehicleBlock: element,
        tagPrice,
        exchangeValue: exchangeRate,
        websiteId,
      });

      if (syncedVehicle) {
        syncedVehiclesIds.push(syncedVehicle.externalId);
      }
    }
  }

  async SyncVehicleByCurrency(data: SyncMercadolibreVehicle): Promise<Vehicle> {
    try {
      const { $, vehicleBlock, websiteId, tagPrice, exchangeValue } = data;
      const price = this.extractPrice($, vehicleBlock);
      const isValidVehicleInPEN = tagPrice === 'S/' && price >= PRICE_LIMIT_PEN;
      const isValidVehicleInUSD =
        tagPrice === 'U$S' && price >= PRICE_LIMIT_USD;

      if (isValidVehicleInPEN || isValidVehicleInUSD) {
        const vehicleUrl = this.extractUrl($, vehicleBlock);
        const externalId = this.extractExternalId(vehicleUrl);
        const vehicleImageUrl = this.extractImageUrl($, vehicleBlock);
        const year = this.extractYear($, vehicleBlock);
        const mileage = this.extractMileage($, vehicleBlock);
        const location = this.extractLocation($, vehicleBlock);
        const vehicleDescription = this.extractDescription($, vehicleBlock);
        const vehicleName = getVehicleName(vehicleDescription);

        const createVehicle: CreateVehicleDto = {
          vehicle: {
            externalId: `ML${externalId}`,
            url: vehicleUrl,
            location,
            frontImage: vehicleImageUrl,
            condition: Condition.USED,
            year,
            name: vehicleName,
            description: vehicleDescription,
            mileage,
            originalPrice: price,
            price: isValidVehicleInPEN ? price * exchangeValue : price,
            currency: isValidVehicleInPEN
              ? PriceCurrency.PEN
              : PriceCurrency.USD,
          },
          website_id: websiteId,
        };

        return VehicleRepository.upsert(createVehicle);
      }
    } catch (error) {
      this.logger.error(`fail to sync vehicle, `, error);
    }
  }

  private extractPrice($: CheerioAPI, vehicleBlock: CheerioElement): number {
    const priceHtml = $(vehicleBlock).find(
      'div.ui-search-price div.ui-search-price__second-line span.andes-money-amount span.andes-money-amount__fraction',
    );
    const price = parsePrice(priceHtml.html());
    return price;
  }

  private extractUrl($: CheerioAPI, vehicleBlock: CheerioElement): string {
    const vehicleUrl = $(vehicleBlock)
      .find(
        'div.ui-search-result__content-wrapper div.ui-search-item__group--title',
      )
      .find('a')
      .attr('href');
    return vehicleUrl;
  }

  private extractExternalId(url: string): string {
    const [, path] = url.split('MPE-');
    const [externalId] = path.split('-');
    return externalId;
  }

  private extractImageUrl($: CheerioAPI, vehicleBlock: CheerioElement): string {
    const imageUrl = $(vehicleBlock)
      .find(
        'div.andes-carousel-snapped__controls-wrapper div.andes-carousel-snapped div.andes-carousel-snapped__wrapper div.andes-carousel-snapped__slide',
      )
      .find('img')
      .attr('src');
    return imageUrl;
  }

  private extractYear($: CheerioAPI, vehicleBlock: CheerioElement): number {
    const year = $(vehicleBlock)
      .find(
        'div.ui-search-item__group--attributes ul.ui-search-card-attributes li.ui-search-card-attributes__attribute',
      )
      .html();
    return +year;
  }

  private extractMileage($: CheerioAPI, vehicleBlock: CheerioElement): number {
    const mileage = $(vehicleBlock)
      .find(
        'div.ui-search-item__group--attributes ul.ui-search-card-attributes li.ui-search-card-attributes__attribute',
      )
      .text();
    return convertToNumber(mileage);
  }

  private extractLocation($: CheerioAPI, vehicleBlock: CheerioElement): string {
    const location = $(vehicleBlock)
      .find('div.ui-search-item__group--location span.ui-search-item__location')
      .text();
    const cleanLocation = location.replace('-', ',');
    return formatLocation(cleanLocation);
  }

  private extractDescription(
    $: CheerioAPI,
    vehicleBlock: CheerioElement,
  ): string {
    const vehicleDescription = $(vehicleBlock)
      .find(
        'div.ui-search-result__content-wrapper div.ui-search-item__group--title',
      )
      .find('a')
      .attr('title')
      .replace('-', ' ');
    return vehicleDescription;
  }

  async getPages(): Promise<number[]> {
    const page = await this.browser.newPage();
    await page.goto(
      `${this.MERCADOLIBRE_URL}/autos/autos-camionetas/_OrderId_PRICE_NoIndex_True`,
      { timeout: 0 },
    );
    const html = await page.content();
    const $ = cheerio.load(html);
    const vehiclesLabel = $(
      'aside.ui-search-sidebar div.ui-search-search-result span.ui-search-search-result__quantity-results',
    ).text();
    const [totalVehicles] = vehiclesLabel.split(' ');
    const totalPages = Math.ceil(Number(totalVehicles) / ML_VEHICLES_BY_PAGE);
    this.logger.info(
      `[USED CARS] Number of pages fetched successfully: ${totalPages}`,
    );

    return getMultiplesOfFortyEight(totalPages);
  }

  private async getSyncConfig() {
    const hostname = new URL(this.MERCADOLIBRE_URL).hostname;
    const [, name] = hostname.split('.');
    const currentWebsite = await WebsiteRepository.findByName(name);
    const exchangeRate = +(await this.exchangeRateApiService.convertCurrency({
      from: PriceCurrency.PEN,
      to: PriceCurrency.USD,
    }));

    return {
      currentWebsite,
      exchangeRate,
    };
  }

  private async scrollToEndOfPage() {
    await new Promise<void>((resolve) => {
      const step = 300;
      let lastHeight = 0;
      const interval = setInterval(() => {
        const { scrollHeight } = document.body;
        let scrolled = lastHeight;
        window.scrollBy(0, step);
        scrolled += step;
        if (
          scrolled >= scrollHeight ||
          scrollHeight - window.scrollY <= window.innerHeight + step
        ) {
          clearInterval(interval);
          setTimeout(resolve, 100);
        } else {
          lastHeight = scrolled;
        }
      }, 200);
    });
  }
}
