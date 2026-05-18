import { initializeCollectionService, collectionService as existingService } from '@/core/services/CollectionService';
import { PrismaCollectionRepository } from './PrismaCollectionRepository';
import { prisma } from '@/lib/prisma';

if (!existingService) {
  initializeCollectionService(new PrismaCollectionRepository(prisma));
}

export { existingService as collectionService };
