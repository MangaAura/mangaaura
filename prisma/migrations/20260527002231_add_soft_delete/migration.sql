-- AlterTable
ALTER TABLE "MangaSeries" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "restoredAt" TIMESTAMP(3);
