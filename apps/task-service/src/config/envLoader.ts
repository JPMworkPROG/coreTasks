import { ConfigModuleOptions } from '@nestjs/config';
import env from 'env-var';
import { join } from 'path';

export interface TaskEnv {
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

export const taskConfig = (): TaskEnv => ({
   nodeEnv: env.get('NODE_ENV').default('development').asString(),
   server: {
      port: env.get('SERVER_PORT').default(3004).asPortNumber(),
   },
   database: {
      host: env.get('DB_HOST').required().asString(),
      port: env.get('DB_PORT').required().asPortNumber(),
      username: env.get('DB_USERNAME').required().asString(),
      password: env.get('DB_PASSWORD').required().asString(),
      name: env.get('DB_NAME').required().asString(),
      ssl: env.get('DB_SSL').required().asBoolStrict(),
      logging: env.get('DB_LOGGING').required().asBoolStrict(),
      synchronize: env.get('DB_SYNCHRONIZE').required().asBoolStrict(),
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
      queue: env.get('RABBITMQ_TASK_QUEUE').required().asString(),
   },
});

export const configModuleOptions: ConfigModuleOptions = {
   isGlobal: true,
   load: [taskConfig],
   envFilePath: [join(process.cwd(), '.env.local'), join(process.cwd(), '.env')],
};

export default taskConfig;