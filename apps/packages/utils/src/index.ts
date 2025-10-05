export { 
  logger, 
  createLogger, 
  Logger,
  type LogLevel, 
  type LoggerConfig, 
  type LoggerContext 
} from './logger';

export {
  DatabaseClient,
  createDatabaseClient,
  type DatabaseConfig
} from './database/databaseClient';

// Exporta todas as entidades e tipos
export * from './database/entities';

export {
  sendRpc,
  normalizeError,
  extractResponse,
  normalizeMessage,
  serializeError,
  type RpcSendOptions,
  type RpcLogger,
  type NormalizeErrorOptions,
} from './rpc/rpcClient';

export {
  createProblemDetails,
  isProblemDetail,
  type ProblemDetail,
  type ProblemDetailItem,
} from './problemDetails';
