import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { RabbitMQModule } from '../../rabbitmq/rabbitmq.module';
import { JwtAcessStrategy } from '../../guards/strategies/jwtAcess.strategy';

@Module({
  imports: [
    PassportModule,
    RabbitMQModule
  ],
  controllers: [UserController],
  providers: [UserService, JwtAcessStrategy],
})
export class UserModule {}
