import { PuppeteerLaunchOptions } from 'puppeteer';
import { Environment } from '../settings/env-config';

export const getLaunchOptions = (
  environment: Environment,
  proxy: string[] = [],
): PuppeteerLaunchOptions => ({
  args: [
    '--single-proces',
    '--no-sandbox',
    '--no-zygote',
    '--enable-blink-features=HTMLImports',
    ...proxy,
  ],
  ...(environment === Environment.PROD && {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  }),
  headless: 'new',
});
