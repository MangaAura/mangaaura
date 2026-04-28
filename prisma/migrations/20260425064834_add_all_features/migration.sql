/*
  Warnings:

  - You are about to drop the `AnalyticsEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChapterStats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DailyStats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HourlyStats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RateLimit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `leaderId` on the `Clan` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Notification` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "AnalyticsEvent_sessionId_idx";

-- DropIndex
DROP INDEX "AnalyticsEvent_timestamp_idx";

-- DropIndex
DROP INDEX "AnalyticsEvent_userId_idx";

-- DropIndex
DROP INDEX "AnalyticsEvent_chapterId_idx";

-- DropIndex
DROP INDEX "AnalyticsEvent_mangaId_idx";

-- DropIndex
DROP INDEX "AnalyticsEvent_type_idx";

-- DropIndex
DROP INDEX "ChapterStats_mangaId_idx";

-- DropIndex
DROP INDEX "ChapterStats_chapterId_idx";

-- DropIndex
DROP INDEX "ChapterStats_chapterId_key";

-- DropIndex
DROP INDEX "DailyStats_date_mangaId_key";

-- DropIndex
DROP INDEX "DailyStats_date_mangaId_idx";

-- DropIndex
DROP INDEX "DailyStats_mangaId_idx";

-- DropIndex
DROP INDEX "DailyStats_date_idx";

-- DropIndex
DROP INDEX "HourlyStats_date_hour_mangaId_key";

-- DropIndex
DROP INDEX "HourlyStats_mangaId_idx";

-- DropIndex
DROP INDEX "HourlyStats_date_idx";

-- DropIndex
DROP INDEX "RateLimit_windowStart_idx";

-- DropIndex
DROP INDEX "RateLimit_userId_idx";

-- DropIndex
DROP INDEX "RateLimit_userId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AnalyticsEvent";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ChapterStats";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DailyStats";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "HourlyStats";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "RateLimit";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Chapter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mangaId" TEXT NOT NULL,
    "chapterNumber" INTEGER NOT NULL,
    "title" TEXT,
    "totalPages" INTEGER NOT NULL DEFAULT 0,
    "pageUrls" TEXT NOT NULL,
    "crowdfundingGoal" INTEGER,
    "crowdfundingCurrent" INTEGER NOT NULL DEFAULT 0,
    "isCrowdfunded" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Chapter_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "MangaSeries" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Chapter" ("chapterNumber", "createdAt", "crowdfundingCurrent", "crowdfundingGoal", "id", "isCrowdfunded", "mangaId", "pageUrls", "title", "totalPages", "viewCount") SELECT "chapterNumber", "createdAt", "crowdfundingCurrent", "crowdfundingGoal", "id", "isCrowdfunded", "mangaId", "pageUrls", "title", "totalPages", "viewCount" FROM "Chapter";
DROP TABLE "Chapter";
ALTER TABLE "new_Chapter" RENAME TO "Chapter";
CREATE INDEX "Chapter_createdAt_idx" ON "Chapter"("createdAt");
CREATE INDEX "Chapter_mangaId_idx" ON "Chapter"("mangaId");
CREATE UNIQUE INDEX "Chapter_mangaId_chapterNumber_key" ON "Chapter"("mangaId", "chapterNumber");
CREATE TABLE "new_Clan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "emblemUrl" TEXT,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "monthlyScore" INTEGER NOT NULL DEFAULT 0,
    "currentSeason" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Clan" ("createdAt", "currentSeason", "description", "emblemUrl", "id", "monthlyScore", "name", "totalScore") SELECT "createdAt", "currentSeason", "description", "emblemUrl", "id", "monthlyScore", "name", "totalScore" FROM "Clan";
DROP TABLE "Clan";
ALTER TABLE "new_Clan" RENAME TO "Clan";
CREATE UNIQUE INDEX "Clan_name_key" ON "Clan"("name");
CREATE INDEX "Clan_name_idx" ON "Clan"("name");
CREATE TABLE "new_Notification" (
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
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("createdAt", "data", "id", "imageUrl", "isRead", "linkUrl", "message", "title", "type", "userId") SELECT "createdAt", "data", "id", "imageUrl", "isRead", "linkUrl", "message", "title", "type", "userId" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "passwordHash" TEXT,
    "emailVerified" DATETIME,
    "xpPoints" INTEGER NOT NULL DEFAULT 0,
    "inkcoinsBalance" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "readingStreak" INTEGER NOT NULL DEFAULT 0,
    "lastReadAt" DATETIME,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "emailPreferences" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatarUrl", "createdAt", "displayName", "email", "emailVerified", "id", "inkcoinsBalance", "lastReadAt", "level", "passwordHash", "readingStreak", "role", "updatedAt", "username", "xpPoints") SELECT "avatarUrl", "createdAt", "displayName", "email", "emailVerified", "id", "inkcoinsBalance", "lastReadAt", "level", "passwordHash", "readingStreak", "role", "updatedAt", "username", "xpPoints" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_xpPoints_idx" ON "User"("xpPoints");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
