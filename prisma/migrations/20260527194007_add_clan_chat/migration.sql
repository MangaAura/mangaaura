-- AlterTable
ALTER TABLE "ClanMembership" ADD COLUMN     "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "ClanChatMessage" (
    "id" TEXT NOT NULL,
    "clanId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "replyToId" TEXT,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClanChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClanChatMessageReaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClanChatMessageReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClanChatMessage_clanId_idx" ON "ClanChatMessage"("clanId");

-- CreateIndex
CREATE INDEX "ClanChatMessage_senderId_idx" ON "ClanChatMessage"("senderId");

-- CreateIndex
CREATE INDEX "ClanChatMessage_createdAt_idx" ON "ClanChatMessage"("createdAt");

-- CreateIndex
CREATE INDEX "ClanChatMessage_replyToId_idx" ON "ClanChatMessage"("replyToId");

-- CreateIndex
CREATE INDEX "ClanChatMessageReaction_messageId_idx" ON "ClanChatMessageReaction"("messageId");

-- CreateIndex
CREATE INDEX "ClanChatMessageReaction_userId_idx" ON "ClanChatMessageReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClanChatMessageReaction_messageId_userId_emoji_key" ON "ClanChatMessageReaction"("messageId", "userId", "emoji");

-- AddForeignKey
ALTER TABLE "ClanChatMessage" ADD CONSTRAINT "ClanChatMessage_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "Clan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClanChatMessage" ADD CONSTRAINT "ClanChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClanChatMessage" ADD CONSTRAINT "ClanChatMessage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "ClanChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClanChatMessageReaction" ADD CONSTRAINT "ClanChatMessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ClanChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClanChatMessageReaction" ADD CONSTRAINT "ClanChatMessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
