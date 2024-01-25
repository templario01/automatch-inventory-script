import { Website } from '@prisma/client';
import { prisma } from '../prisma';

export class WebsiteRepository {
  static async find(): Promise<Website[]> {
    return prisma.website.findMany();
  }

  static async findById(id: string): Promise<Website> {
    return prisma.website.findUnique({ where: { id } });
  }

  static async findByName(name: string): Promise<Website> {
    return prisma.website.findUnique({
      where: {
        name,
      },
    });
  }
}
