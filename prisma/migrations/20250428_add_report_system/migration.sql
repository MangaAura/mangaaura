-- Migration: Add User Report System
-- Created: 2025-04-28

-- Create UserReport table
CREATE TABLE IF NOT EXISTS "UserReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT,
    "reportedMangaId" TEXT,
    "reportedChapterId" TEXT,
    "reportedCommentId" TEXT,
    "reportType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "evidenceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "assignedTo" TEXT,
    "resolution" TEXT,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("reportedMangaId") REFERENCES "MangaSeries"("id") ON DELETE CASCADE,
    FOREIGN KEY ("reportedChapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE,
    FOREIGN KEY ("reportedCommentId") REFERENCES "Comment"("id") ON DELETE CASCADE,
    FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS "idx_user_report_reporter" ON "UserReport"("reporterId");
CREATE INDEX IF NOT EXISTS "idx_user_report_reported_user" ON "UserReport"("reportedUserId");
CREATE INDEX IF NOT EXISTS "idx_user_report_reported_manga" ON "UserReport"("reportedMangaId");
CREATE INDEX IF NOT EXISTS "idx_user_report_reported_chapter" ON "UserReport"("reportedChapterId");
CREATE INDEX IF NOT EXISTS "idx_user_report_reported_comment" ON "UserReport"("reportedCommentId");
CREATE INDEX IF NOT EXISTS "idx_user_report_status" ON "UserReport"("status");
CREATE INDEX IF NOT EXISTS "idx_user_report_priority" ON "UserReport"("priority");
CREATE INDEX IF NOT EXISTS "idx_user_report_assigned" ON "UserReport"("assignedTo");
CREATE INDEX IF NOT EXISTS "idx_user_report_created" ON "UserReport"("createdAt");

-- Create ReportType enum values documentation
-- HARASSMENT: Acoso, bullying, intimidación
-- SPAM: Spam, publicidad no solicitada
-- INAPPROPRIATE_CONTENT: Contenido inapropiado, NSFW
-- COPYRIGHT_VIOLATION: Violación de derechos de autor
-- IMPERSONATION: Suplantación de identidad
-- HATE_SPEECH: Discurso de odio
-- VIOLENCE: Violencia o amenazas
-- SCAM: Estafa, phishing
-- OTHER: Otro motivo

-- Create Status enum values
-- PENDING: Pendiente de revisión
-- UNDER_REVIEW: En revisión
-- RESOLVED: Resuelto
-- DISMISSED: Descartado
-- ESCALATED: Escalado a administrador

-- Create Priority enum values
-- LOW: Baja prioridad
-- MEDIUM: Prioridad media
-- HIGH: Alta prioridad
-- CRITICAL: Crítica (requiere acción inmediata)
