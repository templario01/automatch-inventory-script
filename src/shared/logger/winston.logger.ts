import * as winstomConfig from 'winston';
import { format, createLogger, transports } from 'winston';
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';
import { Environment, envConfig } from '../settings/env-config';

export type LogTransport = winstomConfig.transport;

export const getLogTransports = (): LogTransport[] => {
  const logTransports: LogTransport[] = [new transports.Console()];
  const { environment, logtailToken } = envConfig;
  if (environment === Environment.PROD || environment === Environment.STG) {
    const logtail = new Logtail(logtailToken);
    logTransports.push(new LogtailTransport(logtail));
  }

  return logTransports;
};

export const winstonLogger = (context: string) => {
  winstomConfig.addColors({
    error: 'red',
    warn: 'yellow',
    info: 'cyan',
    debug: 'grey',
    verbose: 'green',
  });

  const { combine, timestamp, label, printf } = format;
  const myFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
  });

  return createLogger({
    level: 'verbose',
    format: combine(
      format.colorize(),
      label({ label: context }),
      timestamp(),
      myFormat,
    ),
    transports: [...getLogTransports()],
  });
};
