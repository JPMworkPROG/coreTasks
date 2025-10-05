import env from 'env-var';

export interface AuthEnv {
   nodeEnv: string;
   server: {
      port: number;
   };
   database: {
      host: string;
      port: number;
      username: string;
      password: string;
      name: string;
      ssl: boolean;
      logging: boolean;
      synchronize: boolean;
   };
   jwt: {
      accessSecret: string;
      refreshSecret: string;
      accessExpiresIn: string;
      refreshExpiresIn: string;
   };
   rabbitmq: {
      url: string;
      queueDurable: boolean;
      requestTimeoutMs: number;
      queue: string;
   };
}

export default (): AuthEnv => ({
   nodeEnv: env.get('NODE_ENV').default('development').asString(),
   server: {
      port: env.get('SERVER_PORT').default(3004).asPortNumber(),
   },
   database: {
      host: env.get('DB_HOST').default('localhost').asString(),
      port: env.get('DB_PORT').default(5432).asPortNumber(),
      username: env.get('DB_USERNAME').required().asString(),
      password: env.get('DB_PASSWORD').required().asString(),
      name: env.get('DB_NAME').required().asString(),
      ssl: env.get('DB_SSL').default('false').asBoolStrict(),
      logging: env.get('DB_LOGGING').default('false').asBoolStrict(),
      synchronize: env.get('DB_SYNCHRONIZE').default('false').asBoolStrict(),
   },
   jwt: {
      accessSecret: env.get('JWT_ACCESS_SECRET').required().asString(),
      refreshSecret: env.get('JWT_REFRESH_SECRET').required().asString(),
      accessExpiresIn: env.get('JWT_ACCESS_EXPIRES_IN').default('15m').asString(),
      refreshExpiresIn: env.get('JWT_REFRESH_EXPIRES_IN').default('7d').asString(),
   },
   rabbitmq: {
      url: env.get('RABBITMQ_URL').required().asString(),
      queueDurable: env.get('RABBITMQ_QUEUE_DURABLE').default('true').asBoolStrict(),
      requestTimeoutMs: env.get('RABBITMQ_REQUEST_TIMEOUT_MS').default(5000).asInt(),
      queue: env.get('RABBITMQ_AUTH_QUEUE').required().asString(),
   }
});