/*
  Warnings:

  - Added the required column `leaderId` to the `Clan` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "ClanMembership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clanId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contributedScore" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ClanMembership_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "Clan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClanMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "linkUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "mangaId" TEXT,
    "chapterId" TEXT,
    "userId" TEXT,
    "sessionId" TEXT,
    "metadata" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "referrer" TEXT
);

-- CreateTable
CREATE TABLE "DailyStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "mangaId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "reads" INTEGER NOT NULL DEFAULT 0,
    "completions" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "avgTimeSpent" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "HourlyStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "hour" INTEGER NOT NULL,
    "mangaId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "reads" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "ChapterStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chapterId" TEXT NOT NULL,
    "mangaId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "reads" INTEGER NOT NULL DEFAULT 0,
    "completions" INTEGER NOT NULL DEFAULT 0,
    "avgTimeSpent" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Tip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chapterId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tip_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Tip_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Tip_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CrowdfundingContribution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chapterId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrowdfundingContribution_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CrowdfundingContribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Clan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "emblemUrl" TEXT,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "monthlyScore" INTEGER NOT NULL DEFAULT 0,
    "currentSeason" INTEGER NOT NULL DEFAULT 1,
    "leaderId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Clan" ("createdAt", "currentSeason", "description", "emblemUrl", "id", "monthlyScore", "name", "totalScore") SELECT "createdAt", "currentSeason", "description", "emblemUrl", "id", "monthlyScore", "name", "totalScore" FROM "Clan";
DROP TABLE "Clan";
ALTER TABLE "new_Clan" RENAME TO "Clan";
CREATE UNIQUE INDEX "Clan_name_key" ON "Clan"("name");
CREATE INDEX "Clan_name_idx" ON "Clan"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ClanMembership_clanId_idx" ON "ClanMembership"("clanId");

-- CreateIndex
CREATE INDEX "ClanMembership_userId_idx" ON "ClanMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClanMembership_clanId_userId_key" ON "ClanMembership"("clanId", "userId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_type_idx" ON "AnalyticsEvent"("type");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_mangaId_idx" ON "AnalyticsEvent"("mangaId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_chapterId_idx" ON "AnalyticsEvent"("chapterId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_timestamp_idx" ON "AnalyticsEvent"("timestamp");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_sessionId_idx" ON "AnalyticsEvent"("sessionId");

-- CreateIndex
CREATE INDEX "DailyStats_date_idx" ON "DailyStats"("date");

-- CreateIndex
CREATE INDEX "DailyStats_mangaId_idx" ON "DailyStats"("mangaId");

-- CreateIndex
CREATE INDEX "DailyStats_date_mangaId_idx" ON "DailyStats"("date", "mangaId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStats_date_mangaId_key" ON "DailyStats"("date", "mangaId");

-- CreateIndex
CREATE INDEX "HourlyStats_date_idx" ON "HourlyStats"("date");

-- CreateIndex
CREATE INDEX "HourlyStats_mangaId_idx" ON "HourlyStats"("mangaId");

-- CreateIndex
CREATE UNIQUE INDEX "HourlyStats_date_hour_mangaId_key" ON "HourlyStats"("date", "hour", "mangaId");

-- CreateIndex
CREATE UNIQUE INDEX "ChapterStats_chapterId_key" ON "ChapterStats"("chapterId");

-- CreateIndex
CREATE INDEX "ChapterStats_chapterId_idx" ON "ChapterStats"("chapterId");

-- CreateIndex
CREATE INDEX "ChapterStats_mangaId_idx" ON "ChapterStats"("mangaId");

-- CreateIndex
CREATE INDEX "Tip_chapterId_idx" ON "Tip"("chapterId");

-- CreateIndex
CREATE INDEX "Tip_fromUserId_idx" ON "Tip"("fromUserId");

-- CreateIndex
CREATE INDEX "Tip_toUserId_idx" ON "Tip"("toUserId");

-- CreateIndex
CREATE INDEX "CrowdfundingContribution_chapterId_idx" ON "CrowdfundingContribution"("chapterId");

-- CreateIndex
CREATE INDEX "CrowdfundingContribution_userId_idx" ON "CrowdfundingContribution"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CrowdfundingContribution_chapterId_userId_key" ON "CrowdfundingContribution"("chapterId", "userId");
