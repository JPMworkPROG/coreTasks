import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { RabbitMQModule } from '../../rabbitmq/rabbitmq.module';
import { JwtAcessStrategy } from '../../guards/strategies/jwtAcess.strategy';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({ secret: process.env.JWT_ACCESS_SECRET, signOptions: { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN } }),
    RabbitMQModule
  ],
  controllers: [TaskController],
  providers: [TaskService, JwtAcessStrategy],
})
export class TaskModule {}
