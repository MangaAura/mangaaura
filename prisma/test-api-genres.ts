import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  console.log("=== Test: /api/genres endpoint logic ===\n");

  // Same logic as in the API route
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  console.log("1. Querying genres from DB...");
  const genres = await prisma.genre.findMany({
    orderBy: { name: "asc" },
  });
  console.log(`   Found: ${genres.length} genres\n`);

  if (genres.length === 0) {
    console.log("   ❌ No genres found in DB!");
    console.log("   Re-run: npx tsx prisma/seed-genres.ts");
  } else {
    console.log("2. Mapping genres (same as API route)...");
    const result = genres.map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      createdAt: g.createdAt.toISOString(),
    }));
    console.log(`   ✅ ${result.length} genres ready to return\n`);
    
    console.log("3. Sample output:");
    result.slice(0, 5).forEach((g) => {
      console.log(`   - ${g.slug} (${g.name})`);
    });
    console.log("   ...");
    console.log("\n   ✅ API endpoint should work correctly!");
    console.log("\n📌 Si la web sigue sin mostrar los géneros:");
    console.log("   1. Reinicia el servidor: Ctrl+C y npm run dev");
    console.log("   2. Abre las DevTools (F12) → Consola para ver errores");
    console.log("   3. Navega a /api/genres directamente para ver la respuesta");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
