import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { buildHttpProblem, logProblem, resolvetraceId, setCorrelationHeader } from './problem.utils';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    if (host.getType() !== 'http') {
      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const traceId = resolvetraceId(request);
    const problem = buildHttpProblem(exception, request, traceId);

    logProblem(problem.status, exception, {
      traceId: problem.traceId,
      status: problem.status,
      title: problem.title,
      detail: problem.detail,
      path: request.url,
      method: request.method,
      errors: exception?.['response']?.['errors'],
    });

    setCorrelationHeader(response, problem.traceId);
    response.status(problem.status).json(problem);
  }
}