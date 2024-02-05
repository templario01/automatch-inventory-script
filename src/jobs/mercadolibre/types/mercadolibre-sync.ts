import { CheerioAPI, Element as CheerioElement } from 'cheerio';
import { TagCurrency } from './tag-price';

export interface SyncMercadolibreVehicle {
  readonly $: CheerioAPI;
  readonly vehicleBlock: CheerioElement;
  readonly websiteId: string;
  readonly tagPrice: TagCurrency;
  readonly exchangeValue?: number;
}
