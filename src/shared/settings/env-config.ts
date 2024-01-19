export enum Environment {
  QA = 'qa',
  PROD = 'production',
  STG = 'staging',
}

export type EnvConfigType = {
  environment: Environment;
  neoauto: string;
  logtailToken: string;
};

export const envConfig: EnvConfigType = {
  environment: (process.env.NODE_ENV as Environment) || Environment.QA,
  neoauto: process.env.NEOAUTO_URL,
  logtailToken: process.env.BETTERSTACK_LOGTAIL_TOKEN,
};
