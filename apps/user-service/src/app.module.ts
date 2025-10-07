import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import {
  User,
  createDatabaseClient,
  Task,
  TaskAssignment,
  TaskComment,
  TaskHistory,
} from '@taskscore/utils';
import { configModuleOptions, UserEnv } from './config/envLoader';

@Module({
  imports: [
    ConfigModule.forRoot(configModuleOptions),
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
          entities: [User, TaskAssignment, Task, TaskComment, TaskHistory],
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository
  ],
})
export class AppModule { }