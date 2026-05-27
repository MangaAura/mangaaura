-- CreateTable
CREATE TABLE "MangaGenre" (
    "id" TEXT NOT NULL,
    "mangaId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MangaGenre_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MangaGenre_mangaId_idx" ON "MangaGenre"("mangaId");

-- CreateIndex
CREATE INDEX "MangaGenre_genreId_idx" ON "MangaGenre"("genreId");

-- CreateIndex
CREATE UNIQUE INDEX "MangaGenre_mangaId_genreId_key" ON "MangaGenre"("mangaId", "genreId");

-- AddForeignKey
ALTER TABLE "MangaGenre" ADD CONSTRAINT "MangaGenre_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "MangaSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MangaGenre" ADD CONSTRAINT "MangaGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;
