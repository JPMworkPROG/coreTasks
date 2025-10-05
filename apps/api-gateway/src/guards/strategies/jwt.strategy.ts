import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { createLogger } from '@taskscore/utils';
import { JwtPayload } from '@taskscore/types';
import { GatewayEnv } from '../../../config/envLoader';
import { AuthService } from '../../modules/auth/auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = createLogger({
    service: 'api-gateway-jwt-strategy',
    environment: process.env.NODE_ENV ?? 'development',
  })

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<GatewayEnv, true>,
  ) {
    const config = configService.get('jwt');
    
    if (!config) {
      throw new Error('JWT configuration not found');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.accessSecret
    });
  }

  async validate(payload: JwtPayload, req: Request): Promise<any> {
    this.logger.info('Validating JWT payload', { userId: payload.sub });
    
    try {
      // Obtém o correlation ID da requisição HTTP
      const correlationId = req['correlationId'];
      
      const user = await this.authService.getUserById(payload.sub, correlationId);

      if (!user) {
        this.logger.warn('User not found for JWT payload', { userId: payload.sub });
        throw new UnauthorizedException('User not found');
      }

      if (!user.isActive) {
        this.logger.warn('Inactive user attempted access', { userId: payload.sub });
        throw new UnauthorizedException('Account is deactivated. Please contact support.');
      }

      this.logger.info('JWT validation successful', { userId: user.id, email: user.email });
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('JWT validation failed', { 
        userId: payload.sub, 
        error: errorMessage 
      });
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}