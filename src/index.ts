import { NeoAutoInventory } from './jobs/neoauto/neoauto-inventory.job';
import * as puppeteer from 'puppeteer';
import { Browser as PuppeteerBrowser } from 'puppeteer';
import { getLaunchOptions } from './shared/puppeteer/puppeteer-options';
import { Environment } from './shared/settings/env-config';
import { NeoautoCondition } from './jobs/neoauto/enums/neoauto.enums';

(async () => {
  const options = getLaunchOptions(process.env.NODE_ENV as Environment, []);
  const browser: PuppeteerBrowser = await puppeteer.launch(options);
  const neoautoInventory = new NeoAutoInventory(browser);

  await neoautoInventory.syncAll(NeoautoCondition.USED);
  browser.close();
})();
