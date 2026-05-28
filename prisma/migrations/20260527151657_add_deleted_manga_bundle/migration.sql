-- CreateTable
CREATE TABLE "DeletedMangaBundle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "coverUrl" TEXT,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ONGOING',
    "tags" TEXT NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION,
    "data" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeletedMangaBundle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeletedMangaBundle_authorId_idx" ON "DeletedMangaBundle"("authorId");

-- CreateIndex
CREATE INDEX "DeletedMangaBundle_expiresAt_idx" ON "DeletedMangaBundle"("expiresAt");
