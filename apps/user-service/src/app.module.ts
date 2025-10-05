import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import {
  Task,
  TaskAssignment,
  TaskComment,
  TaskHistory,
  User,
  createDatabaseClient,
  createLogger,
} from '@taskscore/utils';
import { UserEnv } from '../config/envLoader';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => {
        const envLoader = require('../config/envLoader').default;
        return envLoader();
      }],
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<UserEnv, true>) => {
        const dbClient = createDatabaseClient();
        await dbClient.connect();

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
          entities: [User, Task, TaskAssignment, TaskComment, TaskHistory],
          migrations: [],
          extra: {
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
          },
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Task, TaskAssignment, TaskComment, TaskHistory, User]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    {
      provide: 'DATABASE_CLIENT',
      useFactory: () => {
        const logger = createLogger({
          service: 'user-service-database',
          environment: process.env.NODE_ENV ?? 'development',
        });

        logger.info('Initializing database client for user service');
        return createDatabaseClient();
      },
    },
  ],
})
export class AppModule {
  private readonly logger = createLogger({
    service: 'user-service-app-module',
    environment: process.env.NODE_ENV ?? 'development',
  });

  constructor() {
    this.logger.info('User service app module initialized');
  }
}
