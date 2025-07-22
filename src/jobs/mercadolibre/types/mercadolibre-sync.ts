import { CheerioAPI } from 'cheerio';
import { TagCurrency } from './tag-price';
import { Element } from 'domhandler';

export interface SyncMercadolibreVehicle {
  readonly $: CheerioAPI;
  readonly vehicleBlock: Element;
  readonly websiteId: string;
  readonly tagPrice: TagCurrency;
  readonly exchangeValue?: number;
}
