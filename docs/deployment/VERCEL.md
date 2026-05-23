# Deploy MangaAura to Vercel

## Prerequisites

- Node.js 18+ and npm
- GitHub account
- Vercel account (free tier works)
- PostgreSQL database (Supabase, Railway, or Vercel Postgres)
- (Optional) Redis instance (Upstash Redis)
- (Optional) Stripe account for payments
- (Optional) Resend account for emails

## Step 1: Prepare Your Repository

```bash
# Make sure your code is committed
git add .
git commit -m "Ready for production"

# Push to GitHub
git push origin main
```

## Step 2: Create PostgreSQL Database

### Option A: Supabase (Recommended)

1. Go to [supabase.com](https://supabase.com) and create a project
2. Go to Database → Connection String → URI
3. Copy the connection string
4. Format: `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`

### Option B: Railway

1. Go to [railway.app](https://railway.app)
2. Create a new project → Add PostgreSQL
3. Copy the DATABASE_URL from Variables

### Option C: Vercel Postgres

1. In Vercel dashboard → Storage → Create Database → Postgres
2. Follow the connection instructions

## Step 3: Set Up Redis (Optional but Recommended)

1. Go to [upstash.com](https://upstash.com)
2. Create a Redis database
3. Copy the REST URL and token

## Step 4: Configure Stripe (Optional)

1. Create account at [stripe.com](https://stripe.com)
2. Get your API keys from Developers → API Keys
3. Create webhook endpoint for `checkout.session.completed`
4. Copy the webhook signing secret

## Step 5: Configure Email (Optional)

1. Create account at [resend.com](https://resend.com)
2. Verify your domain
3. Create an API key

## Step 6: Deploy to Vercel

### Method A: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Method B: GitHub Integration (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the following:

**Build Settings:**
- Framework Preset: Next.js
- Build Command: `prisma generate && next build`
- Output Directory: `.next`
- Install Command: `npm install`

**Environment Variables:**

Add all these variables:

```
# Required
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-random-secret
NEXTAUTH_URL=https://your-domain.vercel.app

# Optional - OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Optional - Email
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@your-domain.com

# Optional - Redis
REDIS_URL=redis://... (or Upstash URL)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Optional - Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_...

# Optional - Error Tracking
SENTRY_DSN=https://...sentry.io/...

# Optional - Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_token
```

5. Click "Deploy"

## Step 7: Run Database Migrations

After first deploy, run migrations:

```bash
# Using Vercel CLI
vercel env pull .env.production
npx prisma migrate deploy
```

Or connect to your database directly and run:

```bash
DATABASE_URL="your-production-db-url" npx prisma migrate deploy
```

## Step 8: Configure Webhooks

### Stripe Webhook

1. In Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

## Step 9: Verify Deployment

Check these endpoints:

- `https://your-domain.vercel.app` - Homepage
- `https://your-domain.vercel.app/api/health` - Health check
- `https://your-domain.vercel.app/manifest.json` - PWA manifest

## Step 10: Configure Custom Domain (Optional)

1. In Vercel Dashboard → Project Settings → Domains
2. Add your custom domain
3. Update `NEXTAUTH_URL` environment variable
4. Redeploy

## Troubleshooting

### Build Fails

```bash
# Check locally first
npm run build

# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

### Database Connection Issues

1. Verify `DATABASE_URL` format
2. Check if IP is allowed (Supabase: Database → Connection Pooling)
3. Test connection locally:
   ```bash
   npx prisma db pull
   ```

### Stripe Webhook Errors

1. Verify `STRIPE_WEBHOOK_SECRET` is correct
2. Check webhook endpoint URL is correct
3. Look at Stripe Dashboard → Webhooks → Attempts for errors

### 500 Errors

1. Check Vercel Functions logs
2. Enable Sentry for error tracking
3. Check environment variables are set

## Performance Optimization

### Enable Vercel Analytics

1. In Vercel Dashboard → Analytics → Enable
2. Add to `next.config.ts`:
   ```ts
   analytics: {
     vercelAnalytics: true,
   }
   ```

### Enable Speed Insights

1. Vercel Dashboard → Speed Insights → Enable

### Configure Edge Functions

For API routes that don't need Node.js runtime, use Edge:

```ts
export const runtime = 'edge';
```

### Enable Image Optimization

Already configured in `next.config.ts`. Ensure `images.remotePatterns` includes your image domains.

## Security Checklist

- [ ] `NEXTAUTH_SECRET` is a random 32+ character string
- [ ] `DATABASE_URL` uses SSL (has `sslmode=verify-full`)
- [ ] Stripe webhook secret is set
- [ ] No `.env` files committed to git
- [ ] `NODE_ENV` is set to `production`
- [ ] Rate limiting is configured
- [ ] CORS is properly configured

## Monitoring

### Vercel Dashboard
- Functions: Check for errors
- Analytics: View traffic
- Speed Insights: Performance metrics

### Sentry (if configured)
- Error tracking
- Performance monitoring
- Session replay

### Database
- Supabase Dashboard: Query performance
- Enable pg_stat_statements for slow query analysis

## Updates & Maintenance

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update packages
npm update

# Test locally
npm run build
npm run test

# Deploy
vercel --prod
```

### Database Backups

- Supabase: Automatic daily backups
- Railway: Enable backups in dashboard

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- MangaAura Issues: GitHub Issues
