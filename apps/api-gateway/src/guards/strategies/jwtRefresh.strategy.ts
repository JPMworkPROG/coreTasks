import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { createLogger } from '@taskscore/utils';
import { JwtPayload } from '@taskscore/types';
import { GatewayEnv } from '../../config/envLoader.config';

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  private readonly logger = createLogger({
    service: 'api-gateway-jwt-refresh-strategy',
    environment: process.env.NODE_ENV ?? 'development',
  });

  constructor(
    private readonly configService: ConfigService<GatewayEnv, true>,
  ) {
    const config = configService.get('jwt', { infer: true });

    if (!config) {
      throw new Error('JWT refresh configuration not found');
    }

    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      secretOrKey: config.refreshSecret
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    this.logger.debug('JWT refresh payload validated', { userId: payload.sub });

    return {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      iat: payload.iat,
      exp: payload.exp,
    };
  }
}