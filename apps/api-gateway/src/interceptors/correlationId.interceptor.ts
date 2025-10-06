import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';


@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const correlationId = request.headers.correlationId as string || uuidv4();

    request['correlationId'] = correlationId;

    const response = context.switchToHttp().getResponse();
    response.setHeader('x-correlation-id', correlationId);

    
    return next.handle();
  }
}