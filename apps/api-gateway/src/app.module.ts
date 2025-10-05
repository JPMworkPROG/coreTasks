import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import { AuthModule } from './modules/auth/auth.module';
import { TaskModule } from './modules/task/task.module';
import { UserModule } from './modules/user/user.module';
import gatewayConfig from '../config/envLoader';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [gatewayConfig],
      envFilePath: [join(process.cwd(), '.env.local'), join(process.cwd(), '.env')],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get('server.rateLimit.ttl') * 1000,
          limit: configService.get('server.rateLimit.limit'),
        },
      ],
    }),
    AuthModule,
    TaskModule,
    UserModule,
    RabbitMQModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [RabbitMQModule],
})
export class AppModule { }
