import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './modules/notification/notification.service';
import { EventsConsumer } from './modules/events/events.consumer';
import { NotificationGateway } from './modules/notification/notification.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  controllers: [EventsConsumer],
  providers: [NotificationService, NotificationGateway],
})
export class AppModule {}
