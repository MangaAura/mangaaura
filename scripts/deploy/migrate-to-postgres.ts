#!/usr/bin/env tsx
/**
 * Migration script from SQLite to PostgreSQL
 * Run: npx tsx scripts/deploy/migrate-to-postgres.ts
 */

import { PrismaClient as PrismaSQLite } from '@prisma/client';
import { PrismaClient as PrismaPostgres } from '@prisma/client';
import { execSync } from 'child_process';

const sqlitePrisma = new PrismaSQLite({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db',
    },
  },
});

const postgresPrisma = new PrismaPostgres();

async function migrateUsers() {
  console.log('Migrating users...');
  const users = await sqlitePrisma.user.findMany();
  
  for (const user of users) {
    await postgresPrisma.user.create({
      data: {
        ...user,
        id: user.id,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        pushSubscription: user.pushSubscription || null,
      },
    });
  }
  console.log(`✅ Migrated ${users.length} users`);
}

async function migrateMangas() {
  console.log('Migrating mangas...');
  const mangas = await sqlitePrisma.mangaSeries.findMany();
  
  for (const manga of mangas) {
    await postgresPrisma.mangaSeries.create({
      data: {
        ...manga,
        rating: manga.rating ? Number(manga.rating) : null,
        createdAt: manga.createdAt,
        updatedAt: manga.updatedAt,
      },
    });
  }
  console.log(`✅ Migrated ${mangas.length} mangas`);
}

async function migrateChapters() {
  console.log('Migrating chapters...');
  const chapters = await sqlitePrisma.chapter.findMany();
  
  for (const chapter of chapters) {
    await postgresPrisma.chapter.create({
      data: {
        ...chapter,
        createdAt: chapter.createdAt,
      },
    });
  }
  console.log(`✅ Migrated ${chapters.length} chapters`);
}

async function migrateUserLibrary() {
  console.log('Migrating user library...');
  const entries = await sqlitePrisma.userLibrary.findMany();
  
  for (const entry of entries) {
    await postgresPrisma.userLibrary.create({
      data: {
        ...entry,
        addedAt: entry.addedAt,
        updatedAt: entry.updatedAt,
      },
    });
  }
  console.log(`✅ Migrated ${entries.length} library entries`);
}

async function migrateReadingProgress() {
  console.log('Migrating reading progress...');
  const progress = await sqlitePrisma.readingProgress.findMany();
  
  for (const p of progress) {
    await postgresPrisma.readingProgress.create({
      data: {
        ...p,
        completedAt: p.completedAt,
        lastReadAt: p.lastReadAt,
      },
    });
  }
  console.log(`✅ Migrated ${progress.length} reading progress entries`);
}

async function migrateComments() {
  console.log('Migrating comments...');
  const comments = await sqlitePrisma.comment.findMany();
  
  for (const comment of comments) {
    await postgresPrisma.comment.create({
      data: {
        ...comment,
        createdAt: comment.createdAt,
      },
    });
  }
  console.log(`✅ Migrated ${comments.length} comments`);
}

async function migrateAchievements() {
  console.log('Migrating achievements...');
  const achievements = await sqlitePrisma.achievementDefinition.findMany();
  
  for (const achievement of achievements) {
    await postgresPrisma.achievementDefinition.create({
      data: {
        ...achievement,
        createdAt: achievement.createdAt,
      },
    });
  }
  console.log(`✅ Migrated ${achievements.length} achievements`);
}

async function migrateUserAchievements() {
  console.log('Migrating user achievements...');
  const userAchievements = await sqlitePrisma.userAchievement.findMany();
  
  for (const ua of userAchievements) {
    await postgresPrisma.userAchievement.create({
      data: {
        ...ua,
        unlockedAt: ua.unlockedAt,
      },
    });
  }
  console.log(`✅ Migrated ${userAchievements.length} user achievements`);
}

async function migrateNotifications() {
  console.log('Migrating notifications...');
  const notifications = await sqlitePrisma.notification.findMany();
  
  for (const notification of notifications) {
    await postgresPrisma.notification.create({
      data: {
        ...notification,
        createdAt: notification.createdAt,
      },
    });
  }
  console.log(`✅ Migrated ${notifications.length} notifications`);
}

async function migrateTransactions() {
  console.log('Migrating transactions...');
  const transactions = await sqlitePrisma.transaction.findMany();
  
  for (const transaction of transactions) {
    await postgresPrisma.transaction.create({
      data: {
        ...transaction,
        createdAt: transaction.createdAt,
      },
    });
  }
  console.log(`✅ Migrated ${transactions.length} transactions`);
}

async function migrateClans() {
  console.log('Migrating clans...');
  const clans = await sqlitePrisma.clan.findMany();
  
  for (const clan of clans) {
    await postgresPrisma.clan.create({
      data: {
        ...clan,
        createdAt: clan.createdAt,
        updatedAt: clan.updatedAt,
      },
    });
  }
  console.log(`✅ Migrated ${clans.length} clans`);
}

async function migrateClanMemberships() {
  console.log('Migrating clan memberships...');
  const memberships = await sqlitePrisma.clanMembership.findMany();
  
  for (const membership of memberships) {
    await postgresPrisma.clanMembership.create({
      data: {
        ...membership,
        joinedAt: membership.joinedAt,
      },
    });
  }
  console.log(`✅ Migrated ${memberships.length} clan memberships`);
}

async function main() {
  console.log('🚀 Starting migration from SQLite to PostgreSQL...\n');
  
  try {
    // Migration order matters due to foreign keys
    await migrateUsers();
    await migrateMangas();
    await migrateChapters();
    await migrateUserLibrary();
    await migrateReadingProgress();
    await migrateComments();
    await migrateAchievements();
    await migrateUserAchievements();
    await migrateNotifications();
    await migrateTransactions();
    await migrateClans();
    await migrateClanMemberships();
    
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sqlitePrisma.$disconnect();
    await postgresPrisma.$disconnect();
  }
}

main();
