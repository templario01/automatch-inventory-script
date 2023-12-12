import { website } from '@prisma/client';
import { prisma } from '../prisma';

export class WebsiteRepository {
  static async find(): Promise<website[]> {
    return prisma.website.findMany();
  }

  static async findById(id: number): Promise<website> {
    return prisma.website.findUnique({ where: { id } });
  }

  static async findByName(name: string): Promise<website> {
    return prisma.website.findUnique({
      where: {
        name,
      },
    });
  }
}
