-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
