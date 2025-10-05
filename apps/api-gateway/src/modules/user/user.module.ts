import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { RabbitMQModule } from '../../rabbitmq/rabbitmq.module';
import { AuthModule } from '../auth/auth.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    RabbitMQModule,
    AuthModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [PassportModule],
})
export class UserModule {}
