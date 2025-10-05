import { HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom, TimeoutError } from 'rxjs';
import { timeout as rxjsTimeout } from 'rxjs/operators';
import {
  createProblemDetails,
  isProblemDetail,
  ProblemDetail,
  ProblemDetailItem,
} from '../problemDetails';

export interface RpcLogger {
  error(message: string, context?: Record<string, unknown>): void;
}

export interface RpcSendOptions {
  timeoutMs?: number;
  logger?: RpcLogger;
  errorMessage?: string;
  timeoutMessage?: string;
  correlationId?: string;
}

export interface NormalizeErrorOptions {
  fallbackMessage?: string;
  timeoutMessage?: string;
  correlationId?: string;
}

export async function sendRpc<TPayload, TResponse>(
  client: ClientProxy,
  pattern: unknown,
  payload: TPayload,
  options: RpcSendOptions = {},
): Promise<TResponse> {
  const {
    timeoutMs = 5000,
    logger,
    errorMessage = 'RPC request failed',
    timeoutMessage = 'RPC request timed out',
    correlationId,
  } = options;

  try {
    const response$ = client
      .send<TResponse, TPayload>(pattern, payload)
      .pipe(rxjsTimeout(timeoutMs));

      return await firstValueFrom(response$);
  } catch (error) {
    if (error instanceof Error && error.message.includes('no elements in sequence')) {
      return undefined as TResponse;
    }

    logger?.error(errorMessage, {
      pattern,
      error: serializeError(error),
    });

    throw normalizeError(error, {
      fallbackMessage: errorMessage,
      timeoutMessage,
      correlationId,
    });
  }
}

export function normalizeError(error: unknown, options: NormalizeErrorOptions = {}): never {
  const {
    fallbackMessage = 'RPC request failed',
    timeoutMessage = 'RPC request timed out',
    correlationId,
  } = options;

  if (error instanceof TimeoutError) {
    throw new RpcException(
      createProblemDetails({
        status: HttpStatus.GATEWAY_TIMEOUT,
        title: 'Gateway Timeout',
        detail: timeoutMessage,
        type: 'https://api.coretasks.dev/errors/gateway-timeout',
        fallbackMessage: timeoutMessage,
        correlationId,
      })
    );
  }

  if (error instanceof RpcException) {
    const rpcError = error.getError();
    const normalized = normalizeProblemDetail(rpcError, {
      fallbackMessage,
      correlationId,
    });

    throw new RpcException(normalized);
  }

  if (error instanceof HttpException) {
    const status = error.getStatus();
    const response = error.getResponse();
    const candidate: Record<string, unknown> = {
      status,
    };

    if (typeof response === 'object' && response !== null) {
      Object.assign(candidate, response as Record<string, unknown>);
    } else if (typeof response === 'string') {
      candidate.message = response;
    }

    throw new RpcException(
      createProblemDetailsFromContext({
        ...extractErrorContext(candidate),
        fallbackMessage,
        correlationId,
      })
    );
  }

  if (error instanceof Error) {
    throw new RpcException(
      createProblemDetails({
        detail: error.message,
        fallbackMessage,
        correlationId,
      })
    );
  }

  if (typeof error === 'object' && error !== null) {
    throw new RpcException(
      createProblemDetailsFromContext({
        ...extractErrorContext(error as Record<string, unknown>),
        fallbackMessage,
        correlationId,
      })
    );
  }

  throw new RpcException(
    createProblemDetails({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail: fallbackMessage,
      fallbackMessage,
      correlationId,
    })
  );
}

interface ExtractedResponse {
  status?: number;
  statusCode?: number;
  message?: unknown;
  error?: unknown;
  title?: unknown;
  detail?: unknown;
  type?: unknown;
  instance?: unknown;
  traceId?: unknown;
  errors?: unknown;
  details?: unknown;
}

export function extractResponse(candidate: Record<string, unknown>): ExtractedResponse | undefined {
  if (candidate.response && typeof candidate.response === 'object') {
    const response = candidate.response as Record<string, unknown>;
    return {
      status: toNumber(response.status),
      statusCode: toNumber(response.statusCode),
      message: response.message,
      error: response.error,
      title: (response as Record<string, unknown>).title,
      detail: (response as Record<string, unknown>).detail,
      type: (response as Record<string, unknown>).type,
      instance: (response as Record<string, unknown>).instance,
      traceId: (response as Record<string, unknown>).traceId,
      errors: (response as Record<string, unknown>).errors,
      details: (response as Record<string, unknown>).details,
    };
  }

  return undefined;
}

interface ErrorContext {
  status?: number;
  statusCode?: number;
  title?: unknown;
  detail?: unknown;
  type?: unknown;
  instance?: unknown;
  traceId?: unknown;
  errors?: unknown;
  details?: unknown;
  message?: unknown;
  error?: unknown;
}

function extractErrorContext(candidate: Record<string, unknown>): ErrorContext {
  const response = extractResponse(candidate);
  return {
    status: toNumber(candidate.status) ?? response?.status,
    statusCode: toNumber(candidate.statusCode) ?? response?.statusCode,
    title: candidate.title ?? response?.title ?? candidate.error,
    detail: candidate.detail ?? response?.detail,
    type: candidate.type ?? response?.type,
    instance: candidate.instance ?? response?.instance,
    traceId: candidate.traceId ?? response?.traceId,
    errors: candidate.errors ?? response?.errors,
    details: candidate.details ?? response?.details,
    message: candidate.message ?? response?.message,
    error: candidate.error ?? response?.error,
  };
}

function createProblemDetailsFromContext(
  context: ErrorContext & { fallbackMessage: string; correlationId?: string },
): ProblemDetail {
  const status = context.status ?? context.statusCode;
  const errors = mergeErrors(context.errors, context.details);

  return createProblemDetails({
    status,
    title:
      toNonEmptyString(context.title) ??
      normalizeUnknownMessage(context.error) ??
      normalizeUnknownMessage(context.message),
    detail: toNonEmptyString(context.detail),
    type: toNonEmptyString(context.type),
    instance: toNonEmptyString(context.instance),
    traceId: toNonEmptyString(context.traceId),
    errors,
    messages: context.message,
    fallbackMessage: context.fallbackMessage,
    correlationId: context.correlationId,
  });
}

function toNonEmptyString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

export function normalizeMessage(message: string | string[] | undefined): string | undefined {
  if (!message) {
    return undefined;
  }

  return Array.isArray(message) ? message.join(', ') : message;
}

export function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof HttpException) {
    return {
      name: error.name,
      status: error.getStatus(),
      response: error.getResponse(),
    };
  }

  if (error instanceof RpcException) {
    return {
      name: error.name,
      error: error.getError(),
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { error };
}

function normalizeUnknownMessage(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return toNonEmptyString(value);
  }

  if (Array.isArray(value)) {
    const normalized = (value as unknown[])
      .map(item => toNonEmptyString(item))
      .filter((item): item is string => Boolean(item));

    if (normalized.length) {
      return normalized.join(', ');
    }
  }

  return undefined;
}

function mergeErrors(primary: unknown, fallback: unknown): Array<ProblemDetailItem | string> | undefined {
  const normalizedPrimary = normalizeErrorsInput(primary);
  const normalizedFallback = normalizeErrorsInput(fallback);

  if (!normalizedPrimary?.length) {
    return normalizedFallback;
  }

  if (!normalizedFallback?.length) {
    return normalizedPrimary;
  }

  return [...normalizedPrimary, ...normalizedFallback];
}

function normalizeErrorsInput(value: unknown): Array<ProblemDetailItem | string> | undefined {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    const normalized = value
      .map(item => {
        if (!item) {
          return undefined;
        }

        if (typeof item === 'string') {
          return item;
        }

        if (typeof item === 'object' && 'message' in item) {
          const field = toNonEmptyString((item as ProblemDetailItem).field) ?? 'general';
          const message = toNonEmptyString((item as ProblemDetailItem).message);
          return message ? { field, message } : undefined;
        }

        return undefined;
      })
      .filter((item): item is ProblemDetailItem | string => Boolean(item));

    return normalized.length ? normalized : undefined;
  }

  if (typeof value === 'string') {
    const normalized = toNonEmptyString(value);
    return normalized ? [normalized] : undefined;
  }

  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([field, message]) => {
        const normalizedMessage = toNonEmptyString(message);
        if (normalizedMessage) {
          return { field, message: normalizedMessage } as ProblemDetailItem;
        }

        if (Array.isArray(message)) {
          const aggregated = normalizeUnknownMessage(message);
          return aggregated ? { field, message: aggregated } : undefined;
        }

        return undefined;
      })
      .filter((item): item is ProblemDetailItem => Boolean(item));

    return entries.length ? entries : undefined;
  }

  return undefined;
}

function normalizeProblemDetail(
  rpcError: unknown,
  options: { fallbackMessage: string; correlationId?: string },
): ProblemDetail {
  if (isProblemDetail(rpcError)) {
    return createProblemDetails({
      status: rpcError.status,
      title: rpcError.title,
      detail: rpcError.detail,
      type: rpcError.type,
      instance: rpcError.instance,
      traceId: rpcError.traceId,
      errors: rpcError.errors,
      fallbackMessage: options.fallbackMessage,
      correlationId: options.correlationId,
    });
  }

  if (typeof rpcError === 'object' && rpcError !== null) {
    return createProblemDetailsFromContext({
      ...extractErrorContext(rpcError as Record<string, unknown>),
      fallbackMessage: options.fallbackMessage,
      correlationId: options.correlationId,
    });
  }

  return createProblemDetails({
    detail: toNonEmptyString(rpcError) ?? options.fallbackMessage,
    fallbackMessage: options.fallbackMessage,
    correlationId: options.correlationId,
  });
}
