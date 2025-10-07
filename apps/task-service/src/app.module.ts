import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { TaskRepository } from './task.repository';
import {
  Task,
  TaskAssignment,
  TaskComment,
  TaskHistory,
  User,
  createDatabaseClient,
} from '@taskscore/utils';
import { configModuleOptions, TaskEnv } from './config/envLoader';

@Module({
  imports: [
    ConfigModule.forRoot(configModuleOptions),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<TaskEnv, true>) => {
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
          entities: [Task, TaskAssignment, TaskComment, TaskHistory, User],
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Task, TaskAssignment, TaskComment, TaskHistory, User])
  ],
  controllers: [TaskController],
  providers: [
    TaskService,
    TaskRepository
  ]
})
export class AppModule { }