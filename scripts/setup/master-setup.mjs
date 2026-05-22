#!/usr/bin/env node
/**
 * MangaAura - Master Setup Script
 * Automates creation of all service accounts and configuration.
 * 
 * Usage: node scripts/setup/master-setup.mjs
 * 
 * Prerequisites (do these first, takes 5 min):
 *   1. Enable 2FA on the project Gmail account
 *   2. Generate Google App Password at https://myaccount.google.com/apppasswords
 *   3. Create GitHub account at https://github.com/signup
 *   4. Generate GitHub PAT at https://github.com/settings/tokens (scopes: user, repo)
 *
 * Pre-configured (from setup May 22, 2026):
 *   - NVIDIA API Key: configured
 *   - Web Push VAPID: configured
 */

import 'dotenv/config';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const ENV_PATH = path.join(ROOT, '.env.local');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

function log(emoji, msg) {
  console.log(`${emoji} ${msg}`);
}

function warn(msg) {
  console.log(`\n⚠️  ${msg}`);
}

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) return {};
  const content = fs.readFileSync(ENV_PATH, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*"?([^"]*?)"?\s*$/);
    if (match) env[match[1]] = match[2];
  }
  return env;
}

function saveEnv(updates) {
  let env = {};
  if (fs.existsSync(ENV_PATH)) {
    const content = fs.readFileSync(ENV_PATH, 'utf-8');
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*([^#=]+?)\s*=\s*"?([^"]*?)"?\s*$/);
      if (match) env[match[1]] = match[2];
    }
  }
  Object.assign(env, updates);
  const output = Object.entries(env)
    .filter(([k]) => !k.startsWith('#'))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v.includes(' ') || v.includes('#') ? `"${v}"` : v}`)
    .join('\n') + '\n';
  fs.writeFileSync(ENV_PATH, output);
  log('💾', `.env.local actualizado`);
}

function smtpUser() {
  const env = loadEnv();
  return env.SMTP_USER || process.env.SMTP_USER || 'MangaAura.es@gmail.com';
}

async function testSmtp(host, port, user, pass) {
  const script = path.join(os.tmpdir(), `smtp-test-${Date.now()}.mjs`);
  fs.writeFileSync(script, `
import nodemailer from 'nodemailer';
const t = nodemailer.createTransport({
  host: '${host}', port: ${port}, secure: false,
  auth: { user: '${user}', pass: process.env.SMTP_PASSWORD }
});
t.verify().then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); });
`);
  try {
    execSync(`node "${script}"`, { stdio: 'pipe', timeout: 15000, env: { ...process.env, SMTP_PASSWORD: pass } });
  } finally {
    try { fs.unlinkSync(script); } catch {}
  }
}

async function checkPrerequisites() {
  log('\n🔍', '=== Verificando Prerrequisitos ===\n');

  const env = loadEnv();

  const appPassword = await ask('1. Pasame el App Password de Gmail (16 letras, ej: abcd efgh ijkl mnop): ');
  if (appPassword.length < 10) {
    warn('App Password muy corto. Genéralo en: https://myaccount.google.com/apppasswords');
    log('📖', 'Pasos: Activar 2FA → App Passwords → Seleccionar "Correo" → Generar');
    return false;
  }
  const user = smtpUser();
  saveEnv({ SMTP_PASSWORD: appPassword, SMTP_HOST: 'smtp.gmail.com', SMTP_PORT: '587', SMTP_USER: user });

  log('📧', 'Probando SMTP...');
  try {
    await testSmtp('smtp.gmail.com', 587, user, appPassword);
    log('✅', 'SMTP Gmail funciona');
  } catch {
    warn('SMTP no funciona. Verifica el App Password.');
    return false;
  }

  const githubToken = await ask('\n2. Pasame tu GitHub Personal Access Token: ');
  if (githubToken.length < 20) {
    warn('Token inválido. Crea uno en: https://github.com/settings/tokens');
    log('📖', 'Scopes necesarios: user, repo, admin:oauth_app');
    return false;
  }

  let githubUser;
  try {
    const res = await fetch('https://api.github.com/user', { headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github.v3+json' } });
    const data = await res.json();
    if (!data.login) throw new Error('Invalid token');
    githubUser = data.login;
    log('✅', `GitHub: @${githubUser}`);
    saveEnv({ GITHUB_TOKEN: githubToken });
  } catch {
    warn('Token de GitHub no válido');
    return false;
  }

  return { appPassword, githubToken, githubUser };
}

async function createGitHubOAuthApp(githubToken, githubUser) {
  log('\n🐙', '=== Creando GitHub OAuth App ===\n');

  const callbackUrl = await ask('Callback URL (dev): ') || 'http://localhost:3000/api/auth/callback/github';

  try {
    const res = await fetch('https://api.github.com/applications', {
      method: 'POST',
      headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'MangaAura',
        url: 'https://mangaaura.es',
        callback_url: callbackUrl,
        description: 'Manga platform authentication',
        public: true,
      }),
    });
    const app = await res.json();
    if (app.client_id) {
      log('✅', `GitHub OAuth App creada: ${app.client_id}`);
      saveEnv({ GITHUB_CLIENT_ID: app.client_id, GITHUB_CLIENT_SECRET: app.client_secret });
      return app;
    }
  } catch (e) {
    warn(`Error creando GitHub OAuth App: ${e.message}`);
  }
  return null;
}

async function createResendAccount() {
  log('\n✉️', '=== Configurando Resend ===\n');
  
  warn('Resend requiere registro manual en https://resend.com');
  log('📋', 'Verifica el email y agrega el dominio MangaAura.es');
  
  const apiKey = await ask('\nUna vez registrado, pega tu RESEND_API_KEY: ');
  if (apiKey && apiKey.startsWith('re_')) {
    saveEnv({ RESEND_API_KEY: apiKey });
    log('✅', 'Resend configurado');
    return true;
  }
  return false;
}

async function createUpstashRedis() {
  log('\n🔴', '=== Configurando Upstash Redis ===\n');
  warn('Upstash requiere registro manual en https://console.upstash.com');
  log('📋', '1. Regístrate con GitHub');
  log('📋', '2. Crea un Redis database (free tier)');
  
  const redisUrl = await ask('Pega tu REDIS_URL de Upstash: ');
  if (redisUrl && redisUrl.startsWith('rediss://')) {
    saveEnv({ REDIS_URL: redisUrl });
    log('✅', 'Upstash Redis configurado');
    return true;
  }
  return false;
}

async function setupVercel() {
  log('\n▲', '=== Configurando Vercel ===\n');
  warn('Vercel requiere registro manual en https://vercel.com con GitHub');
  
  log('📋', 'Pasos:');
  log('  1. Ve a https://vercel.com/login → "Continue with GitHub"');
  log('  2. Importa el repositorio');
  log('  3. En Project Settings → Environment Variables, agrega:');
  
  const env = loadEnv();
  const vercelVars = [
    'DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL',
    'NVIDIA_API_KEY', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET',
    'RESEND_API_KEY', 'REDIS_URL', 'BLOB_READ_WRITE_TOKEN',
    'CRON_SECRET',
  ];
  for (const v of vercelVars) {
    if (env[v]) log(`     ${v}=${env[v].substring(0, 12)}...`);
  }

  const vercelToken = await ask('\n¿Tienes Vercel Token? (opcional, para deploy CLI): ');
  if (vercelToken) {
    saveEnv({ VERCEL_TOKEN: vercelToken });
    log('✅', 'Vercel token guardado');
  }
}

async function setupSentry() {
  log('\n📊', '=== Configurando Sentry ===\n');
  warn('Sentry requiere registro manual en https://sentry.io/signup/');
  
  const dsn = await ask('Pega tu SENTRY_DSN (o Enter para saltar): ');
  if (dsn && dsn.includes('@')) {
    saveEnv({ SENTRY_DSN: dsn });
    log('✅', 'Sentry configurado');
  }
}

async function main() {
  console.log(`
╔══════════════════════════════════════════╗
║       🚀 MangaAura - Master Setup         ║
║                                          ║
║  Prepárate: necesito 2 cosas de ti:      ║
║  1. App Password de Gmail (3 min)        ║
║  2. GitHub Token (2 min)                 ║
║                                          ║
║  Con eso yo hago el resto automaticamente ║
╚══════════════════════════════════════════╝
  `);

  const prereqs = await checkPrerequisites();
  if (!prereqs) {
    warn('Setup pausado. Cuando tengas los requisitos, ejecuta de nuevo:');
    log('▶️', 'node scripts/setup/master-setup.mjs\n');
    rl.close();
    return;
  }

  const { githubToken, githubUser } = prereqs;

  // 1. Create GitHub OAuth App
  await createGitHubOAuthApp(githubToken, githubUser);

  // 2. Resend
  await createResendAccount();

  // 3. Upstash Redis
  await createUpstashRedis();

  // 4. Vercel
  await setupVercel();

  // 5. Sentry
  await setupSentry();

  // Generate production env template
  log('\n📝', '=== Resumen Final ===\n');
  const env = loadEnv();
  console.log('Variables configuradas:');
  for (const [k, v] of Object.entries(env)) {
    if (['SMTP_PASSWORD', 'GITHUB_TOKEN', 'NEXTAUTH_SECRET'].includes(k)) continue;
    console.log(`  ${k}=${v}`);
  }

  log('\n✅', 'Setup completado!\n');
  log('▶️', 'Para iniciar: npm run dev');
  log('📖', 'Una vez compres MangaAura.es, configura el DNS y cambia NEXTAUTH_URL');
  
  rl.close();
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
