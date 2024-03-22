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

export class AutopiaInventory {
  private readonly AUTOPIA_URL: string = envConfig.autopia;
  private readonly logger: Logger = winstonLogger(AutopiaInventory.name);

  constructor(private readonly browser: PuppeteerBrowser) {}
  async getPages(): Promise<number | number[]> {
    return;
  }
  async syncAll(): Promise<void> {
    const hostname = new URL(this.AUTOPIA_URL).hostname;
    const [name] = hostname.split('.');
    const currentWebsite = await WebsiteRepository.findByName(name);

    const page: Page = await this.browser.newPage();
    await page.goto(`${this.AUTOPIA_URL}/resultados`, { timeout: 0 });
    await page.evaluate(this.scrollToEndOfPage);

    let html: string;
    let $: CheerioAPI;
    let element: Cheerio<CheerioElement>;
    let matchNumbers: RegExpMatchArray;
    let loadedElements = -1;
    let totalElements = 0;

    html = await page.content();
    $ = cheerio.load(html);

    element = $('div.fetch-cars').find('p');
    matchNumbers = element.html().match(/\d+/g);
    [loadedElements, totalElements] = matchNumbers
      ? matchNumbers.map(Number)
      : [undefined, undefined];

    while (loadedElements < totalElements) {
      await page.click('div.fetch-canvas button');
      await page.evaluate(this.scrollToEndOfPage);
      html = await page.content();
      $ = cheerio.load(html);

      element = $('div.fetch-cars').find('p');
      matchNumbers = element.html().match(/\d+/g);
      [loadedElements, totalElements] = matchNumbers
        ? matchNumbers.map(Number)
        : [undefined, undefined];
    }

    const carsElements = $('div.search-results div.car-card');

    await Promise.all(
      carsElements.map(async (i, elem) => {
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
            website_id: currentWebsite.id,
          };

          VehicleRepository.upsert(createVehicle);
        }
      }),
    );
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
