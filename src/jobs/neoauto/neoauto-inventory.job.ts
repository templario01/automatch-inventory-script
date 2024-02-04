import { Cheerio, CheerioAPI, Element as CheerioElement } from 'cheerio';
import * as cheerio from 'cheerio';
import { Browser as PuppeteerBrowser, Page } from 'puppeteer';
import { envConfig } from '../../shared/settings/env-config';
import { Vehicle } from '@prisma/client';
import { USER_AGENT } from '../../shared/puppeteer/puppeteer.constants';
import { SyncNeoautoVehicle } from './types/neoauto.types';
import { VehicleRepository } from '../../shared/database/repositories/vehicle.repository';
import { WebsiteRepository } from '../../shared/database/repositories/website.repository';
import {
  OR,
  HTML_MOUNT,
  HTML_MOUNT_PRICE,
  HTML_IMAGE_V2,
  HTML_URL_V2,
  HTML_DESCRIPTION_V2,
  HTML_MILEAGE_V2,
  HTML_LOCATION_V2,
} from './constants/neoauto.constants';
import {
  getModelAndYearFromUrl,
  getVehicleInfoByNeoauto,
  parsePrice,
} from './utils/neoauto.utils';
import { winstonLogger } from '../../shared/logger/winston.logger';
import { Logger } from 'winston';
import { PriceCurrency } from '../../shared/enums/currency.enum';
import { Condition } from '../../shared/enums/vehicle.enum';
import { NeoautoCondition } from './enums/neoauto.enums';
import { CreateVehicleDto } from '../../shared/database/dtos/vehicle.dto';
import {
  getEnumKeyByValue,
  getMileage,
} from '../../shared/utils/extract-vehicle-data';
import { InventoryJob } from '../../shared/interfaces/sync-inventory.interface';
import { getDurationTime } from '../../shared/utils/time';

export class NeoAutoInventory implements InventoryJob {
  private readonly NEOAUTO_URL: string = envConfig.neoauto;
  private readonly logger: Logger = winstonLogger(NeoAutoInventory.name);

  constructor(private readonly browser: PuppeteerBrowser) {}

  async syncAll(vehicleCondition: NeoautoCondition): Promise<void> {
    try {
      const startTime = new Date();
      const syncedVehiclesIds: string[] = [];
      const { condition, currentUrl, currentWebsite } =
        await this.getSyncConfig(vehicleCondition);
      const totalPages = await this.getPages(vehicleCondition);
      this.logger.info(
        `[${condition} CARS] Number of pages fetched successfully: ${totalPages}`,
      );
      const page: Page = await this.browser.newPage();

      for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
        await page.goto(`${currentUrl}?page=${currentPage}`, { timeout: 0 });
        const html: string = await page.content();
        const $: CheerioAPI = cheerio.load(html);
        const vehiclesBlock: Cheerio<CheerioElement> = $(
          'div.s-search div.s-container div.s-results article.c-results',
        );

        for (const vehicleHtmlBlock of vehiclesBlock) {
          const vehiclePrice = this.extractPrice($, vehicleHtmlBlock);
          if (vehiclePrice !== undefined) {
            const imageUrl = this.extractImageUrl($, vehicleHtmlBlock);
            const vehicleUrl = this.extractVehicleUrl($, vehicleHtmlBlock);
            const description = this.extractDescription($, vehicleHtmlBlock);
            const mileage = this.extractMileage($, vehicleHtmlBlock);
            const location = this.extractLocation($, vehicleHtmlBlock);
            const vehicleName = this.extractName(vehicleUrl);
            const neoautoVehicle: SyncNeoautoVehicle = {
              vehicleName,
              location,
              imageUrl,
              vehiclePrice,
              vehicleUrl,
              description,
              websiteId: currentWebsite.id,
              mileage,
            };

            const carSynced = await this.syncVehicle(
              neoautoVehicle,
              vehicleCondition,
            );

            if (carSynced) {
              syncedVehiclesIds.push(carSynced.externalId);
            }
          }
        }
        const carsSynced = currentPage * vehiclesBlock.length;
        const percent = Number(((currentPage / totalPages) * 100).toFixed(2));
        this.logger.info(
          `[${condition} CARS] total vehicles synced = ${carsSynced} (${percent}%)`,
        );
      }
      const deletedCars = await VehicleRepository.updateStatusForAllInventory({
        syncedVehiclesIds,
        websiteId: currentWebsite.id,
        condition,
      });
      const endTime = new Date();
      const duration = getDurationTime(startTime, endTime);
      this.logger.info(
        `[${condition} CARS] Job to sync vehicles finished successfully, deleted cars: ${deletedCars.count}, elapsed time: ${duration}`,
      );
    } catch (error) {
      this.logger.error('fail to sync all inventory', error);
    }
  }

  private async syncVehicle(
    data: SyncNeoautoVehicle,
    condition: NeoautoCondition,
  ): Promise<Vehicle> {
    try {
      const {
        vehicleName,
        imageUrl,
        vehicleUrl,
        vehiclePrice,
        websiteId,
        description,
        mileage,
        location,
      } = data;
      const { modelWithYear, id } = getVehicleInfoByNeoauto(vehicleUrl);
      const { year } = getModelAndYearFromUrl(modelWithYear);

      const vehicleInfo: CreateVehicleDto = {
        vehicle: {
          location,
          description,
          mileage: condition === NeoautoCondition.USED ? mileage : 0,
          condition:
            condition === NeoautoCondition.NEW ? Condition.NEW : Condition.USED,
          externalId: id,
          frontImage: imageUrl,
          url: vehicleUrl,
          price: vehiclePrice,
          originalPrice: vehiclePrice,
          currency: PriceCurrency.USD,
          name: vehicleName,
          year: +year,
        },
        website_id: websiteId,
      };

      return VehicleRepository.upsert(vehicleInfo);
    } catch (error) {
      this.logger.error(
        `fail to sync vehicle, ${data?.vehicleUrl || ''}`,
        error,
      );
    }
  }

  private extractPrice(
    page: CheerioAPI,
    htmlElement: CheerioElement,
  ): number | undefined {
    const price = page(htmlElement)
      .find(HTML_MOUNT + OR + HTML_MOUNT_PRICE)
      .html();
    if (price === null || price.toLowerCase().includes('consultar')) {
      return undefined;
    }
    const parsedPrice = parsePrice(price);

    return parsedPrice;
  }

  private extractImageUrl(
    page: CheerioAPI,
    htmlElement: CheerioElement,
  ): string | undefined {
    const vehicleHtmlImage = page(htmlElement).find(HTML_IMAGE_V2);
    const imageUrl = vehicleHtmlImage.attr('data-src');

    return imageUrl;
  }

  private extractVehicleUrl(
    page: CheerioAPI,
    htmlElement: CheerioElement,
  ): string | undefined {
    const vehiclePath = page(htmlElement).find(HTML_URL_V2).attr('href');
    const vehicleUrl = `${this.NEOAUTO_URL}/${vehiclePath}`;

    return vehicleUrl;
  }

  private extractName(url: string): string {
    const urlBrokenInParts = url.split('/');
    const vehicleWithId = urlBrokenInParts[urlBrokenInParts.length - 1];
    const vehicleWithoutId = vehicleWithId.replace(/-(\d+)$/, '');
    const vehicleName = vehicleWithoutId.replace(/-/g, ' ');

    return vehicleName;
  }

  private extractDescription(
    page: CheerioAPI,
    htmlElement: CheerioElement,
  ): string | undefined {
    const description = page(htmlElement)
      .find(HTML_DESCRIPTION_V2)
      .html()
      .trim();
    if (description.length === 0) return;

    return description;
  }

  private extractMileage(
    page: CheerioAPI,
    htmlElement: CheerioElement,
  ): number | undefined {
    const [mileageHtmlText] = page(htmlElement)
      .find(HTML_MILEAGE_V2)
      .filter((_, element) => {
        return page(element).text().includes('Kms');
      });
    const mileage = page(mileageHtmlText)
      .clone()
      .children()
      .remove()
      .end()
      .text();
    const parsedMileage = getMileage(mileage);

    return parsedMileage;
  }

  private extractLocation(
    page: CheerioAPI,
    htmlElement: CheerioElement,
  ): string | undefined {
    const location = page(htmlElement).find(HTML_LOCATION_V2).html();

    return location;
  }

  private async getPages(condition: string): Promise<number> {
    const puppeteerPage: Page = await this.browser.newPage();

    await puppeteerPage.setExtraHTTPHeaders({
      'User-Agent': USER_AGENT,
      Referer: this.NEOAUTO_URL,
    });
    await puppeteerPage.goto(
      `${this.NEOAUTO_URL}/venta-de-autos-${condition}?page=1`,
      { timeout: 0 },
    );

    const html: string = await puppeteerPage.content();
    const $: CheerioAPI = cheerio.load(html);

    const lastPaginationBtn = $('li.c-pagination-content__btn')
      .last()
      .find('a');
    const paginationUrl = lastPaginationBtn.attr('href');
    const [, maxPages] = paginationUrl.split('page=');

    return +maxPages;
  }

  private async getSyncConfig(Condition: NeoautoCondition) {
    const condition = getEnumKeyByValue(
      NeoautoCondition,
      Condition,
    ) as Condition;
    const hostname = new URL(this.NEOAUTO_URL).hostname;
    const [name] = hostname.split('.');
    const currentWebsite = await WebsiteRepository.findByName(name);

    const currentUrl = `${this.NEOAUTO_URL}/venta-de-autos-${Condition}`;

    return {
      condition,
      currentWebsite,
      currentUrl,
    };
  }
}
