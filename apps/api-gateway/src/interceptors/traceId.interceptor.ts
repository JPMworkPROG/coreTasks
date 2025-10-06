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
export class TraceIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const traceId = request.headers.traceId as string || uuidv4();

    request['traceId'] = traceId;

    const response = context.switchToHttp().getResponse();
    response.setHeader('x-correlation-id', traceId);

    return next.handle();
  }
}