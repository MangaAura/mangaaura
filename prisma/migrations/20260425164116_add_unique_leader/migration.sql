-- CreateTable
CREATE TABLE "UserLibrary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mangaId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'READING',
    "currentChapter" INTEGER NOT NULL DEFAULT 0,
    "rating" REAL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserLibrary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserLibrary_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "MangaSeries" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReadingProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mangaId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "page" INTEGER NOT NULL DEFAULT 0,
    "percentage" REAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReadingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReadingProgress_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "MangaSeries" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReadingProgress_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "UserLibrary_userId_idx" ON "UserLibrary"("userId");

-- CreateIndex
CREATE INDEX "UserLibrary_mangaId_idx" ON "UserLibrary"("mangaId");

-- CreateIndex
CREATE INDEX "UserLibrary_status_idx" ON "UserLibrary"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserLibrary_userId_mangaId_key" ON "UserLibrary"("userId", "mangaId");

-- CreateIndex
CREATE INDEX "ReadingProgress_userId_idx" ON "ReadingProgress"("userId");

-- CreateIndex
CREATE INDEX "ReadingProgress_mangaId_idx" ON "ReadingProgress"("mangaId");

-- CreateIndex
CREATE INDEX "ReadingProgress_chapterId_idx" ON "ReadingProgress"("chapterId");

-- CreateIndex
CREATE INDEX "ReadingProgress_updatedAt_idx" ON "ReadingProgress"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingProgress_userId_mangaId_chapterId_key" ON "ReadingProgress"("userId", "mangaId", "chapterId");

-- CreateIndex
CREATE INDEX "MangaSeries_createdAt_idx" ON "MangaSeries"("createdAt");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");
