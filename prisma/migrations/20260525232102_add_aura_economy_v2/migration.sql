/*
  Warnings:

  - A unique constraint covering the columns `[referralCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "auraFirstPurchaseAt" TIMESTAMP(3),
ADD COLUMN     "auraLifetimePurchased" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "auraLifetimeTransferred" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "auraLifetimeWithdrawn" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "kycStatus" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN     "kycVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "referralCode" TEXT,
ADD COLUMN     "referredBy" TEXT,
ADD COLUMN     "transferLockUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AuraTransfer" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "burnedAmount" INTEGER NOT NULL,
    "netAmount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuraTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralClaim" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "refereeId" TEXT NOT NULL,
    "purchaseAmount" INTEGER NOT NULL DEFAULT 0,
    "bonusAwarded" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'locked',
    "unlockedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeEvent" (
    "stripeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("stripeId")
);

-- CreateIndex
CREATE INDEX "AuraTransfer_fromUserId_idx" ON "AuraTransfer"("fromUserId");

-- CreateIndex
CREATE INDEX "AuraTransfer_toUserId_idx" ON "AuraTransfer"("toUserId");

-- CreateIndex
CREATE INDEX "AuraTransfer_createdAt_idx" ON "AuraTransfer"("createdAt");

-- CreateIndex
CREATE INDEX "ReferralClaim_referrerId_idx" ON "ReferralClaim"("referrerId");

-- CreateIndex
CREATE INDEX "ReferralClaim_refereeId_idx" ON "ReferralClaim"("refereeId");

-- CreateIndex
CREATE INDEX "ReferralClaim_status_idx" ON "ReferralClaim"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralClaim_referrerId_refereeId_key" ON "ReferralClaim"("referrerId", "refereeId");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- AddForeignKey
ALTER TABLE "AuraTransfer" ADD CONSTRAINT "AuraTransfer_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuraTransfer" ADD CONSTRAINT "AuraTransfer_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralClaim" ADD CONSTRAINT "ReferralClaim_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralClaim" ADD CONSTRAINT "ReferralClaim_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
