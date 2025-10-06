import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Request, Response } from 'express';
import { createProblemDetails } from '@taskscore/utils';
import { logProblem, resolvetraceId, setCorrelationHeader } from './problem.utils';

@Catch(Error)
export class UncaughtErrorFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    if (host.getType() !== 'http') {
      return;
    }

    if (exception instanceof HttpException || exception instanceof RpcException) {
      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const traceId = resolvetraceId(request);
    const problem = createProblemDetails({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      title: 'Unexpected error',
      detail: process.env.NODE_ENV === 'production' ? undefined : exception.message,
      instance: request.url,
      traceId,
      fallbackMessage: 'Unexpected error',
    });

    logProblem(problem.status, exception, {
      traceId: problem.traceId,
      status: problem.status,
      title: problem.title,
      detail: problem.detail,
      path: request.url,
      method: request.method,
    });

    setCorrelationHeader(response, problem.traceId);
    response.status(problem.status).json(problem);
  }
}