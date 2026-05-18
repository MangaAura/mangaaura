import { PrismaCollectionRepository } from './PrismaCollectionRepository';
import { initializeCollectionService, collectionService as existingService } from '@/core/services/CollectionService';
import { prisma } from '@/lib/prisma';

export { existingService as collectionService };

export async function initCollectionService(): Promise<void> {
  if (typeof existingService !== 'undefined') return;
  initializeCollectionService(new PrismaCollectionRepository(prisma));
}
