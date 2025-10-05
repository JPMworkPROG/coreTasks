import { HttpStatus } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface ProblemDetailItem {
  field: string;
  message: string;
}

export interface ProblemDetail {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  traceId?: string;
  errors?: ProblemDetailItem[];
}

export interface ProblemDetailsOptions {
  status?: number;
  title?: string;
  type?: string;
  detail?: string;
  instance?: string;
  traceId?: string;
  errors?: Array<ProblemDetailItem | string> | ProblemDetailItem;
  messages?: unknown;
  fallbackMessage: string;
  correlationId?: string;
}

const ERROR_TYPE_PREFIX = 'https://api.coretasks.dev/errors';

const STATUS_DEFAULT_TITLES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
  [HttpStatus.BAD_GATEWAY]: 'Bad Gateway',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'Service Unavailable',
  [HttpStatus.GATEWAY_TIMEOUT]: 'Gateway Timeout',
};

const STATUS_DEFAULT_TYPES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'bad-request',
  [HttpStatus.UNAUTHORIZED]: 'authentication',
  [HttpStatus.FORBIDDEN]: 'authorization',
  [HttpStatus.NOT_FOUND]: 'not-found',
  [HttpStatus.CONFLICT]: 'resource-conflict',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'validation',
  [HttpStatus.TOO_MANY_REQUESTS]: 'rate-limit',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'internal',
  [HttpStatus.BAD_GATEWAY]: 'upstream',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'service-unavailable',
  [HttpStatus.GATEWAY_TIMEOUT]: 'gateway-timeout',
};

export function createProblemDetails(options: ProblemDetailsOptions): ProblemDetail {
  const status = normalizeStatus(options.status);
  const normalizedErrors = normalizeErrors(options.errors);
  const detailFromMessages = normalizeDetail(options.messages);

  const title = normalizeNonEmptyString(options.title)
    ?? STATUS_DEFAULT_TITLES[status]
    ?? 'Unexpected Error';

  const type = normalizeProblemType(options.type, status, normalizedErrors);

  let firstErrorMessage: string | undefined;
  if (normalizedErrors && normalizedErrors.length > 0) {
    firstErrorMessage = normalizedErrors[0]?.message;
  }

  const detail = normalizeNonEmptyString(options.detail)
    ?? detailFromMessages
    ?? firstErrorMessage
    ?? options.fallbackMessage;

  const instance = normalizeNonEmptyString(options.instance);
  const traceId = normalizeNonEmptyString(options.traceId)
    ?? normalizeNonEmptyString(options.correlationId)
    ?? randomUUID();

  const errors = isValidationProblemType(type) ? normalizedErrors : undefined;

  return {
    type,
    title,
    status,
    detail,
    instance,
    traceId,
    errors,
  };
}

export function isProblemDetail(value: unknown): value is ProblemDetail {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.title === 'string' &&
    typeof candidate.status === 'number'
  );
}

function normalizeStatus(status?: number): number {
  if (!status || !Number.isFinite(status)) {
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  const code = Math.trunc(status);
  if (code < 100 || code > 599) {
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  return code;
}

function normalizeErrors(errors?: Array<ProblemDetailItem | string> | ProblemDetailItem): ProblemDetailItem[] | undefined {
  if (!errors) {
    return undefined;
  }

  const normalizedArray = Array.isArray(errors) ? errors : [errors];

  const mapped = normalizedArray
    .map(item => {
      if (!item) {
        return undefined;
      }

      if (typeof item === 'string') {
        const message = item.trim();
        return message ? { field: 'general', message } : undefined;
      }

      if (typeof item === 'object' && 'message' in item) {
        const field = normalizeNonEmptyString((item as ProblemDetailItem).field) ?? 'general';
        const message = normalizeNonEmptyString((item as ProblemDetailItem).message);

        if (message) {
          return { field, message };
        }
      }

      return undefined;
    })
    .filter((item): item is ProblemDetailItem => Boolean(item));

  return mapped.length ? mapped : undefined;
}

function normalizeDetail(messages: unknown): string | undefined {
  if (!messages) {
    return undefined;
  }

  if (typeof messages === 'string') {
    return normalizeNonEmptyString(messages);
  }

  if (Array.isArray(messages)) {
    const flattened = messages
      .map(msg => normalizeDetail(msg))
      .filter((msg): msg is string => Boolean(msg));

    if (flattened.length) {
      return flattened.join('\n');
    }
  }

  if (typeof messages === 'object') {
    const values = Object.values(messages)
      .map(msg => normalizeDetail(msg))
      .filter((msg): msg is string => Boolean(msg));

    if (values.length) {
      return values.join('\n');
    }
  }

  return undefined;
}

function normalizeProblemType(type: string | undefined, status: number, errors?: ProblemDetailItem[]): string | undefined {
  const normalized = normalizeNonEmptyString(type);
  if (normalized) {
    return normalized;
  }

  if (errors && errors.length > 0 && status >= 400 && status < 500) {
    return `${ERROR_TYPE_PREFIX}/validation`;
  }

  const defaultSlug = STATUS_DEFAULT_TYPES[status];
  if (defaultSlug) {
    return `${ERROR_TYPE_PREFIX}/${defaultSlug}`;
  }

  return `${ERROR_TYPE_PREFIX}/unexpected`;
}

function normalizeNonEmptyString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }

  return undefined;
}

function isValidationProblemType(type?: string): boolean {
  if (typeof type !== 'string') {
    return false;
  }

  const normalizedType = type.trim().toLowerCase();
  if (!normalizedType.length) {
    return false;
  }

  return normalizedType.endsWith('/validation');
}
