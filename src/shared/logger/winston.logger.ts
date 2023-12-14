import * as winstomConfig from 'winston';
import { format, createLogger, transports } from 'winston';

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

export const winstonLogger = (context: string) => {
  return createLogger({
    level: 'verbose',
    format: combine(
      format.colorize(),
      label({ label: context }),
      timestamp(),
      myFormat,
    ),
    transports: [new transports.Console()],
  });
};
