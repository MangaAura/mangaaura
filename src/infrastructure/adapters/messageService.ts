import { PrismaMessageRepository } from './PrismaMessageRepository';
import { initializeMessageService, messageService as existingService } from '@/core/services/MessageService';
import { prisma } from '@/lib/prisma';

export { existingService as messageService };

export async function initMessageService(): Promise<void> {
  if (typeof existingService !== 'undefined') return;
  initializeMessageService(new PrismaMessageRepository(prisma));
}
