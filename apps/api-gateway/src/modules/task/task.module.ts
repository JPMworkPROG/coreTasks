import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { RabbitMQModule } from '../../rabbitmq/rabbitmq.module';
import { JwtAcessStrategy } from '../../guards/strategies/jwtAcess.strategy';

@Module({
  imports: [
    PassportModule,
    RabbitMQModule
  ],
  controllers: [TaskController],
  providers: [TaskService, JwtAcessStrategy],
})
export class TaskModule {}
