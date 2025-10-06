import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Request, Response } from 'express';
import { buildRpcProblem, logProblem, resolvetraceId, setCorrelationHeader } from './problem.utils';

@Catch(RpcException)
export class RpcExceptionFilter implements ExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost) {
    if (host.getType() !== 'http') {
      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const traceId = resolvetraceId(request);
    const rpcError = exception.getError();
    const problem = buildRpcProblem(rpcError, request, traceId);

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