import { Prisma, Vehicle } from '@prisma/client';
import { prisma } from '../prisma';
import {
  CreateVehicleDto,
  UpdateInventoryStatusDto,
} from '../dtos/vehicle.dto';
import { VehicleStatusEnum } from '../../enums/vehicle.enum';
import { winstonLogger } from '../../logger/winston.logger';
import { Logger } from 'winston';

export class VehicleRepository {
  private static readonly logger: Logger = winstonLogger(
    VehicleRepository.name,
  );
  static async upsert(data: CreateVehicleDto): Promise<Vehicle | null> {
    try {
      const { vehicle, website_id } = data;
      const upsert = await prisma.vehicle.upsert({
        where: {
          externalId: vehicle?.externalId,
        },
        create: {
          ...vehicle,
          websiteId: website_id,
          status: VehicleStatusEnum.ACTIVE,
        },
        update: {
          ...vehicle,
          websiteId: website_id,
          status: VehicleStatusEnum.ACTIVE,
        },
      });
      return upsert;
    } catch (error) {
      this.logger.error({
        msg: `fail to upsert vehicle: ${data?.vehicle?.externalId}`,
        error,
      });
      return null;
    }
  }

  static async updateStatusForAllInventory(
    data: UpdateInventoryStatusDto,
  ): Promise<Prisma.BatchPayload> {
    const { syncedVehiclesIds, websiteId, condition } = data;
    const result = await prisma.vehicle.updateMany({
      where: {
        website: {
          id: websiteId,
        },
        externalId: {
          notIn: syncedVehiclesIds,
        },
        status: VehicleStatusEnum.ACTIVE,
        ...(condition && { condition }),
      },
      data: {
        status: VehicleStatusEnum.INACTIVE,
      },
    });

    return result;
  }
}
