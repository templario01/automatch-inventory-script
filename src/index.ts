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

(async () => {
  puppeteer.use(StealthPlugin());
  const logger = winstonLogger('index.js');
  const options = getLaunchOptions(envConfig.environment, []);

  const startTime = new Date();
  const browser: PuppeteerBrowser = await puppeteer.launch(options);
  const exchangeRateService = new CurrencyConverterApiService();
  const neoautoInventory = new NeoAutoInventory(browser);
  const autocosmosInventory = new AutocosmosInventory(browser);
  const mercadolibreInventory = new MercadolibreInventory(
    browser,
    exchangeRateService,
  );
  const autopiaInventory = new AutopiaInventory(browser);

  logger.info('Browser ready to start jobs.');
  await Promise.all([
    autopiaInventory.syncAll(),
    /*   neoautoInventory.syncAll(NeoautoCondition.NEW),
    neoautoInventory.syncAll(NeoautoCondition.USED),
    autocosmosInventory.syncAll(AutocosmosCondition.NEW),
    autocosmosInventory.syncAll(AutocosmosCondition.USED),
    mercadolibreInventory.syncAll(), */
  ]);

  browser.close().then(() => {
    const endTime = new Date();
    const duration = getDurationTime(startTime, endTime);
    logger.info(`CronJobs finished successfully. time taken: ${duration}`);
    process.exit(0);
  });
})();
