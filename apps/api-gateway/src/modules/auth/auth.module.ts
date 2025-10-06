import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RabbitMQModule } from '../../rabbitmq/rabbitmq.module';
import { JwtAcessStrategy } from '../../guards/strategies/jwtAcess.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtRefreshStrategy } from '../../guards/strategies/jwtRefresh.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({ secret: process.env.JWT_ACCESS_SECRET, signOptions: { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN } }),
    RabbitMQModule
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAcessStrategy, JwtRefreshStrategy],
  exports: [JwtAcessStrategy, PassportModule],
})
export class AuthModule { }
