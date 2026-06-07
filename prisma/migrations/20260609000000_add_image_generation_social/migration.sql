-- CreateTable
CREATE TABLE "ImageGenerationLike" (
    "id" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageGenerationLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageGenerationComment" (
    "id" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageGenerationComment_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ImageGeneration" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "likeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "commentCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "ImageGenerationLike_imageId_userId_key" ON "ImageGenerationLike"("imageId", "userId");

-- CreateIndex
CREATE INDEX "ImageGenerationLike_imageId_idx" ON "ImageGenerationLike"("imageId");

-- CreateIndex
CREATE INDEX "ImageGenerationLike_userId_idx" ON "ImageGenerationLike"("userId");

-- CreateIndex
CREATE INDEX "ImageGenerationComment_imageId_idx" ON "ImageGenerationComment"("imageId");

-- CreateIndex
CREATE INDEX "ImageGenerationComment_userId_idx" ON "ImageGenerationComment"("userId");

-- CreateIndex
CREATE INDEX "ImageGenerationComment_parentId_idx" ON "ImageGenerationComment"("parentId");

-- CreateIndex
CREATE INDEX "ImageGenerationComment_createdAt_idx" ON "ImageGenerationComment"("createdAt");

-- CreateIndex
CREATE INDEX "ImageGeneration_isPublic_idx" ON "ImageGeneration"("isPublic");

-- AddForeignKey
ALTER TABLE "ImageGenerationLike" ADD CONSTRAINT "ImageGenerationLike_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "ImageGeneration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageGenerationLike" ADD CONSTRAINT "ImageGenerationLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageGenerationComment" ADD CONSTRAINT "ImageGenerationComment_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "ImageGeneration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageGenerationComment" ADD CONSTRAINT "ImageGenerationComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageGenerationComment" ADD CONSTRAINT "ImageGenerationComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ImageGenerationComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
