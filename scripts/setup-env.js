#!/usr/bin/env node

/**
 * Script para configurar variables de entorno
 * Uso: node scripts/setup-env.js
 */

/* eslint-disable @typescript-eslint/no-require-imports */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setup() {
  console.log('🚀 Configuración de InkVerse\n');
  console.log('Este script te ayudará a configurar las variables de entorno.\n');

  const env = {};

  // Generar secreto para NextAuth
  const generateSecret = () => crypto.randomBytes(32).toString('base64');

  // Preguntar por el entorno
  const envType = await question('¿Qué entorno estás configurando? (development/production): ');
  const isProduction = envType.toLowerCase() === 'production';

  console.log('\n--- Base de Datos ---\n');
  
  if (!isProduction) {
    const dbChoice = await question('¿Usar SQLite para desarrollo? (s/n): ');
    if (dbChoice.toLowerCase() === 's') {
      env.DATABASE_URL = 'file:./dev.db';
      console.log('✅ SQLite configurado\n');
    } else {
      env.DATABASE_URL = await question('DATABASE_URL (PostgreSQL): ');
    }
  } else {
    env.DATABASE_URL = await question('DATABASE_URL (PostgreSQL): ');
  }

  env.MONGODB_URI = await question('MONGODB_URI (deja vacío para usar en memoria): ');
  if (!env.MONGODB_URI) {
    env.MONGODB_URI = 'mongodb://localhost:27017/inkverse_dev';
  }

  env.REDIS_URL = await question('REDIS_URL (deja vacío para omitir): ');
  if (!env.REDIS_URL) {
    env.REDIS_URL = 'redis://localhost:6379';
  }

  console.log('\n--- Autenticación ---\n');
  
  env.NEXTAUTH_SECRET = generateSecret();
  console.log(`✅ NEXTAUTH_SECRET generado automáticamente`);
  
  env.NEXTAUTH_URL = isProduction 
    ? await question('NEXTAUTH_URL (ej: https://inkverse.app): ')
    : 'http://localhost:3000';

  console.log('\n--- OAuth (Opcional) ---\n');
  
  const useOAuth = await question('¿Configurar OAuth providers? (s/n): ');
  if (useOAuth.toLowerCase() === 's') {
    env.GOOGLE_CLIENT_ID = await question('GOOGLE_CLIENT_ID: ');
    env.GOOGLE_CLIENT_SECRET = await question('GOOGLE_CLIENT_SECRET: ');
    env.GITHUB_CLIENT_ID = await question('GITHUB_CLIENT_ID: ');
    env.GITHUB_CLIENT_SECRET = await question('GITHUB_CLIENT_SECRET: ');
  }

  console.log('\n--- NVIDIA AI (Opcional) ---\n');
  
  env.NVIDIA_API_KEY = await question('NVIDIA_API_KEY (deja vacío para usar modo in-memory): ');
  env.AI_PROVIDER = env.NVIDIA_API_KEY ? 'nvidia' : 'in-memory';
  env.ENABLE_AI_ANALYSIS = 'true';
  env.AI_RATE_LIMIT = '40';

  console.log('\n--- Configuración Adicional ---\n');
  
  env.NODE_ENV = isProduction ? 'production' : 'development';
  env.APP_NAME = 'InkVerse';
  env.APP_URL = env.NEXTAUTH_URL;
  env.CRON_SECRET = generateSecret();

  // Generar archivo .env.local
  const envContent = Object.entries(env)
    .filter(([_, value]) => value)
    .map(([key, value]) => `${key}="${value}"`)
    .join('\n');

  const envPath = path.join(process.cwd(), '.env.local');
  
  // Verificar si existe
  if (fs.existsSync(envPath)) {
    const overwrite = await question('\n⚠️  .env.local ya existe. ¿Sobrescribir? (s/n): ');
    if (overwrite.toLowerCase() !== 's') {
      console.log('\n❌ Cancelado. No se hicieron cambios.\n');
      rl.close();
      return;
    }
  }

  // Escribir archivo
  fs.writeFileSync(envPath, envContent + '\n');

  console.log('\n✅ Archivo .env.local creado exitosamente!\n');
  console.log('Variables configuradas:');
  Object.keys(env).forEach(key => {
    const value = env[key];
    const displayValue = key.includes('SECRET') || key.includes('KEY') 
      ? value.substring(0, 10) + '...'
      : value;
    console.log(`  ${key}=${displayValue}`);
  });

  console.log('\n📝 Próximos pasos:');
  console.log('  1. Verifica las variables en .env.local');
  console.log('  2. Ejecuta: npm run prisma:generate');
  console.log('  3. Ejecuta: npm run prisma:migrate');
  console.log('  4. Inicia el servidor: npm run dev\n');

  rl.close();
}

setup().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
