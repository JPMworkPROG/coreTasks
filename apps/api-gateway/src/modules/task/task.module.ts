import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { RabbitMQModule } from '../../rabbitmq/rabbitmq.module';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    RabbitMQModule,
    AuthModule,
  ],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [PassportModule],
})
export class TaskModule {}
