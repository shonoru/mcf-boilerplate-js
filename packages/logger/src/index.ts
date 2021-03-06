import {TransformableInfo} from 'logform';
import winston from 'winston';
import * as Transport from 'winston-transport';
import {createMorganStream} from './streams';
import {createConsoleTransport, createFileTransport, createFluentTransport} from './transports';
import {traceFormat} from './formats';
export {MCF_TRACE_NAMESPACE} from './formats';

export {createLogger, createFileTransport, createFluentTransport, createConsoleTransport, createMorganStream};

const {label, combine, timestamp, metadata} = winston.format;

// tslint:disable object-literal-sort-keys
// using value order rather than key order makes more sense
// TODO see if we can use defaults and http
const defaultLevels = {
  error: 0, // use for errors
  warn: 1, // use for deprecations
  info: 2, // for application logging
  http: 3, // for request logging
  debug: 4, // debug uses
  silly: 5, // all other uses
};
// tslint:enable object-literal-sort-keys
const defaultLevel: LogLevelType = 'silly';
const defaultTransports: Transport[] = [createConsoleTransport()];
const defaultAdditionalTransports: Transport[] = [];

export interface IExtendedTransformableInfo extends TransformableInfo {
  [key: string]: any;
}

export type IExtendedTransformFunction = (info: TransformableInfo) => IExtendedTransformableInfo;

export type LogLevelType = keyof typeof defaultLevels;
export interface ILoggerOptions {
  formatters?: IExtendedTransformFunction[];
  level?: LogLevelType;
  transports?: Transport[];
  additionalTransports?: Transport | Transport[];
  namespace?: string;
  silent?: boolean;
}
export interface IApplicationLogger extends winston.Logger {
  child: (options: Partial<ILoggerOptions>) => IApplicationLogger;
}

function createLogger({
  formatters = [],
  level = defaultLevel,
  transports = defaultTransports,
  additionalTransports = defaultAdditionalTransports,
  namespace = 'give-me-a-name',
  silent = false,
}: ILoggerOptions = {}): IApplicationLogger {
  const logger = winston.createLogger({
    exitOnError: false,
    format: combine(
      metadata({key: 'meta'}),
      timestamp(),
      label({label: namespace}),
      traceFormat(),
      ...formatters.map((formatter) => winston.format(formatter)).map((fn) => fn()), // need the second call to unwrap the formatter
    ),
    level,
    levels: defaultLevels,
    silent,
    transports: transports.concat(additionalTransports),
  });

  // for any reason spread operator complain :)
  // tslint:disable-next-line prefer-object-spread
  return Object.assign(logger, {
    child: (options: Partial<ILoggerOptions>) =>
      createLogger({
        additionalTransports,
        formatters,
        level,
        namespace,
        silent,
        transports,
        ...options,
      }),
    // let's handle error manually so that we can create a custom object containing information and make our console logger displaying the stack trace in development
    ...['warn', 'error'].reduce((acc: object, logLevel: string) => {
      const originalMethod = logger[logLevel];
      acc[logLevel] = (message, meta = {}) => {
        if (!(message instanceof Error)) {
          originalMethod.call(logger, message, processMeta(meta));
          return;
        }
        const error = message;

        originalMethod.call(logger, error.message, {
          ...meta,
          error: processError(error),
        });
      };
      return acc;
    }, {}),
  });
}

const processMeta = (meta: any) => {
  if (meta instanceof Error) {
    return {
      error: processError(meta),
    };
  } else if (meta && meta.error && meta.error instanceof Error) {
    return {
      ...meta,
      error: processError(meta.error),
    };
  }
  return meta;
};

const processError = (error) => {
  const keys = process.env.NODE_ENV === 'production' ? ['name', 'message'] : ['name', 'message', 'stack'];
  return Object.keys(error)
    .concat(keys)
    .reduce((acc, key) => {
      acc[key] = error[key];
      return acc;
    }, {});
};
