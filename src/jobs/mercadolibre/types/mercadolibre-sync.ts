import { CheerioAPI, Element as CheerioElement } from 'cheerio';
import { PriceCurrency } from '../../../shared/enums/currency.enum';

export interface SyncMercadolibreVehicle {
  readonly parentHtml: CheerioAPI;
  readonly vehicleBlock: CheerioElement;
  readonly price: number;
  readonly websiteId: string;
  readonly currency: PriceCurrency;
}
