-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SponsorshipBid" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chapterId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bidAmount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isWinning" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    CONSTRAINT "SponsorshipBid_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SponsorshipBid_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SponsorshipBid" ("bidAmount", "chapterId", "createdAt", "expiresAt", "id", "isWinning", "userId") SELECT "bidAmount", "chapterId", "createdAt", "expiresAt", "id", "isWinning", "userId" FROM "SponsorshipBid";
DROP TABLE "SponsorshipBid";
ALTER TABLE "new_SponsorshipBid" RENAME TO "SponsorshipBid";
CREATE INDEX "SponsorshipBid_userId_idx" ON "SponsorshipBid"("userId");
CREATE INDEX "SponsorshipBid_chapterId_idx" ON "SponsorshipBid"("chapterId");
CREATE INDEX "SponsorshipBid_status_idx" ON "SponsorshipBid"("status");
CREATE INDEX "SponsorshipBid_isWinning_idx" ON "SponsorshipBid"("isWinning");
CREATE INDEX "SponsorshipBid_createdAt_idx" ON "SponsorshipBid"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
