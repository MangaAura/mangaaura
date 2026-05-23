import { prisma } from './prisma';
import { logSecurityEvent } from './security-audit';

export interface AnomalyAlert {
  type: 'IMPOSSIBLE_TRAVEL' | 'CREDENTIAL_STUFFING' | 'IP_ROTATION' | 'MULTIPLE_ACCOUNTS';
  userId?: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  details: string;
  metadata?: Record<string, unknown>;
}

function getSubnet(ip: string): string | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  return `${parts[0]}.${parts[1]}`;
}

export async function detectImpossibleTravel(
  userId: string,
  currentIp: string,
  currentUserAgent: string
): Promise<AnomalyAlert | null> {
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);

  const previousLogin = await prisma.loginAttempt.findFirst({
    where: {
      userId,
      success: true,
      ipAddress: { not: currentIp },
      createdAt: { gte: fifteenMinAgo },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!previousLogin) return null;

  const currentSubnet = getSubnet(currentIp);
  const previousSubnet = getSubnet(previousLogin.ipAddress);

  if (currentSubnet && previousSubnet && currentSubnet !== previousSubnet) {
    return {
      type: 'IMPOSSIBLE_TRAVEL',
      userId,
      severity: 'CRITICAL',
      details: `User logged in from different /16 subnet within 15 minutes: ${previousLogin.ipAddress} -> ${currentIp}`,
      metadata: {
        previousIp: previousLogin.ipAddress,
        currentIp,
        previousUserAgent: previousLogin.userAgent,
        currentUserAgent,
      },
    };
  }

  return null;
}

export async function detectCredentialStuffing(
  ip: string,
  windowMinutes = 15
): Promise<AnomalyAlert | null> {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);

  const failedAttempts = await prisma.loginAttempt.findMany({
    where: {
      ipAddress: ip,
      success: false,
      createdAt: { gte: since },
    },
    select: { email: true },
  });

  if (failedAttempts.length === 0) return null;

  if (failedAttempts.length > 20) {
    const uniqueEmails = new Set(failedAttempts.map((a) => a.email));
    return {
      type: 'CREDENTIAL_STUFFING',
      severity: 'CRITICAL',
      details: `${failedAttempts.length} failed logins from IP ${ip} in ${windowMinutes}min across ${uniqueEmails.size} different emails`,
      metadata: {
        ip,
        failedCount: failedAttempts.length,
        uniqueEmails: uniqueEmails.size,
        windowMinutes,
      },
    };
  }

  if (failedAttempts.length > 10) {
    return {
      type: 'CREDENTIAL_STUFFING',
      severity: 'WARNING',
      details: `${failedAttempts.length} failed logins from IP ${ip} in ${windowMinutes}min`,
      metadata: {
        ip,
        failedCount: failedAttempts.length,
        windowMinutes,
      },
    };
  }

  return null;
}

export async function detectIPRotation(
  userId: string,
  windowMinutes = 60
): Promise<AnomalyAlert | null> {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);

  const loginAttempts = await prisma.loginAttempt.findMany({
    where: {
      userId,
      createdAt: { gte: since },
    },
    select: { ipAddress: true },
  });

  const distinctIps = new Set(loginAttempts.map((a) => a.ipAddress));

  if (distinctIps.size > 5) {
    return {
      type: 'IP_ROTATION',
      userId,
      severity: 'CRITICAL',
      details: `User used ${distinctIps.size} distinct IPs in ${windowMinutes}min`,
      metadata: {
        ips: Array.from(distinctIps),
        count: distinctIps.size,
        windowMinutes,
      },
    };
  }

  if (distinctIps.size > 3) {
    return {
      type: 'IP_ROTATION',
      userId,
      severity: 'WARNING',
      details: `User used ${distinctIps.size} distinct IPs in ${windowMinutes}min`,
      metadata: {
        ips: Array.from(distinctIps),
        count: distinctIps.size,
        windowMinutes,
      },
    };
  }

  return null;
}

export async function detectMultipleAccounts(
  ip: string,
  windowMinutes = 60
): Promise<AnomalyAlert | null> {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);

  const logins = await prisma.loginAttempt.findMany({
    where: {
      ipAddress: ip,
      userId: { not: null },
      createdAt: { gte: since },
    },
    select: { userId: true },
  });

  const distinctUsers = new Set(logins.map((l) => l.userId).filter(Boolean));

  if (distinctUsers.size > 5) {
    return {
      type: 'MULTIPLE_ACCOUNTS',
      severity: 'CRITICAL',
      details: `${distinctUsers.size} distinct accounts logged in from IP ${ip} in ${windowMinutes}min`,
      metadata: {
        ip,
        accountCount: distinctUsers.size,
        windowMinutes,
      },
    };
  }

  if (distinctUsers.size > 3) {
    return {
      type: 'MULTIPLE_ACCOUNTS',
      severity: 'WARNING',
      details: `${distinctUsers.size} distinct accounts logged in from IP ${ip} in ${windowMinutes}min`,
      metadata: {
        ip,
        accountCount: distinctUsers.size,
        windowMinutes,
      },
    };
  }

  return null;
}

export async function runAnomalyDetection(event: {
  type: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
}): Promise<AnomalyAlert[]> {
  const alerts: AnomalyAlert[] = [];

  if (event.type === 'LOGIN_SUCCESS' && event.userId && event.ip) {
    const impossibleTravel = await detectImpossibleTravel(event.userId, event.ip, event.userAgent || '');
    if (impossibleTravel) alerts.push(impossibleTravel);

    const ipRotation = await detectIPRotation(event.userId);
    if (ipRotation) alerts.push(ipRotation);
  }

  if (event.type === 'LOGIN_FAILURE' && event.ip) {
    const credentialStuffing = await detectCredentialStuffing(event.ip);
    if (credentialStuffing) alerts.push(credentialStuffing);

    const multipleAccounts = await detectMultipleAccounts(event.ip);
    if (multipleAccounts) alerts.push(multipleAccounts);
  }

  if (event.type === 'LOGIN_SUCCESS' && event.ip) {
    const multipleAccounts = await detectMultipleAccounts(event.ip);
    if (multipleAccounts) alerts.push(multipleAccounts);
  }

  for (const alert of alerts) {
    await logSecurityEvent({
      userId: alert.userId,
      action: 'SUSPICIOUS_ACTIVITY',
      targetId: alert.userId,
      targetType: 'USER',
      metadata: {
        anomalyType: alert.type,
        details: alert.details,
        ...alert.metadata,
      },
      severity: alert.severity,
      ipAddress: event.ip,
      userAgent: event.userAgent,
    });
  }

  return alerts;
}
