/**
 * Uptime tracker — records when the server started and provides uptime info.
 *
 * Use this module instead of raw `process.uptime()` because it survives
 * module reloads in development (e.g. Turbopack HMR) and gives a consistent
 * reference point.
 */

const START_TIME = Date.now();

export function getStartTime(): number {
  return START_TIME;
}

export function getUptimeSeconds(): number {
  return Math.floor((Date.now() - START_TIME) / 1000);
}

export function getUptimeHuman(): string {
  const seconds = getUptimeSeconds();
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

export function getUptimeISO(): string {
  const seconds = getUptimeSeconds();
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [
    'P',
    days > 0 ? `${days}D` : '',
    'T',
    hours > 0 ? `${hours}H` : '',
    minutes > 0 ? `${minutes}M` : '',
    `${secs}S`,
  ].join('');
}
