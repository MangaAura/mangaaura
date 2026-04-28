/*
  Warnings:

  - You are about to alter the column `chapterNumber` on the `Chapter` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - Made the column `leaderId` on table `Clan` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "User_xpPoints_idx";

-- CreateTable
CREATE TABLE "UserActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "referenceId" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AchievementDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "badgeId" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,
    "condition" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_AchievementDefinition" ("badgeId", "condition", "createdAt", "description", "iconUrl", "id", "name", "xpReward") SELECT "badgeId", "condition", "createdAt", "description", "iconUrl", "id", "name", "xpReward" FROM "AchievementDefinition";
DROP TABLE "AchievementDefinition";
ALTER TABLE "new_AchievementDefinition" RENAME TO "AchievementDefinition";
CREATE UNIQUE INDEX "AchievementDefinition_badgeId_key" ON "AchievementDefinition"("badgeId");
CREATE INDEX "AchievementDefinition_badgeId_idx" ON "AchievementDefinition"("badgeId");
CREATE INDEX "AchievementDefinition_name_idx" ON "AchievementDefinition"("name");
CREATE TABLE "new_Chapter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mangaId" TEXT NOT NULL,
    "chapterNumber" REAL NOT NULL,
    "title" TEXT,
    "totalPages" INTEGER NOT NULL DEFAULT 0,
    "pageUrls" TEXT,
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
CREATE INDEX "Chapter_chapterNumber_idx" ON "Chapter"("chapterNumber");
CREATE INDEX "Chapter_createdAt_idx" ON "Chapter"("createdAt");
CREATE INDEX "Chapter_isCrowdfunded_idx" ON "Chapter"("isCrowdfunded");
CREATE TABLE "new_Clan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "emblemUrl" TEXT,
    "leaderId" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "monthlyScore" INTEGER NOT NULL DEFAULT 0,
    "currentSeason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Clan_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Clan" ("createdAt", "currentSeason", "description", "emblemUrl", "id", "leaderId", "monthlyScore", "name", "totalScore") SELECT "createdAt", "currentSeason", "description", "emblemUrl", "id", "leaderId", "monthlyScore", "name", "totalScore" FROM "Clan";
DROP TABLE "Clan";
ALTER TABLE "new_Clan" RENAME TO "Clan";
CREATE UNIQUE INDEX "Clan_name_key" ON "Clan"("name");
CREATE UNIQUE INDEX "Clan_leaderId_key" ON "Clan"("leaderId");
CREATE INDEX "Clan_name_idx" ON "Clan"("name");
CREATE INDEX "Clan_leaderId_idx" ON "Clan"("leaderId");
CREATE INDEX "Clan_totalScore_idx" ON "Clan"("totalScore");
CREATE INDEX "Clan_monthlyScore_idx" ON "Clan"("monthlyScore");
CREATE TABLE "new_MangaSeries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ONGOING',
    "tags" TEXT,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "rating" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MangaSeries_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MangaSeries" ("authorId", "authorName", "coverUrl", "createdAt", "description", "id", "rating", "slug", "status", "tags", "title", "totalViews", "updatedAt") SELECT "authorId", "authorName", "coverUrl", "createdAt", "description", "id", coalesce("rating", 0) AS "rating", "slug", "status", "tags", "title", "totalViews", "updatedAt" FROM "MangaSeries";
DROP TABLE "MangaSeries";
ALTER TABLE "new_MangaSeries" RENAME TO "MangaSeries";
CREATE UNIQUE INDEX "MangaSeries_slug_key" ON "MangaSeries"("slug");
CREATE INDEX "MangaSeries_slug_idx" ON "MangaSeries"("slug");
CREATE INDEX "MangaSeries_authorId_idx" ON "MangaSeries"("authorId");
CREATE INDEX "MangaSeries_status_idx" ON "MangaSeries"("status");
CREATE INDEX "MangaSeries_createdAt_idx" ON "MangaSeries"("createdAt");
CREATE INDEX "MangaSeries_totalViews_idx" ON "MangaSeries"("totalViews");
CREATE TABLE "new_ReadingSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
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
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sponsorName" TEXT,
    "message" TEXT,
    "isWinning" BOOLEAN NOT NULL DEFAULT false,
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
CREATE INDEX "SponsorshipBid_expiresAt_idx" ON "SponsorshipBid"("expiresAt");
CREATE TABLE "new_UserManga" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mangaId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'READING',
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
CREATE INDEX "UserActivity_userId_idx" ON "UserActivity"("userId");

-- CreateIndex
CREATE INDEX "UserActivity_activityType_idx" ON "UserActivity"("activityType");

-- CreateIndex
CREATE INDEX "UserActivity_createdAt_idx" ON "UserActivity"("createdAt");

-- CreateIndex
CREATE INDEX "UserActivity_referenceId_idx" ON "UserActivity"("referenceId");

-- CreateIndex
CREATE INDEX "ChapterCorrection_createdAt_idx" ON "ChapterCorrection"("createdAt");

-- CreateIndex
CREATE INDEX "ClanMembership_role_idx" ON "ClanMembership"("role");

-- CreateIndex
CREATE INDEX "Comment_isDeleted_idx" ON "Comment"("isDeleted");

-- CreateIndex
CREATE INDEX "Comment_isHidden_idx" ON "Comment"("isHidden");

-- CreateIndex
CREATE INDEX "CommentLike_createdAt_idx" ON "CommentLike"("createdAt");

-- CreateIndex
CREATE INDEX "CommentMention_createdAt_idx" ON "CommentMention"("createdAt");

-- CreateIndex
CREATE INDEX "CrowdfundingContribution_createdAt_idx" ON "CrowdfundingContribution"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "RateLimit_action_idx" ON "RateLimit"("action");

-- CreateIndex
CREATE INDEX "Session_sessionToken_idx" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Tip_createdAt_idx" ON "Tip"("createdAt");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "Transaction_referenceId_idx" ON "Transaction"("referenceId");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "UserAchievement_unlockedAt_idx" ON "UserAchievement"("unlockedAt");

-- CreateIndex
CREATE INDEX "VerificationToken_identifier_idx" ON "VerificationToken"("identifier");

-- CreateIndex
CREATE INDEX "VerificationToken_token_idx" ON "VerificationToken"("token");
