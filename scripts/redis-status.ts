/**
 * redis-status.ts
 *
 * Verifica el estado de la conexión a Redis (Upstash / ioredis / MockRedis).
 *
 * Uso: npm run redis:status
 *      npx tsx scripts/redis-status.ts
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';

// ─── Cargar .env.local manualmente ──────────────────────────────────────
// tsx no parsea .env automáticamente, así que cargamos las variables
// de UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN desde .env.local
const envFiles = ['.env.local', '.env'];
const projectRoot = resolve(__dirname, '..');

for (const file of envFiles) {
  const path = join(projectRoot, file);
  if (existsSync(path)) {
    const content = readFileSync(path, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

// ─── Colores ANSI ───────────────────────────────────────────────────────
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';
const RESET = '\x1b[0m';

function icon(value: boolean | string): string {
  if (value === true || value === 'connected') return `${GREEN}✅${RESET}`;
  if (value === 'mock') return `${YELLOW}🟡${RESET}`;
  if (value === 'quota_exceeded') return `${RED}⛔${RESET}`;
  return `${RED}❌${RESET}`;
}

// ─── Main ───────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${BOLD}${CYAN}═══════════════════════════════════════${RESET}`);
  console.log(`${BOLD}${CYAN}   🔍 Redis Connection Status Check    ${RESET}`);
  console.log(`${BOLD}${CYAN}═══════════════════════════════════════${RESET}\n`);

  // Mostrar qué variables de entorno se encontraron
  const hasUpstashUrl = !!process.env.UPSTASH_REDIS_REST_URL;
  const hasUpstashToken = !!process.env.UPSTASH_REDIS_REST_TOKEN;
  const hasRedisUrl = !!process.env.REDIS_URL;

  console.log(`  ${BOLD}Environment:${RESET}`);
  console.log(`    UPSTASH_REDIS_REST_URL  ${icon(hasUpstashUrl)}  ${hasUpstashUrl ? process.env.UPSTASH_REDIS_REST_URL!.replace(/\/\/.*@/, '//***@') : '(not set)'}`);
  console.log(`    UPSTASH_REDIS_REST_TOKEN ${icon(hasUpstashToken)}  ${hasUpstashToken ? '****' + process.env.UPSTASH_REDIS_REST_TOKEN!.slice(-4) : '(not set)'}`);
  console.log(`    REDIS_URL               ${icon(hasRedisUrl)}  ${hasRedisUrl ? process.env.REDIS_URL!.replace(/\/\/.*@/, '//***@') : '(not set)'}`);
  console.log(`    NODE_ENV                ${process.env.NODE_ENV || '(not set — defaults to development)'}\n`);

  // Importar dinámicamente después de tener las env vars cargadas
  const { getRedisStatus, redis } = await import('../src/lib/redis');

  const status = await getRedisStatus();

  console.log(`  ${BOLD}Connection Status:${RESET}`);
  console.log(`    Connected      ${icon(status.connected)}   ${GREEN}${status.connected}${RESET}`);
  console.log(`    Mode           ${icon(status.mode)}   ${status.mode === 'connected' ? GREEN : status.mode === 'mock' ? YELLOW : RED}${status.mode}${RESET}`);
  console.log(`    Mock Redis     ${status.isMock ? `${YELLOW}⚠️  Yes${RESET}` : `${GREEN}✓ No${RESET}`}`);
  console.log(`    Quota Exceeded ${status.quotaExceeded ? `${RED}⚠️  Yes — operations will fail!${RESET}` : `${GREEN}✓ No${RESET}`}`);

  console.log(`\n  ${BOLD}Tests:${RESET}`);

  if (status.isMock && !status.quotaExceeded) {
    console.log(`    ${YELLOW}⚠️  Redis está usando MockRedis en memoria.${RESET}`);
    console.log(`    ${GRAY}   Las operaciones funcionarán pero no persistirán entre reinicios.${RESET}`);
  } else if (status.quotaExceeded) {
    console.log(`    ${RED}⛔  Upstash quota exceeded. Todas las operaciones Redis fallarán.${RESET}`);
    console.log(`    ${GRAY}   Ejecute 'npm run redis:reset-quota' después de que se renueve el plan.${RESET}`);
  } else if (status.mode === 'connected') {
    // Hacer un PING real para verificar conectividad
    try {
      const pong = await redis.ping();
      console.log(`    ${GREEN}✅  PING → ${pong}${RESET}`);
    } catch (err) {
      console.log(`    ${RED}❌  PING falló: ${err instanceof Error ? err.message : err}${RESET}`);
    }

    // Verificar latencia
    try {
      const start = performance.now();
      await redis.setex('__status_test__', 10, '1');
      await redis.get('__status_test__');
      await redis.del('__status_test__');
      const latency = Math.round(performance.now() - start);
      const color = latency < 100 ? GREEN : latency < 500 ? YELLOW : RED;
      console.log(`    ${color}⚡  Latencia (set+get+del): ${latency}ms${RESET}`);
    } catch (err) {
      console.log(`    ${RED}❌  Test de lectura/escritura falló: ${err instanceof Error ? err.message : err}${RESET}`);
    }
  }

  // Resumen
  console.log(`\n${BOLD}${CYAN}─────────────────────────────────────────────────${RESET}`);
  const allOk = status.connected && !status.quotaExceeded;
  if (allOk) {
    console.log(`  ${GREEN}${BOLD}  ✅ Redis está operativo${RESET}`);
  } else if (status.isMock) {
    console.log(`  ${YELLOW}${BOLD}  🟡 Redis en modo Mock (solo memoria)${RESET}`);
  } else {
    console.log(`  ${RED}${BOLD}  ❌ Redis no está disponible${RESET}`);
  }
  console.log(`${BOLD}${CYAN}─────────────────────────────────────────────────${RESET}\n`);
}

main().catch((err) => {
  console.error(`\n${RED}Fatal error:${RESET}`, err);
  process.exit(1);
});
