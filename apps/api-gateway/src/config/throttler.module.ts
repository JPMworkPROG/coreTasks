import { ConfigService } from '@nestjs/config';
import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const throttlerModule = {
   imports: [],
   inject: [ConfigService],
   useFactory: (
      configService: ConfigService
   ): ThrottlerModuleOptions => [
         {
            ttl: configService.get('server.rateLimit.ttl') * 1000,
            limit: configService.get('server.rateLimit.limit'),
         },
      ]
};