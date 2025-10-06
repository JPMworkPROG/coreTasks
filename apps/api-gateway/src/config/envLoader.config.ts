import env from 'env-var';
import { join } from 'path';
import { ConfigModuleOptions } from '@nestjs/config';

export interface GatewayEnv {
   nodeEnv: string;
   server: {
      port: number;
      rateLimit: {
         ttl: number;
         limit: number;
      };
   };
   jwt: {
      accessSecret: string;
      refreshSecret: string;
      accessTokenExpiresIn: string;
      refreshTokenExpiresIn: string;
   };
   rabbitmq: {
      url: string;
      queueDurable: boolean;
      requestTimeoutMs: number;
      queues: {
         auth: string;
         tasks: string;
         users: string;
         notifications: string;
      };
   };
}

export const gatewayConfig = (): GatewayEnv => ({
   nodeEnv: env.get('NODE_ENV').default('development').asString(),
   server: {
      port: env.get('SERVER_PORT').default(3000).asPortNumber(),
      rateLimit: {
         ttl: env.get('SERVER_RATE_LIMIT_TTL_SECONDS').asInt(),
         limit: env.get('SERVER_RATE_LIMIT_LIMIT').asInt(),
      },
   },
   jwt: {
      accessSecret: env.get('JWT_ACCESS_SECRET').required().asString(),
      refreshSecret: env.get('JWT_REFRESH_SECRET').required().asString(),
      accessTokenExpiresIn: env.get('JWT_ACCESS_TOKEN_EXPIRES_IN').default('15m').asString(),
      refreshTokenExpiresIn: env.get('JWT_REFRESH_TOKEN_EXPIRES_IN').default('7d').asString(),
   },
   rabbitmq: {
      url: env.get('RABBITMQ_URL').asString(),
      queueDurable: env.get('RABBITMQ_QUEUE_DURABLE').default('true').asBoolStrict(),
      requestTimeoutMs: env.get('RABBITMQ_REQUEST_TIMEOUT_MS').default(5000).asInt(),
      queues: {
         auth: env.get('RABBITMQ_AUTH_QUEUE').default('auth.queue').asString(),
         tasks: env.get('RABBITMQ_TASKS_QUEUE').default('tasks.queue').asString(),
         users: env.get('RABBITMQ_USERS_QUEUE').default('users.queue').asString(),
         notifications: env.get('RABBITMQ_NOTIFICATIONS_QUEUE').default('notifications.queue').asString(),
      }
   }
});

export const configModuleOptions: ConfigModuleOptions = {
   isGlobal: true,
   load: [gatewayConfig],
   envFilePath: [join(process.cwd(), '.env.local'), join(process.cwd(), '.env')],
};

export default gatewayConfig;