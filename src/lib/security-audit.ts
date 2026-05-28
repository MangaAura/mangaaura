import { prisma } from './prisma';

export type SecurityAction =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_BANNED'
  | 'USER_UNBANNED'
  | 'USER_PROMOTED'
  | 'USER_DEMOTED'
  | 'MANGA_CREATED'
  | 'MANGA_UPDATED'
  | 'MANGA_DELETED'
  | 'MANGA_HIDDEN'
  | 'CHAPTER_CREATED'
  | 'CHAPTER_UPDATED'
  | 'CHAPTER_DELETED'
  | 'CHAPTER_HIDDEN'
  | 'COMMENT_DELETED'
  | 'COMMENT_HIDDEN'
  | 'REPORT_ASSIGNED'
  | 'REPORT_RESOLVED'
  | 'DMCA_REVIEWED'
  | 'ADMIN_ACTION'
  | 'SUSPICIOUS_ACTIVITY'
  | 'CREATED_COLLECTION'
  | 'USER_FOLLOWED_USER'
  | 'BLOCKED_USER'
  | 'UNBLOCKED_USER'
  | 'CLAN_CREATED'
  | 'CLAN_DELETED'
  | 'CLAN_DESCRIPTION_UPDATED'
  | 'CLAN_EMBLEM_UPDATED'
  | 'CLAN_MEMBER_KICKED'
  | 'CLAN_MEMBER_PROMOTED'
  | 'CLAN_MEMBER_DEMOTED'
  | 'CLAN_LEADERSHIP_TRANSFERRED'
  | 'CLAN_MEMBER_LEFT'
  | 'CLAN_MEMBER_JOINED'
  | 'CLAN_CHAT_MESSAGE_DELETED'
  | 'CLAN_INVITE_SENT'
  | 'CLAN_INVITE_ACCEPTED'
  | 'CLAN_INVITE_REJECTED'
  | 'CLAN_JOIN_REQUESTED'
  | 'CLAN_JOIN_APPROVED'
  | 'CLAN_JOIN_REJECTED';

export type Severity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

interface AuditLogParams {
  userId?: string;
  action: SecurityAction;
  targetId?: string;
  targetType?: 'USER' | 'MANGA' | 'CHAPTER' | 'COMMENT' | 'REPORT' | 'CLAN' | 'CLAN_CHAT';
  metadata?: Record<string, unknown>;
  severity?: Severity;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log a security event to the audit log
 */
export async function logSecurityEvent(params: AuditLogParams): Promise<void> {
  try {
    const {
      userId,
      action,
      targetId,
      targetType,
      metadata,
      severity = 'INFO',
      ipAddress,
      userAgent,
    } = params;

    await prisma.securityAuditLog.create({
      data: {
        userId,
        action,
        targetId,
        targetType,
        metadata: metadata ? JSON.stringify(metadata) : null,
        severity,
        ipAddress,
        userAgent,
      },
    });

    // Log to console for monitoring
    const logLevel = severity === 'CRITICAL' ? 'error' : severity === 'ERROR' ? 'error' : severity === 'WARNING' ? 'warn' : 'info';
    console[logLevel](`[SecurityAudit] ${action}:`, {
      userId,
      targetId,
      targetType,
      severity,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * Log admin actions with elevated severity
 */
export async function logAdminAction(
  adminId: string,
  action: SecurityAction,
  targetId: string,
  targetType: 'USER' | 'MANGA' | 'CHAPTER' | 'COMMENT',
  metadata?: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  await logSecurityEvent({
    userId: adminId,
    action,
    targetId,
    targetType,
    metadata,
    severity: 'WARNING',
    ipAddress,
  });
}

/**
 * Log suspicious activity (potential security threats)
 */
export async function logSuspiciousActivity(
  userId: string,
  activity: string,
  details: Record<string, unknown>,
  ipAddress: string
): Promise<void> {
  await logSecurityEvent({
    userId,
    action: 'SUSPICIOUS_ACTIVITY',
    metadata: { activity, details },
    severity: 'WARNING',
    ipAddress,
  });
}

/**
 * Get security audit logs (admin only)
 */
export async function getSecurityLogs(
  options: {
    userId?: string;
    action?: SecurityAction;
    targetId?: string;
    severity?: Severity;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{
  logs: Array<{
    id: string;
    userId: string | null;
    action: SecurityAction;
    targetId: string | null;
    targetType: string | null;
    severity: Severity;
    createdAt: Date;
  }>;
  total: number;
}> {
  const where: Record<string, unknown> = {};

  if (options.userId) where.userId = options.userId;
  if (options.action) where.action = options.action;
  if (options.targetId) where.targetId = options.targetId;
  if (options.severity) where.severity = options.severity;
  if (options.startDate || options.endDate) {
    where.createdAt = {};
    if (options.startDate) (where.createdAt as Record<string, Date>).gte = options.startDate;
    if (options.endDate) (where.createdAt as Record<string, Date>).lte = options.endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.securityAuditLog.findMany({
      where,
      take: options.limit || 100,
      skip: options.offset || 0,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, displayName: true },
        },
      },
    }),
    prisma.securityAuditLog.count({ where }),
  ]);

  return { logs: logs.map(log => ({
    id: log.id,
    userId: log.userId,
    action: log.action as SecurityAction,
    targetId: log.targetId,
    targetType: log.targetType,
    severity: log.severity as Severity,
    createdAt: log.createdAt,
  })), total };
}

/**
 * Check for suspicious patterns
 */
export async function detectSuspiciousPatterns(userId: string): Promise<{
  isSuspicious: boolean;
  reasons: string[];
}> {
  const reasons: string[] = [];
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Check rapid comment posting
  const recentComments = await prisma.comment.count({
    where: {
      userId,
      createdAt: { gte: oneHourAgo },
    },
  });
  if (recentComments > 20) {
    reasons.push(`Rapid comment posting: ${recentComments} comments in 1 hour`);
  }

  // Check failed login attempts (would need a separate login attempts table)
  // This is a placeholder for future implementation

  // Check report spamming
  const recentReports = await prisma.userReport.count({
    where: {
      reporterId: userId,
      createdAt: { gte: oneDayAgo },
    },
  });
  if (recentReports > 10) {
    reasons.push(`Report spamming: ${recentReports} reports in 24 hours`);
  }

  // Check if user is creating multiple accounts (by IP - would need tracking)

  return {
    isSuspicious: reasons.length > 0,
    reasons,
  };
}
