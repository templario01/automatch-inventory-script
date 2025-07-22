export enum Environment {
  QA = 'qa',
  PROD = 'production',
  STG = 'staging',
}

export type RabbitMqConfigType = {
  hostUrl: string;
  exchangeName: string;
  queueName: string;
}

export type EnvConfigType = {
  rabbitMqConfig: RabbitMqConfigType;
  environment: Environment;
  neoauto: string;
  autocosmos: string;
  mercadolibre: string;
  autopia: string;
  logtailToken: string;
  forexApiUrl: string;
  forexApiKey: string;
};

export const envConfig: EnvConfigType = {
  environment: (process.env.NODE_ENV as Environment) || Environment.QA,
  neoauto: process.env.NEOAUTO_URL,
  autocosmos: process.env.AUTOCOSMOS_URL,
  mercadolibre: process.env.MERCADOLIBRE_URL,
  autopia: process.env.AUTOPIA_URL,
  logtailToken: process.env.BETTERSTACK_LOGTAIL_TOKEN,
  forexApiUrl: process.env.FOREX_API_URL,
  forexApiKey: process.env.FOREX_API_KEY,
  rabbitMqConfig: {
    hostUrl: process.env.RABBITMQ_HOST_URL,
    exchangeName: process.env.RABBITMQ_EXCHANGE_NAME,
    queueName: process.env.RABBITMQ_QUEUE_NAME,
  },
};
