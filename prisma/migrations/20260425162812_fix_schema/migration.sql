/*
  Warnings:

  - You are about to alter the column `chapterNumber` on the `Chapter` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to alter the column `currentSeason` on the `Clan` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - Made the column `condition` on table `AchievementDefinition` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `AchievementDefinition` required. This step will fail if there are existing NULL values in that column.
  - Made the column `pageUrls` on table `Chapter` required. This step will fail if there are existing NULL values in that column.
  - Made the column `authorName` on table `MangaSeries` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tags` on table `MangaSeries` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "ChapterCorrection_createdAt_idx";

-- DropIndex
DROP INDEX "ClanMembership_role_idx";

-- DropIndex
DROP INDEX "Comment_isHidden_idx";

-- DropIndex
DROP INDEX "Comment_isDeleted_idx";

-- DropIndex
DROP INDEX "CommentLike_createdAt_idx";

-- DropIndex
DROP INDEX "CommentMention_createdAt_idx";

-- DropIndex
DROP INDEX "CrowdfundingContribution_createdAt_idx";

-- DropIndex
DROP INDEX "Notification_type_idx";

-- DropIndex
DROP INDEX "RateLimit_action_idx";

-- DropIndex
DROP INDEX "Session_sessionToken_idx";

-- DropIndex
DROP INDEX "Tip_createdAt_idx";

-- DropIndex
DROP INDEX "Transaction_referenceId_idx";

-- DropIndex
DROP INDEX "Transaction_type_idx";

-- DropIndex
DROP INDEX "User_createdAt_idx";

-- DropIndex
DROP INDEX "User_role_idx";

-- DropIndex
DROP INDEX "User_username_idx";

-- DropIndex
DROP INDEX "UserAchievement_unlockedAt_idx";

-- DropIndex
DROP INDEX "UserActivity_referenceId_idx";

-- DropIndex
DROP INDEX "VerificationToken_token_idx";

-- DropIndex
DROP INDEX "VerificationToken_identifier_idx";

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AchievementDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "badgeId" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT,
    "condition" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_AchievementDefinition" ("badgeId", "condition", "createdAt", "description", "iconUrl", "id", "name", "xpReward") SELECT "badgeId", "condition", "createdAt", "description", "iconUrl", "id", "name", "xpReward" FROM "AchievementDefinition";
DROP TABLE "AchievementDefinition";
ALTER TABLE "new_AchievementDefinition" RENAME TO "AchievementDefinition";
CREATE UNIQUE INDEX "AchievementDefinition_badgeId_key" ON "AchievementDefinition"("badgeId");
CREATE INDEX "AchievementDefinition_badgeId_idx" ON "AchievementDefinition"("badgeId");
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
CREATE INDEX "Chapter_mangaId_idx" ON "Chapter"("mangaId");
CREATE INDEX "Chapter_createdAt_idx" ON "Chapter"("createdAt");
CREATE UNIQUE INDEX "Chapter_mangaId_chapterNumber_key" ON "Chapter"("mangaId", "chapterNumber");
CREATE TABLE "new_Clan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "emblemUrl" TEXT,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "monthlyScore" INTEGER NOT NULL DEFAULT 0,
    "currentSeason" INTEGER NOT NULL DEFAULT 1,
    "leaderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Clan_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Clan" ("createdAt", "currentSeason", "description", "emblemUrl", "id", "leaderId", "monthlyScore", "name", "totalScore") SELECT "createdAt", coalesce("currentSeason", 1) AS "currentSeason", "description", "emblemUrl", "id", "leaderId", "monthlyScore", "name", "totalScore" FROM "Clan";
DROP TABLE "Clan";
ALTER TABLE "new_Clan" RENAME TO "Clan";
CREATE UNIQUE INDEX "Clan_name_key" ON "Clan"("name");
CREATE UNIQUE INDEX "Clan_leaderId_key" ON "Clan"("leaderId");
CREATE INDEX "Clan_name_idx" ON "Clan"("name");
CREATE INDEX "Clan_leaderId_idx" ON "Clan"("leaderId");
CREATE TABLE "new_MangaSeries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ONGOING',
    "tags" TEXT NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "rating" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MangaSeries_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MangaSeries" ("authorId", "authorName", "coverUrl", "createdAt", "description", "id", "rating", "slug", "status", "tags", "title", "totalViews", "updatedAt") SELECT "authorId", "authorName", "coverUrl", "createdAt", "description", "id", "rating", "slug", "status", "tags", "title", "totalViews", "updatedAt" FROM "MangaSeries";
DROP TABLE "MangaSeries";
ALTER TABLE "new_MangaSeries" RENAME TO "MangaSeries";
CREATE UNIQUE INDEX "MangaSeries_slug_key" ON "MangaSeries"("slug");
CREATE INDEX "MangaSeries_slug_idx" ON "MangaSeries"("slug");
CREATE INDEX "MangaSeries_status_idx" ON "MangaSeries"("status");
CREATE TABLE "new_ReadingSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    CONSTRAINT "ReadingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReadingSession_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ReadingSession" ("chapterId", "durationSeconds", "endedAt", "id", "startedAt", "userId") SELECT "chapterId", "durationSeconds", "endedAt", "id", "startedAt", "userId" FROM "ReadingSession";
DROP TABLE "ReadingSession";
ALTER TABLE "new_ReadingSession" RENAME TO "ReadingSession";
CREATE INDEX "ReadingSession_userId_idx" ON "ReadingSession"("userId");
CREATE INDEX "ReadingSession_chapterId_idx" ON "ReadingSession"("chapterId");
CREATE INDEX "ReadingSession_startedAt_idx" ON "ReadingSession"("startedAt");
CREATE TABLE "new_SponsorshipBid" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chapterId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bidAmount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isWinning" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "sponsorName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    CONSTRAINT "SponsorshipBid_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SponsorshipBid_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SponsorshipBid" ("bidAmount", "chapterId", "createdAt", "expiresAt", "id", "isWinning", "message", "sponsorName", "status", "userId") SELECT "bidAmount", "chapterId", "createdAt", "expiresAt", "id", "isWinning", "message", "sponsorName", "status", "userId" FROM "SponsorshipBid";
DROP TABLE "SponsorshipBid";
ALTER TABLE "new_SponsorshipBid" RENAME TO "SponsorshipBid";
CREATE INDEX "SponsorshipBid_chapterId_idx" ON "SponsorshipBid"("chapterId");
CREATE INDEX "SponsorshipBid_userId_idx" ON "SponsorshipBid"("userId");
CREATE INDEX "SponsorshipBid_status_idx" ON "SponsorshipBid"("status");
CREATE INDEX "SponsorshipBid_isWinning_idx" ON "SponsorshipBid"("isWinning");
CREATE INDEX "SponsorshipBid_createdAt_idx" ON "SponsorshipBid"("createdAt");
CREATE TABLE "new_UserManga" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mangaId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "rating" REAL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserManga_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserManga_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "MangaSeries" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserManga" ("addedAt", "id", "isFavorite", "mangaId", "progress", "rating", "status", "updatedAt", "userId") SELECT "addedAt", "id", "isFavorite", "mangaId", "progress", "rating", "status", "updatedAt", "userId" FROM "UserManga";
DROP TABLE "UserManga";
ALTER TABLE "new_UserManga" RENAME TO "UserManga";
CREATE INDEX "UserManga_userId_idx" ON "UserManga"("userId");
CREATE INDEX "UserManga_mangaId_idx" ON "UserManga"("mangaId");
CREATE INDEX "UserManga_status_idx" ON "UserManga"("status");
CREATE UNIQUE INDEX "UserManga_userId_mangaId_key" ON "UserManga"("userId", "mangaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "User_xpPoints_idx" ON "User"("xpPoints");
