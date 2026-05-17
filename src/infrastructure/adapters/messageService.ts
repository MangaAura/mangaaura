import { initializeMessageService, messageService as existingService } from '@/core/services/MessageService';
import { PrismaMessageRepository } from './PrismaMessageRepository';
import { prisma } from '@/lib/prisma';

if (!existingService) {
  initializeMessageService(new PrismaMessageRepository(prisma));
}

export { existingService as messageService };
