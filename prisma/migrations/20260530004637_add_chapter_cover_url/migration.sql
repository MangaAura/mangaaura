-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN     "coverUrl" TEXT;

-- CreateTable
CREATE TABLE "ClanJoinRequest" (
    "id" TEXT NOT NULL,
    "clanId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "message" VARCHAR(500),
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClanJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClanAnnouncement" (
    "id" TEXT NOT NULL,
    "clanId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" VARCHAR(1000) NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClanAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClanInvite" (
    "id" TEXT NOT NULL,
    "clanId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "ClanInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClanJoinRequest_clanId_status_idx" ON "ClanJoinRequest"("clanId", "status");

-- CreateIndex
CREATE INDEX "ClanJoinRequest_userId_status_idx" ON "ClanJoinRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "ClanJoinRequest_createdAt_idx" ON "ClanJoinRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClanJoinRequest_clanId_userId_status_key" ON "ClanJoinRequest"("clanId", "userId", "status");

-- CreateIndex
CREATE INDEX "ClanAnnouncement_clanId_pinned_idx" ON "ClanAnnouncement"("clanId", "pinned");

-- CreateIndex
CREATE INDEX "ClanAnnouncement_createdAt_idx" ON "ClanAnnouncement"("createdAt");

-- CreateIndex
CREATE INDEX "ClanInvite_inviteeId_status_idx" ON "ClanInvite"("inviteeId", "status");

-- CreateIndex
CREATE INDEX "ClanInvite_clanId_status_idx" ON "ClanInvite"("clanId", "status");

-- CreateIndex
CREATE INDEX "ClanInvite_createdAt_idx" ON "ClanInvite"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClanInvite_clanId_inviteeId_status_key" ON "ClanInvite"("clanId", "inviteeId", "status");

-- AddForeignKey
ALTER TABLE "ClanJoinRequest" ADD CONSTRAINT "ClanJoinRequest_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "Clan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClanJoinRequest" ADD CONSTRAINT "ClanJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClanJoinRequest" ADD CONSTRAINT "ClanJoinRequest_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClanAnnouncement" ADD CONSTRAINT "ClanAnnouncement_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "Clan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClanAnnouncement" ADD CONSTRAINT "ClanAnnouncement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClanInvite" ADD CONSTRAINT "ClanInvite_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "Clan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClanInvite" ADD CONSTRAINT "ClanInvite_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClanInvite" ADD CONSTRAINT "ClanInvite_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
