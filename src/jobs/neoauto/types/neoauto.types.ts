import { Browser } from 'puppeteer';
import { CheerioAPI } from 'cheerio';
import { Condition } from '../../../shared/enums/vehicle.enum';
import { Element } from 'domhandler';

export interface SyncNeoautoPageParams {
  readonly browser: Browser;
  readonly cheerioInstance$: CheerioAPI;
  readonly mainHtml: Element;
  readonly websiteId?: number;
}

export interface SyncNeoautoVehicle {
  readonly imageUrl?: string;
  readonly vehicleUrl?: string;
  readonly vehiclePrice?: number;
  readonly websiteId?: string;
  readonly description?: string;
  readonly mileage?: number;
  readonly location?: string;
  readonly vehicleName?: string;
  readonly condition?: Condition
}

export type VehicleBrandAndModel = {
  readonly brand: string;
  readonly modelWithYear: string;
  readonly id: string;
};
