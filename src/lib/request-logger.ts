interface RequestLog {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  ip: string;
  userAgent: string;
  userId?: string;
  requestId: string;
}

export function logRequest(data: RequestLog): void {
  const timestamp = new Date().toISOString();
  const level = data.statusCode >= 500 ? 'ERROR' : data.statusCode >= 400 ? 'WARN' : 'INFO';

  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify({
      timestamp,
      level,
      type: 'http_request',
      ...data,
    }));
  } else {
    const status = data.statusCode;
    const ms = data.duration;
    const color = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m';
    const reset = '\x1b[0m';
    console.log(`${timestamp} ${color}${status}${reset} ${data.method} ${data.path} ${ms}ms ${data.ip}`);
  }
}

export function generateRequestId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
