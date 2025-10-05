import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { User, PasswordResetToken, Task, TaskAssignment, TaskComment, TaskHistory } from '@taskscore/utils';
import { createDatabaseClient } from '@taskscore/utils';
import { createLogger } from '@taskscore/utils';
import { AuthEnv } from '../config/envLoader';

@Module({
  imports: [
    // Configuração de variáveis de ambiente
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => {
        const envLoader = require('../config/envLoader').default;
        return envLoader();
      }],
      envFilePath: ['.env.local', '.env'],
    }),

    // Configuração do TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<AuthEnv, true>) => {
        const dbClient = createDatabaseClient();
        const dataSource = await dbClient.connect();
        
        return {
          type: 'postgres',
          host: configService.get('database.host', { infer: true }),
          port: configService.get('database.port', { infer: true }),
          username: configService.get('database.username', { infer: true }),
          password: configService.get('database.password', { infer: true }),
          database: configService.get('database.name', { infer: true }),
          ssl: configService.get('database.ssl', { infer: true }) ? { rejectUnauthorized: false } : false,
          logging: configService.get('database.logging', { infer: true }),
          synchronize: configService.get('database.synchronize', { infer: true }),
          entities: [User, PasswordResetToken, Task, TaskAssignment, TaskComment, TaskHistory],
          migrations: [],
          extra: {
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
          }
        };
      },
      inject: [ConfigService],
    }),

    // Registro das entidades do TypeORM
    TypeOrmModule.forFeature([User, PasswordResetToken, Task, TaskAssignment, TaskComment, TaskHistory]),

    // Configuração do JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<AuthEnv, true>) => ({
        secret: configService.get('jwt.accessSecret', { infer: true }),
        signOptions: {
          expiresIn: configService.get('jwt.accessExpiresIn', { infer: true }),
        },
      }),
      inject: [ConfigService],
    }),

    // Configuração do RabbitMQ (opcional, para comunicação com outros serviços)
    ClientsModule.registerAsync([
      {
        name: 'RABBITMQ_SERVICE',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService<AuthEnv, true>) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get('rabbitmq.url', { infer: true }) as string],
            queue: configService.get('rabbitmq.queue', { infer: true }) as string,
            queueOptions: {
              durable: configService.get('rabbitmq.queueDurable', { infer: true }) as boolean,
            },
            socketOptions: {
              heartbeatIntervalInSeconds: 60,
              reconnectTimeInSeconds: 5,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    {
      provide: 'DATABASE_CLIENT',
      useFactory: () => {
        const logger = createLogger({
          service: 'auth-service-database',
          environment: process.env.NODE_ENV ?? 'development',
        });
        
        logger.info('Initializing database client for auth service');
        return createDatabaseClient();
      },
    },
  ],
  exports: [AuthService, AuthRepository],
})
export class AppModule {
  private readonly logger = createLogger({
    service: 'auth-service-app-module',
    environment: process.env.NODE_ENV ?? 'development',
  });

  constructor() {
    this.logger.info('Auth service app module initialized');
  }
}
