import { HttpException, HttpStatus } from '@nestjs/common';
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

const logger = createLogger({
  service: 'api-gateway-problem-utils',
  environment: process.env.NODE_ENV ?? 'development',
});

export function resolvetraceId(request: Request): string {
  const header = request.headers['x-correlation-id'];
  if (Array.isArray(header)) {
    return header.find(Boolean) ?? randomUUID();
  }
  return (request as any).traceId ?? header ?? randomUUID();
}

export function summarizeException(exception: unknown): Record<string, unknown> {
  if (exception instanceof HttpException) {
    return { name: exception.name, status: exception.getStatus(), message: exception.message };
  }
  if (exception instanceof RpcException) {
    return { name: exception.name, error: exception.getError() };
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

export function resolveTitle(payload?: Record<string, unknown>): string | undefined {
  if (!payload) return undefined;
  if (typeof payload.title === 'string' && payload.title.trim().length) return payload.title.trim();
  if (typeof payload.error === 'string' && payload.error.trim().length) return payload.error.trim();
  return undefined;
}

export function resolveDetail(candidate: unknown): string | undefined {
  if (!candidate) return undefined;
  if (typeof candidate === 'string') {
    const trimmed = candidate.trim();
    return trimmed.length ? trimmed : undefined;
  }
  if (Array.isArray(candidate)) {
    const joined = candidate
      .map((item) => (typeof item === 'string' ? item.trim() : undefined))
      .filter((item): item is string => Boolean(item))
      .join(', ');
    return joined.length ? joined : undefined;
  }
  if (typeof candidate === 'object') {
    const payload = candidate as Record<string, unknown>;
    if (typeof payload.detail === 'string' && payload.detail.trim().length) return payload.detail.trim();
    if (typeof payload.message === 'string' && payload.message.trim().length) return payload.message.trim();
    if (Array.isArray(payload.message)) return resolveDetail(payload.message);
    if (Array.isArray(payload.details)) return resolveDetail(payload.details);
  }
  return undefined;
}

export function resolveErrors(candidate: unknown): ProblemDetailItem[] | undefined {
  if (!candidate) return undefined;
  if (Array.isArray(candidate)) {
    const normalized = candidate
      .map((item) => normalizeErrorItem(item))
      .filter((item): item is ProblemDetailItem => Boolean(item));
    return normalized.length ? normalized : undefined;
  }
  if (typeof candidate === 'object') {
    const payload = candidate as Record<string, unknown>;
    if (Array.isArray(payload.errors)) return resolveErrors(payload.errors);
    if (Array.isArray(payload.details)) return resolveErrors(payload.details);
    if (Array.isArray(payload.message)) return resolveErrors(payload.message);
    const entries = Object.entries(payload)
      .map(([field, value]) => {
        if (typeof value === 'string' && value.trim().length) return { field, message: value.trim() };
        if (Array.isArray(value)) {
          const aggregated = value
            .map((item) => (typeof item === 'string' ? item.trim() : undefined))
            .filter((item): item is string => Boolean(item));
          if (aggregated.length) return { field, message: aggregated.join(', ') };
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

export function resolveStatus(payload: Record<string, unknown>): number {
  const candidateStatus = [payload.status, payload.statusCode]
    .map((value) => (typeof value === 'number' ? value : Number(value)))
    .find((value) => Number.isFinite(value));
  if (!candidateStatus) return HttpStatus.INTERNAL_SERVER_ERROR;
  const status = Math.trunc(candidateStatus as number);
  if (status < 100 || status > 599) return HttpStatus.INTERNAL_SERVER_ERROR;
  return status;
}

function normalizeErrorItem(item: unknown): ProblemDetailItem | undefined {
  if (!item) return undefined;
  if (typeof item === 'string') {
    const trimmed = item.trim();
    return trimmed ? { field: 'general', message: trimmed } : undefined;
  }
  if (typeof item === 'object') {
    const payload = item as Record<string, unknown>;
    const message = typeof payload.message === 'string' ? payload.message.trim() : undefined;
    if (message) {
      const field = typeof payload.field === 'string' && payload.field.trim().length ? payload.field.trim() : 'general';
      return { field, message };
    }
  }
  return undefined;
}

export function buildHttpProblem(exception: HttpException, request: Request, traceId: string): ProblemDetail {
  const responsePayload = exception.getResponse();
  const descriptor = typeof responsePayload === 'object' && responsePayload
    ? (responsePayload as Record<string, unknown>)
    : undefined;
  const status = exception.getStatus();
  const isServerError = status >= 500;
  return createProblemDetails({
    status,
    title: resolveTitle(descriptor) ?? exception.name ?? 'HTTP Error',
    detail: isServerError ? 'Unexpected error' : (resolveDetail(responsePayload) ?? exception.message),
    type: typeof descriptor?.type === 'string' ? descriptor.type : undefined,
    instance: request.url,
    traceId,
    errors: isServerError ? undefined : resolveErrors(responsePayload),
    messages: isServerError ? undefined : (descriptor as any)?.message,
    fallbackMessage: exception.message,
  });
}

export function buildRpcProblem(rpcError: unknown, request: Request, traceId: string): ProblemDetail {
  if (isProblemDetail(rpcError)) {
    return { ...rpcError, traceId: rpcError.traceId ?? traceId, instance: rpcError.instance ?? request.url } as ProblemDetail;
  }
  if (typeof rpcError === 'object' && rpcError !== null) {
    return createProblemDetails({
      status: resolveStatus(rpcError as Record<string, unknown>),
      title: resolveTitle(rpcError as Record<string, unknown>) ?? 'Upstream service error',
      detail: resolveDetail(rpcError) ?? 'Upstream service error',
      type: typeof (rpcError as any).type === 'string' ? (rpcError as any).type : undefined,
      instance: request.url,
      traceId,
      errors: resolveErrors((rpcError as any).errors ?? (rpcError as any).details ?? (rpcError as any).message),
      messages: (rpcError as any).message,
      fallbackMessage: 'Upstream service error',
    });
  }

  return createProblemDetails({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    title: 'Upstream service error',
    detail: typeof rpcError === 'string' ? rpcError : rpcError instanceof Error ? rpcError.message : undefined,
    instance: request.url,
    traceId,
    fallbackMessage: 'Upstream service error',
  });
}

export function setCorrelationHeader(res: Response, traceId: string): void {
  res.setHeader('X-Correlation-Id', traceId);
}

export function logProblem(status: number, exception: unknown, payload: Record<string, unknown>): void {
  if (status >= 500) {
    logger.error('Request failed with server error', { ...payload, exception: summarizeException(exception) });
  } else {
    logger.warn('Request failed with client error', { ...payload });
  }
}


