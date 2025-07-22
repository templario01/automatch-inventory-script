import { LaunchOptions } from 'puppeteer';
import { Environment } from '../settings/env-config';

export const getLaunchOptions = (
  environment: Environment,
  proxy: string[] = [],
): LaunchOptions => ({
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--enable-blink-features=HTMLImports',
    '--single-proces',
    '--disable-gpu',
    ...proxy,
  ],
  ...(environment === Environment.PROD && {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  }),
  headless: true,
});
