import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { createLogger } from '@taskscore/utils';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
   private readonly logger = createLogger({
      service: 'api-gateway-jwt-guard',
      environment: process.env.NODE_ENV ?? 'development',
   })

   canActivate(context: ExecutionContext) {
      return super.canActivate(context);
   }

   handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
      const request = context.switchToHttp().getRequest<Request>();
      const correlationId = this.resolveCorrelationId(request);

      if (err || !user) {
         this.logger.warn('JWT authentication failed', { 
            error: err?.message, 
            info: info?.message,
            path: request.url,
            correlationId,
         });
         throw err || new UnauthorizedException('Token de acesso inválido ou expirado');
      }

      this.logger.info('JWT authentication successful', { 
         userId: user.id, 
         email: user.email,
         path: request.url,
         correlationId,
      });
      
      return user;
   }

   private resolveCorrelationId(request: Request): string | undefined {
      const header = request.headers['x-correlation-id'];
      if (Array.isArray(header)) {
         return header.find(Boolean);
      }

      return (request as any).correlationId ?? (typeof header === 'string' ? header : undefined);
   }
}
