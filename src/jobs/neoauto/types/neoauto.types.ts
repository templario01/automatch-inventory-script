import { Browser } from 'puppeteer';
import { Element, CheerioAPI } from 'cheerio';

export interface SyncNeoautoVehicle {
  readonly imageUrl?: string;
  readonly vehicleUrl?: string;
  readonly vehiclePrice?: number;
  readonly websiteId?: number;
  readonly vehicleDescription?: string;
  readonly mileage?: number;
  readonly location?: string;
}

export interface SyncNeoautoPageParams {
  readonly browser: Browser;
  readonly cheerioInstance$: CheerioAPI;
  readonly mainHtml: Element;
  readonly websiteId?: number;
}

export interface SyncNeoautoVehicle {
  readonly imageUrl?: string;
  readonly vehicleURL?: string;
  readonly vehiclePrice?: number;
  readonly websiteId?: number;
  readonly vehicleDescription?: string;
  readonly mileage?: number;
  readonly location?: string;
}

export type VehicleBrandAndModel = {
  readonly brand: string;
  readonly modelWithYear: string;
  readonly id: string;
};
