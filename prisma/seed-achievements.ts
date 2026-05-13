/**
 * Seed de logros (achievements) para InkVerse
 * Define los logros iniciales con sus condiciones y recompensas
 * @packageDocumentation
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Tipos de condiciones de logros
 */
export type AchievementCondition =
  | { type: 'CHAPTERS_READ'; count: number }
  | { type: 'COMMENTS_POSTED'; count: number }
  | { type: 'CORRECTIONS_APPROVED'; count: number }
  | { type: 'MANGAS_COMPLETED'; count: number }
  | { type: 'COMMENT_LIKES_RECEIVED'; count: number }
  | { type: 'MANGAS_CREATED'; count: number }
  | { type: 'SPONSORSHIPS_WON'; count: number }
  | { type: 'LEVEL_REACHED'; level: number };

/**
 * Definición de un logro
 */
interface AchievementDefinition {
  badgeId: string;
  name: string;
  description: string;
  xpReward: number;
  iconUrl: string;
  condition: AchievementCondition;
  category: 'READING' | 'SOCIAL' | 'CREATION' | 'MILESTONE';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'LEGENDARY';
}

/**
 * Logros iniciales de InkVerse
 */
export const achievements: AchievementDefinition[] = [
  // Logros de lectura
  {
    badgeId: 'PRIMEROS_PASOS',
    name: 'Primeros Pasos',
    description: 'Lee tu primer capítulo en InkVerse',
    xpReward: 100,
    iconUrl: '/badges/primeros-pasos.svg',
    condition: { type: 'CHAPTERS_READ', count: 1 },
    category: 'READING',
    difficulty: 'EASY',
  },
  {
    badgeId: 'LECTOR_ASIDUO',
    name: 'Lector Asiduo',
    description: 'Lee 10 capítulos',
    xpReward: 500,
    iconUrl: '/badges/lector-asiduo.svg',
    condition: { type: 'CHAPTERS_READ', count: 10 },
    category: 'READING',
    difficulty: 'MEDIUM',
  },
  {
    badgeId: 'MANGA_LOVER',
    name: 'Manga Lover',
    description: 'Completa 5 mangas diferentes',
    xpReward: 1000,
    iconUrl: '/badges/manga-lover.svg',
    condition: { type: 'MANGAS_COMPLETED', count: 5 },
    category: 'READING',
    difficulty: 'HARD',
  },

  // Logros sociales
  {
    badgeId: 'COMENTARISTA',
    name: 'Comentarista',
    description: 'Publica tu primer comentario',
    xpReward: 50,
    iconUrl: '/badges/comentarista.svg',
    condition: { type: 'COMMENTS_POSTED', count: 1 },
    category: 'SOCIAL',
    difficulty: 'EASY',
  },
  {
    badgeId: 'INFLUENCER',
    name: 'Influencer',
    description: 'Recibe 50 likes en tus comentarios',
    xpReward: 300,
    iconUrl: '/badges/influencer.svg',
    condition: { type: 'COMMENT_LIKES_RECEIVED', count: 50 },
    category: 'SOCIAL',
    difficulty: 'MEDIUM',
  },

  // Logros de contribución
  {
    badgeId: 'CORRECTOR',
    name: 'Corrector',
    description: 'Tu corrección de capítulo fue aprobada',
    xpReward: 200,
    iconUrl: '/badges/corrector.svg',
    condition: { type: 'CORRECTIONS_APPROVED', count: 1 },
    category: 'CREATION',
    difficulty: 'MEDIUM',
  },

  // Logros de creación
  {
    badgeId: 'CREADOR NATO',
    name: 'Creador Naton',
    description: 'Crea tu primer manga',
    xpReward: 500,
    iconUrl: '/badges/creador-nato.svg',
    condition: { type: 'MANGAS_CREATED', count: 1 },
    category: 'CREATION',
    difficulty: 'HARD',
  },

  // Logros de patrocinio
  {
    badgeId: 'PATROCINADOR',
    name: 'Patrocinador',
    description: 'Gana una puja de patrocinio',
    xpReward: 200,
    iconUrl: '/badges/patrocinador.svg',
    condition: { type: 'SPONSORSHIPS_WON', count: 1 },
    category: 'CREATION',
    difficulty: 'MEDIUM',
  },

  // Logros de nivel (milestones)
  {
    badgeId: 'MAESTRO_MANGA',
    name: 'Maestro Manga',
    description: 'Alcanza el nivel 10',
    xpReward: 2000,
    iconUrl: '/badges/maestro-manga.svg',
    condition: { type: 'LEVEL_REACHED', level: 10 },
    category: 'MILESTONE',
    difficulty: 'HARD',
  },
  {
    badgeId: 'LEYENDA',
    name: 'Leyenda',
    description: 'Alcanza el nivel 20',
    xpReward: 5000,
    iconUrl: '/badges/leyenda.svg',
    condition: { type: 'LEVEL_REACHED', level: 20 },
    category: 'MILESTONE',
    difficulty: 'LEGENDARY',
  },
];

/**
 * Inserta los logros en la base de datos
 */
async function seedAchievements() {
  console.log('🌱 Sembrando logros...');

  for (const achievement of achievements) {
    await prisma.achievementDefinition.upsert({
      where: { badgeId: achievement.badgeId },
      update: {
        name: achievement.name,
        description: achievement.description,
        xpReward: achievement.xpReward,
        iconUrl: achievement.iconUrl,
        condition: JSON.stringify(achievement.condition),
      },
      create: {
        badgeId: achievement.badgeId,
        name: achievement.name,
        description: achievement.description,
        xpReward: achievement.xpReward,
        iconUrl: achievement.iconUrl,
        condition: JSON.stringify(achievement.condition),
      },
    });
    console.log(`✅ Logro creado: ${achievement.name}`);
  }

  console.log('✨ Seed de logros completado');
}

export { seedAchievements };

// Ejecutar si es llamado directamente (ESM)
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  seedAchievements()
    .catch((e) => {
      console.error('❌ Error sembrando logros:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
