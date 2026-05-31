import { describe, it, expect, vi } from 'vitest';

import { withTimeout, TimeoutError, WORKER_TIMEOUTS } from '@/lib/with-timeout';

describe('withTimeout', () => {
  // ─── Éxito rápido ──────────────────────────────────────────────

  it('resuelve si la promesa completa antes del timeout', async () => {
    const result = await withTimeout(Promise.resolve('ok'), 1000);
    expect(result).toBe('ok');
  });

  it('retorna el valor tipado correctamente', async () => {
    const result = await withTimeout(Promise.resolve(42), 1000);
    expect(result).toBe(42);
  });

  // ─── Timeout ───────────────────────────────────────────────────

  it('rechaza con TimeoutError si la promesa excede el timeout', async () => {
    const slow = new Promise<string>((resolve) =>
      setTimeout(() => resolve('too late'), 500),
    );

    await expect(withTimeout(slow, 50)).rejects.toThrow(TimeoutError);
  });

  it('incluye el nombre de la operación en el mensaje de error', async () => {
    const slow = new Promise<string>((resolve) =>
      setTimeout(() => resolve('too late'), 500),
    );

    try {
      await withTimeout(slow, 50, 'test-op');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(TimeoutError);
      expect((error as TimeoutError).message).toContain('test-op');
    }
  });

  it('incluye el ms en el mensaje de error', async () => {
    const slow = new Promise<string>((resolve) =>
      setTimeout(() => resolve('too late'), 500),
    );

    try {
      await withTimeout(slow, 123);
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(TimeoutError);
      expect((error as TimeoutError).message).toContain('123ms');
    }
  });

  // ─── Límites ───────────────────────────────────────────────────

  it('retorna la promesa directamente si ms <= 0', async () => {
    const promise = Promise.resolve('no-timeout');
    const result = await withTimeout(promise, 0);
    expect(result).toBe('no-timeout');
  });

  it('retorna la promesa directamente si ms es negativo', async () => {
    const promise = Promise.resolve('negative');
    const result = await withTimeout(promise, -1);
    expect(result).toBe('negative');
  });

  // ─── Promesa que rechaza ───────────────────────────────────────

  it('rechaza con el error original si la promesa falla antes del timeout', async () => {
    const failing = Promise.reject(new Error('custom error'));
    await expect(withTimeout(failing, 1000)).rejects.toThrow('custom error');
  });
});

// ─── TimeoutError ─────────────────────────────────────────────────

describe('TimeoutError', () => {
  it('hereda de Error', () => {
    const err = new TimeoutError(1000);
    expect(err).toBeInstanceOf(Error);
  });

  it('tiene name = TimeoutError', () => {
    const err = new TimeoutError(1000);
    expect(err.name).toBe('TimeoutError');
  });

  it('incluye el tiempo en el mensaje', () => {
    const err = new TimeoutError(500);
    expect(err.message).toContain('500ms');
  });

  it('incluye el nombre de la operación si se provee', () => {
    const err = new TimeoutError(500, 'email:send');
    expect(err.message).toContain('email:send');
    expect(err.message).toContain('500ms');
  });

  it('no incluye nombre si no se provee', () => {
    const err = new TimeoutError(500);
    expect(err.message).not.toContain('undefined');
  });
});

// ─── WORKER_TIMEOUTS ──────────────────────────────────────────────

describe('WORKER_TIMEOUTS', () => {
  it('tiene valores definidos para todas las categorías', () => {
    expect(WORKER_TIMEOUTS.EMAIL_WELCOME).toBeGreaterThan(0);
    expect(WORKER_TIMEOUTS.EMAIL_PASSWORD_RESET).toBeGreaterThan(0);
    expect(WORKER_TIMEOUTS.EMAIL_NEW_CHAPTER).toBeGreaterThan(0);
    expect(WORKER_TIMEOUTS.EMAIL_ACHIEVEMENT).toBeGreaterThan(0);
    expect(WORKER_TIMEOUTS.EMAIL_TIP).toBeGreaterThan(0);
    expect(WORKER_TIMEOUTS.EMAIL_CROWDFUNDING).toBeGreaterThan(0);
    expect(WORKER_TIMEOUTS.EMAIL_COMMENT_REPLY).toBeGreaterThan(0);
    expect(WORKER_TIMEOUTS.EMAIL_LEVEL_UP).toBeGreaterThan(0);
    expect(WORKER_TIMEOUTS.EMAIL_MENTION).toBeGreaterThan(0);
    expect(WORKER_TIMEOUTS.EMAIL_CLAN_INVITE).toBeGreaterThan(0);
    expect(WORKER_TIMEOUTS.EMAIL_CUSTOM).toBeGreaterThan(0);
    expect(WORKER_TIMEOUTS.EMAIL_MARKETING).toBeGreaterThan(0);
    expect(WORKER_TIMEOUTS.NOTIFICATION_IN_APP).toBeGreaterThan(0);
    expect(WORKER_TIMEOUTS.NOTIFICATION_PUSH).toBeGreaterThan(0);
    expect(WORKER_TIMEOUTS.NOTIFICATION_COMBINED).toBeGreaterThan(0);
    expect(WORKER_TIMEOUTS.NOTIFICATION_BULK_PUSH).toBeGreaterThan(0);
    expect(WORKER_TIMEOUTS.INBOUND_CLASSIFY).toBeGreaterThan(0);
    expect(WORKER_TIMEOUTS.INBOUND_PROCESS).toBeGreaterThan(0);
    expect(WORKER_TIMEOUTS.DEFAULT).toBeGreaterThan(0);
  });

  it('los timeouts de email rápido son menores o iguales a 10s', () => {
    const fastEmails = [
      WORKER_TIMEOUTS.EMAIL_WELCOME,
      WORKER_TIMEOUTS.EMAIL_PASSWORD_RESET,
      WORKER_TIMEOUTS.EMAIL_ACHIEVEMENT,
      WORKER_TIMEOUTS.EMAIL_TIP,
      WORKER_TIMEOUTS.EMAIL_LEVEL_UP,
      WORKER_TIMEOUTS.EMAIL_MENTION,
      WORKER_TIMEOUTS.EMAIL_CLAN_INVITE,
    ];
    for (const t of fastEmails) {
      expect(t).toBeLessThanOrEqual(10_000);
    }
  });

  it('bulk push es el timeout más largo', () => {
    const values = Object.values(WORKER_TIMEOUTS).filter(
      (v): v is number => typeof v === 'number',
    );
    const max = Math.max(...values);
    expect(WORKER_TIMEOUTS.NOTIFICATION_BULK_PUSH).toBe(max);
  });
});
