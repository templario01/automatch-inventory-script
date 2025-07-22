import { NeoAutoInventory } from './jobs/neoauto/neoauto-inventory.job';
import puppeteer from 'puppeteer-extra';
import { Browser as PuppeteerBrowser } from 'puppeteer';
import { getLaunchOptions } from './shared/puppeteer/puppeteer-options';
import { envConfig } from './shared/settings/env-config';
import { NeoautoCondition } from './jobs/neoauto/enums/neoauto.enums';
import { winstonLogger } from './shared/logger/winston.logger';
import { AutocosmosInventory } from './jobs/autocosmos/autocosmos-inventory.job';
import { AutocosmosCondition } from './jobs/autocosmos/enums/autocosmos.enum';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { CurrencyConverterApiService } from './shared/services/currency-converter.service';
import { MercadolibreInventory } from './jobs/mercadolibre/mercadolibre-inventory.job';
import { getDurationTime } from './shared/utils/time';
import { AutopiaInventory } from './jobs/autopia/autopia-inventory.job';
import { RabbitMqService } from './shared/services/rabbitmq/rabbitmq.service';
import { VehicleRepository } from './shared/database/repositories/vehicle.repository';

(async () => {
  puppeteer.use(StealthPlugin());
  const logger = winstonLogger('index.js');
  const options = getLaunchOptions(envConfig.environment, []);
  const rabbitMqQueueName = envConfig.rabbitMqConfig.queueName;

  const startTime = new Date();
  const browser: PuppeteerBrowser = await puppeteer.launch(options);
  const rabbitMqService = new RabbitMqService();
  await rabbitMqService.connect();
  const exchangeRateService = new CurrencyConverterApiService();
  const autopiaInventory = new AutopiaInventory(browser);
  const neoautoInventory = new NeoAutoInventory(browser);
  const autocosmosInventory = new AutocosmosInventory(browser);
  const mercadolibreInventory = new MercadolibreInventory(
    browser,
    exchangeRateService,
  );

  logger.info('Browser ready to start jobs.');
  // Use secuential await instead Promise.all(), this prevent open a new Chrome Tab for each .syncAll() call
  await autopiaInventory.syncAll();
  await mercadolibreInventory.syncAll();
  await neoautoInventory.syncAll(NeoautoCondition.NEW);
  await neoautoInventory.syncAll(NeoautoCondition.USED);
  await autocosmosInventory.syncAll(AutocosmosCondition.NEW);
  await autocosmosInventory.syncAll(AutocosmosCondition.USED);

  const soldVehicles = await VehicleRepository.getSoldVehicles()
  await rabbitMqService.createQueue(rabbitMqQueueName)
  await rabbitMqService.sendToQueue(rabbitMqQueueName, { data: soldVehicles });
  logger.info(`Sold vehicles sent to RabbitMQ queue: ${rabbitMqQueueName}`);
  await rabbitMqService.close();

  browser.close().then(() => {
    const endTime = new Date();
    const duration = getDurationTime(startTime, endTime);
    logger.info(`CronJobs finished successfully. time taken: ${duration}`);
    process.exit(0);
  });
})();
