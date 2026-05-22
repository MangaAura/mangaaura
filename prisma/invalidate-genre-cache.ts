import "dotenv/config";
import { Redis } from "@upstash/redis";

async function main() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    console.log("Redis configurado. Invalidando caché de géneros...");
    const redis = new Redis({ url, token });
    
    // Scan for genre cache keys
    let cursor = 0;
    const keysToDelete: string[] = [];
    do {
      const result = await redis.scan(cursor, { match: "mangaaura:genres:*", count: 100 });
      cursor = Number(result[0]);
      keysToDelete.push(...result[1]);
    } while (cursor !== 0);

    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
      console.log(`✅ Eliminados ${keysToDelete.length} keys de caché:`, keysToDelete);
    } else {
      console.log("No hay keys de caché de géneros en Redis.");
    }
  } else {
    console.log("Redis NO configurado — la caché es solo en memoria (se limpia al reiniciar el servidor).");
  }

  console.log("\n📌 Los géneros están en la BD (15 registros).");
  console.log("📌 Si no aparecen en la web, reinicia el servidor de desarrollo (Ctrl+C y npm run dev) para limpiar la memory cache.");
}

main().catch(console.error);
