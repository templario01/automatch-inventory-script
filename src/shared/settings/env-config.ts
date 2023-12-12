export enum Environment {
  DEV = 'development',
  PROD = 'production',
  TEST = 'test',
}

export type EnvConfigType = {
  environment: Environment | string;
  neoauto: string;
};

export const EnvConfig: EnvConfigType = {
  environment: process.env.NODE_ENV || Environment.DEV,
  neoauto: process.env.NEOAUTO_URL,
};
