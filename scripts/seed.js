/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

const websites = [
  { name: 'neoauto', url: String(process.env.NEOAUTO_URL) },
  { name: 'mercadolibre', url: String(process.env.MERCADOLIBRE_URL) },
  { name: 'autocosmos', url: String(process.env.AUTOCOSMOS_URL) },
];

async function main() {
  console.log('sedding data...');
  const websites = await createWebsites();
  console.log({ websites });
}

async function createWebsites() {
  const newWebs = await Promise.all(
    websites.map((website) => createWebsite(website)),
  );

  return newWebs;
}

async function createWebsite({ name, url }) {
  return prisma.website.upsert({
    where: { url },
    create: { url, uuid: randomUUID(), name },
    update: { url, name },
  });
}

main()
  .catch((e) => console.error(e))
  .finally(() => {
    prisma.$disconnect();
  });
