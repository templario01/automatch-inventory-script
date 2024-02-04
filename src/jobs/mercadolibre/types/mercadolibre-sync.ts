import { CheerioAPI, Element as CheerioElement } from 'cheerio';
import { PriceCurrency } from '../../../shared/enums/currency.enum';
import { TagCurrency } from './tag-price';

export interface SyncMercadolibreVehicle {
  readonly parentHtml: CheerioAPI;
  readonly vehicleBlock: CheerioElement;
  readonly price: number;
  readonly websiteId: string;
  readonly currency: PriceCurrency;
  readonly tagPrice: TagCurrency;
}
