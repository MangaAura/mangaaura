#!/usr/bin/env node
/**
 * Setup script for production deployment
 * Run: node scripts/deploy/setup-production.js
 */

/* eslint-disable @typescript-eslint/no-require-imports */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

console.log('🚀 MangaAura Production Setup\n');

// Generate secure random strings
function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Check if .env.production exists
const envPath = path.join(process.cwd(), '.env.production');
const envLocalPath = path.join(process.cwd(), '.env.local');

if (fs.existsSync(envPath)) {
  console.log('⚠️  .env.production already exists. Skipping creation.');
} else {
  // Generate production environment variables
  const envContent = `# Production Environment Variables for MangaAura
# Generated: ${new Date().toISOString()}

# ============================================================================
# Required Variables
# ============================================================================

# Database (PostgreSQL required for production)
# Format: postgresql://user:password@host:port/database?schema=public
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/inkverse?schema=public"
# For connection pooling with PgBouncer
DIRECT_DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/inkverse?schema=public"

# Authentication
NEXTAUTH_SECRET="${generateSecret(32)}"
NEXTAUTH_URL="https://your-domain.com"

# OAuth Providers (optional but recommended)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# ============================================================================
# Optional but Recommended Variables
# ============================================================================

# Email Service (Resend recommended)
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@your-domain.com"
EMAIL_FROM_NAME="MangaAura"

# SMTP Alternative (if not using Resend)
# SMTP_HOST="smtp.gmail.com"
# SMTP_PORT="587"
# SMTP_USER="your-email@gmail.com"
# SMTP_PASSWORD="your-app-password"

# Redis (for caching and sessions)
# REDIS_URL="redis://localhost:6379"
# UPSTASH_REDIS_REST_URL=""
# UPSTASH_REDIS_REST_TOKEN=""

# Stripe (for payments)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Push Notifications (Web Push)
# VAPID_PUBLIC_KEY=""
# VAPID_PRIVATE_KEY=""

# Blob Storage (Vercel Blob or similar)
# BLOB_READ_WRITE_TOKEN=""

# AI Service (optional)
# NVIDIA_API_KEY=""
# OPENAI_API_KEY=""

# Sentry (error tracking)
# SENTRY_DSN=""
# SENTRY_AUTH_TOKEN=""

# ============================================================================
# Performance & Security
# ============================================================================

# Rate limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

# Image optimization
NEXT_PUBLIC_IMAGE_DOMAIN="your-cdn.com"

# Logging
LOG_LEVEL="info"
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.production template\n');
}

// Create production check script
const checkScript = `#!/bin/bash
# Production deployment check script

echo "🔍 Checking production readiness..."

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "18" ]; then
  echo "❌ Node.js 18+ required"
  exit 1
fi
echo "✅ Node.js version: $(node -v)"

# Check environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set"
  exit 1
fi
echo "✅ DATABASE_URL set"

if [ -z "$NEXTAUTH_SECRET" ]; then
  echo "❌ NEXTAUTH_SECRET not set"
  exit 1
fi
echo "✅ NEXTAUTH_SECRET set"

if [ -z "$NEXTAUTH_URL" ]; then
  echo "❌ NEXTAUTH_URL not set"
  exit 1
fi
echo "✅ NEXTAUTH_URL set"

# Check if DATABASE_URL is PostgreSQL
if [[ ! "$DATABASE_URL" == *"postgresql"* ]]; then
  echo "⚠️  DATABASE_URL should be PostgreSQL for production"
fi

echo ""
echo "✅ All checks passed! Ready for deployment."
`;

const checkScriptPath = path.join(process.cwd(), 'scripts', 'deploy', 'check-production.sh');
fs.writeFileSync(checkScriptPath, checkScript);
fs.chmodSync(checkScriptPath, '755');
console.log('✅ Created check-production.sh\n');

// Create database migration script
const migrateScript = `#!/bin/bash
# Database migration script for production

echo "🔄 Running database migrations..."

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Deploy migrations
npx prisma migrate deploy

# Verify connection
npx prisma db pull --print > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Database migrations completed successfully"
else
  echo "❌ Database connection failed"
  exit 1
fi
`;

const migrateScriptPath = path.join(process.cwd(), 'scripts', 'deploy', 'migrate.sh');
fs.writeFileSync(migrateScriptPath, migrateScript);
fs.chmodSync(migrateScriptPath, '755');
console.log('✅ Created migrate.sh\n');

// Summary
console.log('📦 Production Setup Complete!\n');
console.log('Next steps:');
console.log('  1. Edit .env.production with your actual values');
console.log('  2. Set up PostgreSQL database');
console.log('  3. Run: npm run build');
console.log('  4. Deploy to Vercel/Railway/etc\n');
console.log('See docs/deployment/VERCEL.md for detailed instructions.');
