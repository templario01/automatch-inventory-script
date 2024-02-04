/* eslint-disable @typescript-eslint/no-unused-vars */
import { Cheerio, CheerioAPI, Element as CheerioElement } from 'cheerio';
import * as cheerio from 'cheerio';
import { Browser as PuppeteerBrowser, Page } from 'puppeteer';
import { Logger } from 'winston';
import { winstonLogger } from '../../shared/logger/winston.logger';
import { envConfig } from '../../shared/settings/env-config';
import { CurrencyConverterApiService } from '../../shared/services/currency-converter.service';
import { InventoryJob } from '../../shared/interfaces/sync-inventory.interface';
import { WebsiteRepository } from '../../shared/database/repositories/website.repository';
import { getMultiplesOfFortyEight } from './utils/get-pages.utils';
import { convertToNumber, parsePrice } from './utils/vehicle.utils';
import { Vehicle } from '@prisma/client';
import { PriceCurrency } from '../../shared/enums/currency.enum';
import { SyncMercadolibreVehicle } from './types/mercadolibre-sync';
import { VehicleRepository } from '../../shared/database/repositories/vehicle.repository';
import { Condition } from '../../shared/enums/vehicle.enum';
import { CreateVehicleDto } from '../../shared/database/dtos/vehicle.dto';
import { formatLocation } from '../../shared/utils/extract-vehicle-data';

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
      const syncedVehiclesIds: Array<string> = [];
      const { currentWebsite, exchangeRate } = await this.getSyncConfig();
      const pages = await this.getPages(this.browser);
      const page: Page = await this.browser.newPage();

      for (const vehicleNumber of pages) {
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

        vehicleBlocks.map(async (_index, element) => {
          const priceHtml = $(element).find(
            'div.ui-search-price div.ui-search-price__second-line span.andes-money-amount span.andes-money-amount__fraction',
          );
          const tagPriceHtml = $(element).find(
            'div.ui-search-price div.ui-search-price__second-line span.andes-money-amount span.andes-money-amount__currency-symbol',
          );
          const tagPrice = tagPriceHtml.html().trim();
          const price = parsePrice(priceHtml.html());
          let syncedVehicle: Vehicle;

          if (tagPrice === 'S/' && price >= PRICE_LIMIT_PEN) {
            syncedVehicle = await this.SyncVehicleByCurrency(
              {
                parentHtml: $,
                currency: PriceCurrency.PEN,
                websiteId: currentWebsite.id,
                vehicleBlock: element,
                price,
              },
              exchangeRate,
            );
          } else if (tagPrice === 'U$S' && price >= PRICE_LIMIT_USD) {
            syncedVehicle = await this.SyncVehicleByCurrency({
              parentHtml: $,
              currency: PriceCurrency.USD,
              websiteId: currentWebsite.id,
              vehicleBlock: element,
              price,
            });
          }
          if (syncedVehicle) {
            syncedVehiclesIds.push(syncedVehicle.externalId);
            this.logger.verbose(
              `[USED CAR] Vehicle synced: ${syncedVehicle?.url}`,
            );
          }
        });
      }
      const deletedCars = await VehicleRepository.updateStatusForAllInventory({
        syncedVehiclesIds,
        websiteId: currentWebsite.id,
      });
      this.logger.info(
        `[USED CARS] Job to sync vehicles finished successfully, deleted cars: ${deletedCars.count}`,
      );
    } catch (error) {
      this.logger.error('fail to sync all inventory', error);
    }
  }

  async SyncVehicleByCurrency(
    data: SyncMercadolibreVehicle,
    exchangeValue?: number,
  ): Promise<Vehicle> {
    try {
      const { parentHtml, vehicleBlock, websiteId, price, currency } = data;
      const vehicleUrl = parentHtml(vehicleBlock)
        .find(
          'div.ui-search-result__content-wrapper div.ui-search-item__group--title',
        )
        .find('a')
        .attr('href');
      const [, externalId] = vehicleUrl.split('tracking_id=');
      const vehicleImageUrl = parentHtml(vehicleBlock)
        .find(
          'div.andes-carousel-snapped__controls-wrapper div.andes-carousel-snapped div.andes-carousel-snapped__wrapper div.andes-carousel-snapped__slide',
        )
        .find('img')
        .attr('src');
      const year = parentHtml(vehicleBlock)
        .find(
          'div.ui-search-item__group--attributes ul.ui-search-card-attributes li.ui-search-card-attributes__attribute',
        )
        .html();
      const mileage = parentHtml(vehicleBlock)
        .find(
          'div.ui-search-item__group--attributes ul.ui-search-card-attributes li.ui-search-card-attributes__attribute',
        )
        .text();

      const location = parentHtml(vehicleBlock)
        .find(
          'div.ui-search-item__group--location span.ui-search-item__location',
        )
        .text();
      const vehicleName = parentHtml(vehicleBlock)
        .find(
          'div.ui-search-result__content-wrapper div.ui-search-item__group--title',
        )
        .find('a')
        .attr('title');

      const createVehicle: CreateVehicleDto = {
        vehicle: {
          externalId,
          url: vehicleUrl,
          location: formatLocation(location.replace('-', ',')),
          frontImage: vehicleImageUrl,
          condition: Condition.USED,
          year: +year,
          name: vehicleName,
          mileage: convertToNumber(mileage),
          originalPrice: price,
          price: exchangeValue ? price * exchangeValue : price,
          currency,
        },
        website_id: websiteId,
      };

      return VehicleRepository.upsert(createVehicle);
    } catch (error) {
      this.logger.error(`fail to sync vehicle, `, error);
    }
  }

  async getPages(browser: PuppeteerBrowser): Promise<number[]> {
    const page = await browser.newPage();
    await page.goto(
      `${this.MERCADOLIBRE_URL}/autos/autos-camionetas/_OrderId_PRICE_NoIndex_True`,
      { timeout: 0 },
    );
    const html = await page.content();
    const $ = cheerio.load(html);
    const totalPages = $('ul > li.andes-pagination__button').eq(-2).text();

    return getMultiplesOfFortyEight(+totalPages);
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
