import * as winstomConfig from 'winston';
import { format, createLogger, transports } from 'winston';
export type LogTransport = winstomConfig.transport;

export const getLogTransports = (): LogTransport[] => {
  try {
    const transportsArray: LogTransport[] = [new transports.Console()];
    /*  Logtail Transport will be disabled for expensive cost
    const { environment, logtailToken } = envConfig;
    if (environment === Environment.PROD || environment === Environment.STG) {
      const logtail = new Logtail(logtailToken);
      transportsArray.push(new LogtailTransport(logtail));
    } */
    return transportsArray;
  } catch (error) {
    process.exit(1);
  }
};

export const winstonLogger = (context: string) => {
  winstomConfig.addColors({
    error: 'red',
    warn: 'yellow',
    info: 'cyan',
    debug: 'grey',
    verbose: 'green',
  });

  const { combine, timestamp, label, printf, errors } = format;
  const myFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
  });

  return createLogger({
    format: combine(
      errors({ stack: true }),
      format.colorize(),
      label({ label: context }),
      timestamp(),
      myFormat,
    ),
    transports: getLogTransports(),
  });
};
