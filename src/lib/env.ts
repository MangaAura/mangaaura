import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DATABASE_URL: z.string().min(1),
  MONGODB_URI: z.string().optional().default('mongodb://localhost:27017/inkverse_dev'),
  REDIS_URL: z.string().optional().default('redis://localhost:6379'),

  NEXTAUTH_SECRET: z.string().min(16).optional().default('dev-secret-key-not-for-production-!!'),
  NEXTAUTH_URL: z.string().url().optional().default('http://localhost:3000'),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  NVIDIA_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  CRON_SECRET: z.string().optional(),

  APP_NAME: z.string().default('InkVerse'),
  APP_URL: z.string().url().optional(),

  ENABLE_AI_ANALYSIS: z.string().optional(),
  AI_PROVIDER: z.string().optional(),
  AI_RATE_LIMIT: z.string().optional(),
});

export function validateEnv() {
  if (process.env.__NEXT_PROCESS) return;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues
      .filter(i => i.message.includes('Required'))
      .map(i => i.path.join('.'));

    if (missing.length > 0) {
      console.warn(`Variables de entorno faltantes: ${missing.join(', ')}`);
      if (process.env.NODE_ENV === 'production' && !process.env.__NEXT_PROCESS) {
        console.warn('La aplicación continuará, pero algunas funcionalidades pueden fallar.');
      }
    }
  }
}
