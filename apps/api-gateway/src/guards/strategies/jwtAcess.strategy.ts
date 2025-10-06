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
export class JwtAcessStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = createLogger({
    service: 'api-gateway-jwt-access-strategy',
    environment: process.env.NODE_ENV ?? 'development',
  });

  constructor(
    private readonly configService: ConfigService<GatewayEnv, true>,
  ) {
    const config = configService.get('jwt', { infer: true });

    if (!config) {
      throw new Error('JWT access configuration not found');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.accessSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    this.logger.debug('JWT access payload validated', { userId: payload.sub });

    return {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      iat: payload.iat,
      exp: payload.exp,
    };
  }
}