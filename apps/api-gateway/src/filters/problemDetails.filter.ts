import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Request, Response } from 'express';
import {
  createLogger,
  createProblemDetails,
  isProblemDetail,
  type ProblemDetail,
  type ProblemDetailItem,
} from '@taskscore/utils';
import { randomUUID } from 'crypto';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = createLogger({
    service: 'api-gateway-problem-filter',
    environment: process.env.NODE_ENV ?? 'development',
  });

  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() !== 'http') {
      throw exception;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId = this.resolveCorrelationId(request);
    const problem = this.toProblemDetails(exception, request, correlationId);

    const logPayload = {
      traceId: problem.traceId,
      status: problem.status,
      title: problem.title,
      detail: problem.detail,
      path: request.url,
      method: request.method,
    };

    if (problem.status >= 500) {
      this.logger.error('Request failed with server error', {
        ...logPayload,
        exception: this.summarizeException(exception),
      });
    } else {
      this.logger.warn('Request failed with client error', {
        ...logPayload,
        exception: this.summarizeException(exception),
      });
    }

    response.status(problem.status).json(problem);
  }

  private toProblemDetails(exception: unknown, request: Request, traceId: string): ProblemDetail {
    if (exception instanceof RpcException) {
      const rpcError = exception.getError();

      if (isProblemDetail(rpcError)) {
        return {
          ...rpcError,
          traceId: rpcError.traceId ?? traceId,
          instance: rpcError.instance ?? request.url,
        };
      }

      if (typeof rpcError === 'object' && rpcError !== null) {
        return this.createProblemFromPayload(rpcError as Record<string, unknown>, request, traceId, 'Upstream service error');
      }

      return this.createGenericProblem(request, traceId, 'Upstream service error', rpcError);
    }

    if (exception instanceof HttpException) {
      const responsePayload = exception.getResponse();
      const descriptor = typeof responsePayload === 'object' && responsePayload
        ? (responsePayload as Record<string, unknown>)
        : undefined;

      return createProblemDetails({
        status: exception.getStatus(),
        title: this.resolveTitle(descriptor) ?? exception.name ?? 'HTTP Error',
        detail: this.resolveDetail(responsePayload) ?? exception.message,
        type: typeof descriptor?.type === 'string' ? descriptor.type : undefined,
        instance: request.url,
        traceId,
        errors: this.resolveErrors(responsePayload),
        messages: descriptor?.message,
        fallbackMessage: exception.message,
        correlationId: traceId,
      });
    }

    return this.createGenericProblem(request, traceId, 'Unexpected error', exception);
  }

  private createProblemFromPayload(
    payload: Record<string, unknown>,
    request: Request,
    traceId: string,
    fallbackTitle: string,
  ): ProblemDetail {
    return createProblemDetails({
      status: this.resolveStatus(payload),
      title: this.resolveTitle(payload) ?? fallbackTitle,
      detail: this.resolveDetail(payload) ?? fallbackTitle,
      type: typeof payload.type === 'string' ? payload.type : undefined,
      instance: request.url,
      traceId: typeof payload.traceId === 'string' ? payload.traceId : traceId,
      errors: this.resolveErrors(payload.errors ?? payload.details ?? payload.message),
      messages: payload.message,
      fallbackMessage: fallbackTitle,
      correlationId: traceId,
    });
  }

  private createGenericProblem(request: Request, traceId: string, title: string, source: unknown): ProblemDetail {
    const detail = typeof source === 'string'
      ? source
      : source instanceof Error
        ? source.message
        : undefined;

    return createProblemDetails({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      title,
      detail,
      instance: request.url,
      traceId,
      fallbackMessage: detail ?? title,
      correlationId: traceId,
    });
  }

  private resolveErrors(candidate: unknown): ProblemDetailItem[] | undefined {
    if (!candidate) {
      return undefined;
    }

    if (Array.isArray(candidate)) {
      const normalized = candidate
        .map(item => this.normalizeErrorItem(item))
        .filter((item): item is ProblemDetailItem => Boolean(item));

      return normalized.length ? normalized : undefined;
    }

    if (typeof candidate === 'object') {
      const payload = candidate as Record<string, unknown>;

      if (Array.isArray(payload.errors)) {
        return this.resolveErrors(payload.errors);
      }

      if (Array.isArray(payload.details)) {
        return this.resolveErrors(payload.details);
      }

      if (Array.isArray(payload.message)) {
        return this.resolveErrors(payload.message);
      }

      const entries = Object.entries(payload)
        .map(([field, value]) => {
          if (typeof value === 'string' && value.trim().length) {
            return { field, message: value.trim() };
          }

          if (Array.isArray(value)) {
            const aggregated = value
              .map(item => (typeof item === 'string' ? item.trim() : undefined))
              .filter((item): item is string => Boolean(item));

            if (aggregated.length) {
              return { field, message: aggregated.join(', ') };
            }
          }

          return undefined;
        })
        .filter((item): item is ProblemDetailItem => Boolean(item));

      return entries.length ? entries : undefined;
    }

    if (typeof candidate === 'string' && candidate.trim().length) {
      return [{ field: 'general', message: candidate.trim() }];
    }

    return undefined;
  }

  private normalizeErrorItem(item: unknown): ProblemDetailItem | undefined {
    if (!item) {
      return undefined;
    }

    if (typeof item === 'string') {
      const trimmed = item.trim();
      return trimmed ? { field: 'general', message: trimmed } : undefined;
    }

    if (typeof item === 'object') {
      const payload = item as Record<string, unknown>;
      const message = typeof payload.message === 'string' ? payload.message.trim() : undefined;

      if (message) {
        const field = typeof payload.field === 'string' && payload.field.trim().length
          ? payload.field.trim()
          : 'general';

        return { field, message };
      }
    }

    return undefined;
  }

  private resolveTitle(payload?: Record<string, unknown>): string | undefined {
    if (!payload) {
      return undefined;
    }

    if (typeof payload.title === 'string' && payload.title.trim().length) {
      return payload.title.trim();
    }

    if (typeof payload.error === 'string' && payload.error.trim().length) {
      return payload.error.trim();
    }

    return undefined;
  }

  private resolveDetail(candidate: unknown): string | undefined {
    if (!candidate) {
      return undefined;
    }

    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      return trimmed.length ? trimmed : undefined;
    }

    if (Array.isArray(candidate)) {
      const joined = candidate
        .map(item => (typeof item === 'string' ? item.trim() : undefined))
        .filter((item): item is string => Boolean(item))
        .join(', ');

      return joined.length ? joined : undefined;
    }

    if (typeof candidate === 'object') {
      const payload = candidate as Record<string, unknown>;

      if (typeof payload.detail === 'string' && payload.detail.trim().length) {
        return payload.detail.trim();
      }

      if (typeof payload.message === 'string' && payload.message.trim().length) {
        return payload.message.trim();
      }

      if (Array.isArray(payload.message)) {
        return this.resolveDetail(payload.message);
      }

      if (Array.isArray(payload.details)) {
        return this.resolveDetail(payload.details);
      }
    }

    return undefined;
  }

  private resolveStatus(payload: Record<string, unknown>): number {
    const candidateStatus = [payload.status, payload.statusCode]
      .map(value => (typeof value === 'number' ? value : Number(value)))
      .find(value => Number.isFinite(value));

    if (!candidateStatus) {
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    const status = Math.trunc(candidateStatus);
    if (status < 100 || status > 599) {
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    return status;
  }

  private resolveCorrelationId(request: Request): string {
    const header = request.headers['x-correlation-id'];
    if (Array.isArray(header)) {
      return header.find(Boolean) ?? randomUUID();
    }

    return (request as any).correlationId ?? header ?? randomUUID();
  }

  private summarizeException(exception: unknown): Record<string, unknown> {
    if (exception instanceof HttpException) {
      return {
        name: exception.name,
        status: exception.getStatus(),
        message: exception.message,
      };
    }

    if (exception instanceof RpcException) {
      return {
        name: exception.name,
        error: exception.getError(),
      };
    }

    if (exception instanceof Error) {
      return {
        name: exception.name,
        message: exception.message,
        stack: exception.stack,
      };
    }

    return { exception };
  }
}
