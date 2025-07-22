import { Logger } from 'winston';
import { winstonLogger } from '../../shared/logger/winston.logger';
import { envConfig } from '../../shared/settings/env-config';
import { Browser as PuppeteerBrowser, Page } from 'puppeteer';
import { CheerioAPI, Cheerio, Element as CheerioElement } from 'cheerio';
import * as cheerio from 'cheerio';
import { CreateVehicleDto } from '../../shared/database/dtos/vehicle.dto';
import { WebsiteRepository } from '../../shared/database/repositories/website.repository';
import { Condition } from '../../shared/enums/vehicle.enum';
import { PriceCurrency } from '../../shared/enums/currency.enum';
import { VehicleRepository } from '../../shared/database/repositories/vehicle.repository';
import { getDurationTime } from '../../shared/utils/time';

export class AutopiaInventory {
  private readonly AUTOPIA_URL: string = envConfig.autopia;
  private readonly logger: Logger = winstonLogger(AutopiaInventory.name);

  constructor(private readonly browser: PuppeteerBrowser) {}

  async syncAll(): Promise<void> {
    try {
      const startTime = new Date();
      const syncedVehiclesIds: string[] = [];
      const hostname = new URL(this.AUTOPIA_URL).hostname;
      const [name] = hostname.split('.');
      const currentWebsite = await WebsiteRepository.findByName(name);

      const page: Page = await this.browser.newPage();
      await page.goto(`${this.AUTOPIA_URL}/resultados`, { timeout: 0 });
      await page.evaluate(this.scrollToEndOfPage);


            const html0: string = await page.content();
      const $0: CheerioAPI = cheerio.load(html0);
            const carsElements0: Cheerio<CheerioElement> = $0(
        'div.search-results div.car-card',
      );
      console.log(carsElements0.html());

      let { loadedElements, totalElements } =
        await this.getLoadedElements(page);

      while (loadedElements < totalElements) {
        await page.click('div.fetch-canvas button');
        await page.evaluate(this.scrollToEndOfPage);
        ({ loadedElements, totalElements } =
          await this.getLoadedElements(page));
      }

      const html: string = await page.content();
      const $: CheerioAPI = cheerio.load(html);
      const carsElements: Cheerio<CheerioElement> = $(
        'div.search-results div.car-card',
      );
      await this.proccessCarsElements(
        $,
        carsElements,
        currentWebsite.id,
        syncedVehiclesIds,
      );
      const deletedCars = await VehicleRepository.updateStatusForAllInventory({
        syncedVehiclesIds,
        websiteId: currentWebsite.id,
      });
      const endTime = new Date();
      const duration = getDurationTime(startTime, endTime);
      this.logger.info(
        `[ALL CARS] Job to sync vehicles finished successfully, deleted cars: ${deletedCars.count}, elapsed time: ${duration}`,
      );
    } catch (error) {
      this.logger.error('fail to sync all inventory', error);
    }
  }

  private async getLoadedElements(
    page: Page,
  ): Promise<{ loadedElements: number; totalElements: number }> {
    const html = await page.content();
    const $ = cheerio.load(html);
    const element = $('div.fetch-cars').find('p');
    console.log(element.html());
    const matchNumbers = element.html().match(/\d+/g);
    const [loadedElements, totalElements] = matchNumbers
      ? matchNumbers.map(Number)
      : [undefined, undefined];
    return { loadedElements, totalElements };
  }

  private async proccessCarsElements(
    $: CheerioAPI,
    carsElements: Cheerio<CheerioElement>,
    websiteId: string,
    syncedVehiclesIds: string[],
  ): Promise<void> {
    await Promise.all(
      carsElements.map(async (_, elem) => {
        const vehicleUrl = $(elem).find('a').attr('href');
        if (vehicleUrl !== '#') {
          const frontImage = $(elem).find('a div.position img').attr('src');
          const vehicleResource = vehicleUrl.split('/');
          const vehicleIdPart =
            vehicleResource[vehicleResource.length - 1].split('-');
          const externalId = vehicleIdPart[vehicleIdPart.length - 1];
          const yearHtml = $(elem).find('a div.position div p').html();
          const regex = /(\d{1,3}(,\d{3})*|\d+)\b/g;
          const [usdAmmount, penAmmount, year] = yearHtml
            .match(regex)
            .map((match) => parseInt(match.replace(/,/g, ''), 10));
          const name = $(elem).find('a div.position div h3').html();
          const categorie = $(elem)
            .find('a div.position div div.small-details span')
            .text();

          const mileageHtml = $(elem)
            .find('a div.resume div.data')
            .first()
            .find('span')
            .text();
          const mileage = mileageHtml
            .replace(/\./g, '')
            .replace('km', '')
            .trim();
          const createVehicle: CreateVehicleDto = {
            vehicle: {
              externalId,
              url: `${this.AUTOPIA_URL}${vehicleUrl}`,
              frontImage: frontImage,
              condition: Condition.USED,
              location: 'Lima',
              year,
              name,
              description: `${categorie} ${name}`,
              mileage: Number(mileage),
              originalPrice: penAmmount,
              price: usdAmmount,
              currency: PriceCurrency.USDPEN,
            },
            website_id: websiteId,
          };

          const carSynced = await VehicleRepository.upsert(createVehicle);
          if (carSynced) {
            this.logger.info(`[USED CARS] Vehicle synced: ${carSynced.url}`);
            syncedVehiclesIds.push(carSynced.externalId);
          }
        }
      }),
    );
  }

  private async scrollToEndOfPage(): Promise<void> {
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
