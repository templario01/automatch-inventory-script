import { NeoAutoInventory } from './jobs/neoauto/neoauto-inventory.job';
import * as puppeteer from 'puppeteer';
import { Browser as PuppeteerBrowser } from 'puppeteer';
import { getLaunchOptions } from './shared/puppeteer/puppeteer-options';
import { envConfig } from './shared/settings/env-config';
import { NeoautoCondition } from './jobs/neoauto/enums/neoauto.enums';
import { winstonLogger } from './shared/logger/winston.logger';

(async () => {
  const logger = winstonLogger('index.js');
  const options = getLaunchOptions(envConfig.environment, []);
  const browser: PuppeteerBrowser = await puppeteer.launch(options);
  const neoautoInventory = new NeoAutoInventory(browser);

  logger.info('Browser ready to start jobs.');

  await Promise.all([
    neoautoInventory.syncAll(NeoautoCondition.NEW),
    neoautoInventory.syncAll(NeoautoCondition.USED),
  ]);

  browser.close().then(() => {
    logger.info('CronJobs finished successfully.');
    process.exit(0);
  });
})();
