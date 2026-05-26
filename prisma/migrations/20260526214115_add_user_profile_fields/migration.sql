-- AlterTable
ALTER TABLE "User" ADD COLUMN     "appearance" TEXT NOT NULL DEFAULT '{}',
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "socialLinks" TEXT NOT NULL DEFAULT '{}',
ADD COLUMN     "website" TEXT;
