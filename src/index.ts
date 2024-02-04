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

(async () => {
  puppeteer.use(StealthPlugin());
  const logger = winstonLogger('index.js');
  const options = getLaunchOptions(envConfig.environment, []);
  const browser: PuppeteerBrowser = await puppeteer.launch(options);
  const exchangeRateService = new CurrencyConverterApiService();
  const neoautoInventory = new NeoAutoInventory(browser);
  const autocosmosInventory = new AutocosmosInventory(browser);
  const mercadolibreInventory = new MercadolibreInventory(
    browser,
    exchangeRateService,
  );

  logger.info('Browser ready to start jobs.');
  await Promise.all([
    neoautoInventory.syncAll(NeoautoCondition.NEW),
    neoautoInventory.syncAll(NeoautoCondition.USED),
    autocosmosInventory.syncAll(AutocosmosCondition.NEW),
    autocosmosInventory.syncAll(AutocosmosCondition.USED),
    mercadolibreInventory.syncAll(),
  ]);

  browser.close().then(() => {
    logger.info('CronJobs finished successfully.');
    process.exit(0);
  });
})();
