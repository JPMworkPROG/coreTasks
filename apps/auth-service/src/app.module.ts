import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { User, PasswordResetToken, Task, TaskAssignment, TaskComment, TaskHistory } from '@taskscore/utils';
import { createDatabaseClient } from '@taskscore/utils';
import { AuthEnv, configModuleOptions } from './config/envLoader';

@Module({
  imports: [
    ConfigModule.forRoot(configModuleOptions),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<AuthEnv, true>) => {
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
          entities: [User, PasswordResetToken, Task, TaskAssignment, TaskComment, TaskHistory],
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, PasswordResetToken, Task, TaskAssignment, TaskComment, TaskHistory]),
    JwtModule.register({ secret: process.env.JWT_ACCESS_SECRET, signOptions: { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN } })
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
  ]
})

export class AppModule { }
