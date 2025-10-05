import pino from 'pino';
import pinoPretty from 'pino-pretty';
import type { Transform } from 'stream';
import { env } from 'process';

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface LoggerConfig {
  level?: LogLevel;
  service?: string;
  environment?: string;
  pretty?: boolean;
}

export interface LoggerContext {
  service?: string;
  requestId?: string;
  userId?: string;
  correlationId?: string;
}

let prettyStream: Transform | null = null;

export class Logger {
  private pinoInstance: pino.Logger;
  private serviceName: string;

  constructor(config: LoggerConfig = {}) {
    const {
      level = 'info',
      service = 'unknown-service',
      environment = env.NODE_ENV || 'development',
      pretty = environment === 'development'
    } = config;

    this.serviceName = service;

    const pinoConfig: pino.LoggerOptions = {
      level,
      base: {
        service,
        environment,
        pid: process.pid,
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    };

    if (pretty) {
      if (!prettyStream) {
        prettyStream = pinoPretty({
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          messageFormat: '[{service}] {msg}',
        });
        // Reuse a single in-process stream to keep log emission ordered without worker threads.
      }

      this.pinoInstance = pino(pinoConfig, prettyStream);
    } else {
      this.pinoInstance = pino(pinoConfig);
    }
  }

  private enrichLog(level: LogLevel, message: string, context?: LoggerContext & Record<string, unknown>) {
    const logData = {
      ...context,
      msg: message,
    };

    this.pinoInstance[level](logData);
  }

  fatal(message: string, context?: LoggerContext & Record<string, unknown>) {
    this.enrichLog('fatal', message, context);
  }

  error(message: string, context?: LoggerContext & Record<string, unknown>) {
    this.enrichLog('error', message, context);
  }

  warn(message: string, context?: LoggerContext & Record<string, unknown>) {
    this.enrichLog('warn', message, context);
  }

  info(message: string, context?: LoggerContext & Record<string, unknown>) {
    this.enrichLog('info', message, context);
  }

  debug(message: string, context?: LoggerContext & Record<string, unknown>) {
    this.enrichLog('debug', message, context);
  }

  trace(message: string, context?: LoggerContext & Record<string, unknown>) {
    this.enrichLog('trace', message, context);
  }

  child(context: LoggerContext): Logger {
    const childLogger = new Logger();
    childLogger.pinoInstance = this.pinoInstance.child(context);
    childLogger.serviceName = this.serviceName;
    return childLogger;
  }
}

// Factory function para criar logger
export function createLogger(config?: LoggerConfig): Logger {
  return new Logger(config);
}

// Logger padrão para uso imediato
export const logger = createLogger({
  level: (env.LOG_LEVEL as LogLevel) || 'info',
  service: env.SERVICE_NAME || 'core-tasks',
  environment: env.NODE_ENV || 'development',
});

// Export default
export default logger;
