-- CreateTable
CREATE TABLE "MangaCollaborator" (
    "id" TEXT NOT NULL,
    "mangaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EDITOR',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MangaCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MangaCollaborator_mangaId_idx" ON "MangaCollaborator"("mangaId");

-- CreateIndex
CREATE INDEX "MangaCollaborator_userId_idx" ON "MangaCollaborator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MangaCollaborator_mangaId_userId_key" ON "MangaCollaborator"("mangaId", "userId");

-- AddForeignKey
ALTER TABLE "MangaCollaborator" ADD CONSTRAINT "MangaCollaborator_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "MangaSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MangaCollaborator" ADD CONSTRAINT "MangaCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
