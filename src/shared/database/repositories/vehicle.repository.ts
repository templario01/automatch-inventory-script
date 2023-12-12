import { Prisma, vehicle } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma } from '../prisma';
import {
  CreateVehicleDto,
  UpdateInventoryStatusDto,
} from '../dtos/vehicle.dto';
import { VehicleStatusEnum } from '../../enums/vehicle.enum';

export class VehicleRepository {
  static async upsert(data: CreateVehicleDto): Promise<vehicle | null> {
    try {
      const { vehicle, website_id } = data;
      const upsert = await prisma.vehicle.upsert({
        where: {
          external_id: vehicle?.external_id,
        },
        create: {
          ...vehicle,
          uuid: randomUUID(),
          website_id,
          status: 'ACTIVE',
        },
        update: {
          ...vehicle,
          website_id,
          status: 'ACTIVE',
        },
      });
      return upsert;
    } catch (error) {
      return null;
    }
  }

  static async updateStatusForAllInventory(
    data: UpdateInventoryStatusDto,
  ): Promise<Prisma.BatchPayload> {
    const { syncedVehiclesIds, websiteId, condition } = data;
    return prisma.vehicle.updateMany({
      where: {
        AND: [
          {
            website: {
              id: websiteId,
            },
          },
          {
            external_id: {
              notIn: syncedVehiclesIds,
            },
          },
          { ...(condition && { condition }) },
        ],
      },
      data: {
        status: VehicleStatusEnum.INACTIVE,
      },
    });
  }
}
