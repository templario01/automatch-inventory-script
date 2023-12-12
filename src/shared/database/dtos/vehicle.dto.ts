import { PriceCurrency } from '../../enums/currency.enum';
import { Condition } from '../../enums/vehicle.enum';

class VehicleSyncDto {
  readonly external_id: string;
  readonly url: string;
  readonly description?: string;
  readonly year?: number;
  readonly transmission?: string;
  readonly mileage?: number;
  readonly speeds?: number;
  readonly front_image?: string;
  readonly images?: string;
  readonly price?: number;
  readonly original_price?: number;
  readonly currency?: PriceCurrency;
  readonly doors?: number;
  readonly condition?: Condition;
  readonly location?: string;
}

export class CreateVehicleDto {
  readonly vehicle: VehicleSyncDto;
  readonly website_id: number;
}

export class UpdateInventoryStatusDto {
  readonly syncedVehiclesIds: string[];
  readonly websiteId: number;
  readonly condition?: Condition;
}
