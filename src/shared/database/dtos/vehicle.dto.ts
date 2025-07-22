import { Prisma } from '@prisma/client';
import { PriceCurrency } from '../../enums/currency.enum';
import { Condition } from '../../enums/vehicle.enum';

class VehicleSyncDto {
  readonly externalId: string;
  readonly url: string;
  readonly description?: string;
  readonly name?: string;
  readonly year?: number;
  readonly transmission?: string;
  readonly mileage?: number;
  readonly speeds?: number;
  readonly frontImage?: string;
  readonly images?: string;
  readonly price?: number;
  readonly originalPrice?: number;
  readonly currency?: PriceCurrency;
  readonly doors?: number;
  readonly condition?: Condition;
  readonly location?: string;
}

export class CreateVehicleDto {
  readonly vehicle: VehicleSyncDto;
  readonly website_id: string;
}

export class UpdateInventoryStatusDto {
  readonly syncedVehiclesIds: string[];
  readonly websiteId: string;
  readonly condition?: Condition;
}

export type VehicleWithWebsite = Prisma.VehicleGetPayload<{
  include: { website: true };
}>;