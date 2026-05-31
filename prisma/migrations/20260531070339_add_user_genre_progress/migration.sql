-- CreateTable
CREATE TABLE "UserGenreProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "chaptersRead" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGenreProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserGenreProgress_userId_idx" ON "UserGenreProgress"("userId");

-- CreateIndex
CREATE INDEX "UserGenreProgress_genre_idx" ON "UserGenreProgress"("genre");

-- CreateIndex
CREATE UNIQUE INDEX "UserGenreProgress_userId_genre_key" ON "UserGenreProgress"("userId", "genre");

-- AddForeignKey
ALTER TABLE "UserGenreProgress" ADD CONSTRAINT "UserGenreProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
