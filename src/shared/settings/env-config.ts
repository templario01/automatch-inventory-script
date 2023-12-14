export enum Environment {
  DEV = 'development',
  PROD = 'production',
  TEST = 'test',
}

export type EnvConfigType = {
  environment: Environment;
  neoauto: string;
};

export const envConfig: EnvConfigType = {
  environment: (process.env.NODE_ENV as Environment) || Environment.DEV,
  neoauto: process.env.NEOAUTO_URL,
};
