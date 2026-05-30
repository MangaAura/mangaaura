/**
 * Timeout utility for async operations
 *
 * Envuelve una Promise con un timeout usando AbortController.
 * Si la operación excede el tiempo límite, la Promise se rechaza
 * y se intenta abortar la operación subyacente.
 *
 * @packageDocumentation
 */

export class TimeoutError extends Error {
  constructor(ms: number, operationName?: string) {
    const name = operationName ? ` ${operationName}` : '';
    super(`Operation${name} timed out after ${ms}ms`);
    this.name = 'TimeoutError';
  }
}

/**
 * Envuelve una promesa con un timeout.
 * Si el timeout se alcanza, rechaza con TimeoutError.
 *
 * @example
 * const result = await withTimeout(someAsyncOp(), 5000, 'myOperation');
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  operationName?: string,
): Promise<T> {
  if (ms <= 0) return promise;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);

  try {
    const result = await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener(
          'abort',
          () => reject(new TimeoutError(ms, operationName)),
          { once: true },
        );
      }),
    ]);
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Timeouts por defecto para cada tipo de worker/handler
 */
export const WORKER_TIMEOUTS = {
  /** EmailWorker: emails individuales */
  EMAIL_WELCOME: 10_000,
  EMAIL_PASSWORD_RESET: 10_000,
  EMAIL_NEW_CHAPTER: 15_000,
  EMAIL_ACHIEVEMENT: 10_000,
  EMAIL_TIP: 10_000,
  EMAIL_CROWDFUNDING: 10_000,
  EMAIL_COMMENT_REPLY: 10_000,
  EMAIL_LEVEL_UP: 10_000,
  EMAIL_MENTION: 10_000,
  EMAIL_CLAN_INVITE: 10_000,
  EMAIL_CUSTOM: 15_000,
  EMAIL_MARKETING: 15_000,

  /** NotificationWorker */
  NOTIFICATION_IN_APP: 10_000,
  NOTIFICATION_PUSH: 15_000,
  NOTIFICATION_COMBINED: 20_000,
  NOTIFICATION_BULK_PUSH: 30_000,

  /** InboundEmailWorker */
  INBOUND_CLASSIFY: 30_000,
  INBOUND_PROCESS: 15_000,

  /** Timeout por defecto */
  DEFAULT: 15_000,
} as const;
