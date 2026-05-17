/**
 * Seed de logros (achievements) para InkVerse
 * Define los logros iniciales con sus condiciones y recompensas
 * @packageDocumentation
 */

import { PrismaClient } from '@prisma/client';
import type { AchievementCondition } from '@/core/services/IAchievementRepository';

const prisma = new PrismaClient();

export type { AchievementCondition };

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

  // Logros de misiones
  {
    badgeId: 'MISIONERO_PRINCIPIANTE',
    name: 'Misionero Principiante',
    description: 'Completa 5 misiones',
    xpReward: 100,
    iconUrl: '/badges/misionero-principiante.svg',
    condition: { type: 'QUESTS_COMPLETED', count: 5 },
    category: 'READING',
    difficulty: 'EASY',
  },
  {
    badgeId: 'MISIONERO_DEDICADO',
    name: 'Misionero Dedicado',
    description: 'Completa 25 misiones',
    xpReward: 300,
    iconUrl: '/badges/misionero-dedicado.svg',
    condition: { type: 'QUESTS_COMPLETED', count: 25 },
    category: 'READING',
    difficulty: 'MEDIUM',
  },
  {
    badgeId: 'MISIONERO_MAESTRO',
    name: 'Misionero Maestro',
    description: 'Completa 100 misiones',
    xpReward: 1000,
    iconUrl: '/badges/misionero-maestro.svg',
    condition: { type: 'QUESTS_COMPLETED', count: 100 },
    category: 'READING',
    difficulty: 'HARD',
  },
  {
    badgeId: 'MISIONERO_LEYENDA',
    name: 'Misionero Leyenda',
    description: 'Completa 500 misiones',
    xpReward: 3000,
    iconUrl: '/badges/misionero-leyenda.svg',
    condition: { type: 'QUESTS_COMPLETED', count: 500 },
    category: 'READING',
    difficulty: 'LEGENDARY',
  },

  // Logros de racha (streak)
  {
    badgeId: 'RACHA_3',
    name: 'Racha de 3 Días',
    description: 'Lee manga durante 3 días seguidos',
    xpReward: 20,
    iconUrl: '/badges/racha-3.svg',
    condition: { type: 'STREAK_REACHED', days: 3 },
    category: 'READING',
    difficulty: 'EASY',
  },
  {
    badgeId: 'RACHA_7',
    name: 'Racha de Fuego',
    description: 'Lee manga durante 7 días seguidos',
    xpReward: 50,
    iconUrl: '/badges/racha-7.svg',
    condition: { type: 'STREAK_REACHED', days: 7 },
    category: 'READING',
    difficulty: 'EASY',
  },
  {
    badgeId: 'RACHA_14',
    name: 'Dos Semanas Seguidas',
    description: 'Lee manga durante 14 días seguidos',
    xpReward: 100,
    iconUrl: '/badges/racha-14.svg',
    condition: { type: 'STREAK_REACHED', days: 14 },
    category: 'READING',
    difficulty: 'MEDIUM',
  },
  {
    badgeId: 'RACHA_30',
    name: 'Lector Dedicado',
    description: 'Mantén una racha de lectura por 30 días',
    xpReward: 200,
    iconUrl: '/badges/racha-30.svg',
    condition: { type: 'STREAK_REACHED', days: 30 },
    category: 'READING',
    difficulty: 'MEDIUM',
  },
  {
    badgeId: 'RACHA_60',
    name: 'Compromiso de Hierro',
    description: 'Mantén una racha de lectura por 60 días',
    xpReward: 300,
    iconUrl: '/badges/racha-60.svg',
    condition: { type: 'STREAK_REACHED', days: 60 },
    category: 'READING',
    difficulty: 'HARD',
  },
  {
    badgeId: 'RACHA_100',
    name: 'Centenario',
    description: 'Mantén una racha de lectura por 100 días',
    xpReward: 500,
    iconUrl: '/badges/racha-100.svg',
    condition: { type: 'STREAK_REACHED', days: 100 },
    category: 'READING',
    difficulty: 'HARD',
  },
  {
    badgeId: 'RACHA_180',
    name: 'Medio Año de Manga',
    description: 'Mantén una racha de lectura por 180 días',
    xpReward: 750,
    iconUrl: '/badges/racha-180.svg',
    condition: { type: 'STREAK_REACHED', days: 180 },
    category: 'READING',
    difficulty: 'HARD',
  },
  {
    badgeId: 'RACHA_365',
    name: 'Año Manga',
    description: 'Mantén una racha de lectura por 365 días',
    xpReward: 2000,
    iconUrl: '/badges/racha-365.svg',
    condition: { type: 'STREAK_REACHED', days: 365 },
    category: 'READING',
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
