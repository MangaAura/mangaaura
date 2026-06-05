import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  { name: "Anuncios", slug: "announcements", description: "Anuncios oficiales de MangaAura", icon: "Megaphone", order: 0 },
  { name: "Discusión General", slug: "general", description: "Habla sobre mangas, manhwas y webtoons", icon: "MessageSquare", order: 1 },
  { name: "Recomendaciones", slug: "recommendations", description: "Pide y ofrece recomendaciones de lectura", icon: "Sparkles", order: 2 },
  { name: "Arte y Creación", slug: "art-creation", description: "Comparte tu arte, procesos creativos y técnicas", icon: "Palette", order: 3 },
  { name: "Desarrollo y API", slug: "development", description: "Discusiones técnicas sobre desarrollo y la API de MangaAura", icon: "Code2", order: 4 },
  { name: "Soporte y Ayuda", slug: "support", description: "Resuelve dudas sobre la plataforma", icon: "HelpCircle", order: 5 },
];

const THREAD_TEMPLATES = [
  {
    title: "¡Bienvenidos a MangaAura!",
    content: `¡Bienvenidos a la comunidad de MangaAura! 🎉

Este es el espacio oficial para que todos los amantes del manga, manhwa y webtoon puedan compartir sus opiniones, recomendaciones y crear comunidad.

Aquí tienes algunas normas básicas:
- Respeta a todos los miembros
- No hacer spam
- Usa las categorías adecuadas para cada tema
- Disfruta y comparte tu pasión por la lectura

¡Esperamos verte por aquí! 🚀`,
    categorySlug: "announcements",
    isPinned: true,
  },
  {
    title: "Novedades de la plataforma - Julio 2026",
    content: `¡Hola a todos! 👋

Este mes traemos grandes novedades a MangaAura:

✨ **Nuevo sistema de logros** - Desbloquea logros según tu actividad de lectura
📱 **App móvil en beta** - Prueba la versión para iOS y Android
🎨 **Editor de manga mejorado** - Nuevas herramientas para creadores
🏆 **Torneo de clanes** - Compite con otros clanes por premios semanales

Como siempre, esperamos sus comentarios y sugerencias. ¡Los leemos!`,
    categorySlug: "announcements",
    isPinned: true,
  },
  {
    title: "¿Cuál es tu manga favorito de este año?",
    content: `Este año ha estado lleno de lanzamientos increíbles. Quería saber cuáles son los mangas que más les han gustado hasta ahora.

Mis tops hasta ahora:
1. Sakura no Hana - Un shonen espectacular
2. Neon Genesis Rebirth - La secuela que nadie esperaba
3. Café de las Estrellas - Un slice of life que te roba el corazón

¿Cuáles son los suyos? 👇`,
    categorySlug: "general",
  },
  {
    title: "¿Recomiendan algún manhwa de fantasía oscura?",
    content: `Estoy buscando manhwas de fantasía oscura con sistemas de poder interesantes. Ya leí:

- Solo Leveling ✅
- Omniscient Reader's Viewpoint ✅
- The Beginning After the End ✅
- Tomb Raider King ✅

¿Alguna recomendación que no sea súper conocida? Busco joyas ocultas. 🙏`,
    categorySlug: "recommendations",
  },
  {
    title: "Compartan sus dibujos y procesos creativos",
    content: `¡Hola artistas! 🎨

Este hilo es para compartir sus dibujos, bocetos, y procesos creativos. Ya sea que estén dibujando a mano tradicional o digital, todos son bienvenidos.

Compartan:
- Sus últimos dibujos
- Timelapses de sus procesos
- Tips y trucos que hayan aprendido
- Recursos útiles (pinceles, texturas, referencias)

¡Vamos a inspirarnos mutuamente!`,
    categorySlug: "art-creation",
  },
  {
    title: "Guía rápida: Cómo usar la API de MangaAura",
    content: `Para los desarrolladores que quieran integrarse con MangaAura, aquí tienen una guía rápida:

**Endpoint base:** \`https://api.mangaaura.es/v1\`

**Autenticación:** Bearer token en el header

Ejemplo con fetch:
\`\`\`javascript
const response = await fetch('https://api.mangaaura.es/v1/manga', {
  headers: {
    'Authorization': 'Bearer TU_TOKEN',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
\`\`\`

Próximamente publicaré la documentación completa. ¿Alguien más está desarrollando algo interesante con la API?`,
    categorySlug: "development",
  },
  {
    title: "Problema al subir capítulos - Error 413",
    content: `¡Hola! Estoy teniendo problemas al subir un capítulo de más de 50 páginas. Me sale error 413 (Payload Too Large). 

¿Hay algún límite de tamaño? He visto que en la documentación dice que se pueden subir hasta 100 páginas por capítulo.

¿Alguien más ha tenido este problema? ¿Cómo lo solucionaron?

Gracias de antemano 🙏`,
    categorySlug: "support",
  },
  {
    title: "¿Cómo funcionan los Aura y las propinas?",
    content: `Hola a todos,

Soy nuevo en MangaAura y me gustaría entender mejor el sistema de Aura.

- ¿Cómo consigo Aura?
- ¿Para qué sirven exactamente?
- ¿Cómo funcionan las propinas a creadores?
- ¿Se pueden retirar?

He leído la guía pero algunas cosas no me quedan claras. ¡Gracias!`,
    categorySlug: "support",
  },
  {
    title: "Webtoons que deberías leer si te gusta el romance",
    content: `Hago este hilo para compartir webtoons de romance que he descubierto este año:

1. **A Business Proposal** - Clásico, divertidísimo
2. **The Remarried Empress** - Drama + romance medieval
3. **Daytime Star** - Romance en la industria del entretenimiento
4. **See You in My 19th Life** - Reencarnación y romance
5. **True Beauty** - El que empezó todo

¿Cuáles agregarían a la lista? 💕`,
    categorySlug: "recommendations",
  },
  {
    title: "Consejos para dibujar fondos y paisajes en mangas",
    content: `¡Hola a todos!

Quería compartir algunos consejos que he aprendido dibujando fondos para mis mangas:

1. **Perspectiva**: Usen siempre 1 o 2 puntos de fuga para mantener coherencia
2. **Referencias**: Tomen fotos de referencia, no dibujen de memoria
3. **Capas**: Separen fondo, personajes y elementos del frente
4. **Texturas**: Usen texturas sutiles para dar profundidad
5. **Menos es más**: No sobrecarguen el fondo, que no distraiga de la acción

¿Alguien más tiene tips para compartir?`,
    categorySlug: "art-creation",
  },
];

async function main() {
  console.log("📂 Sembrando categorías del foro...");

  const categoryMap: Record<string, string> = {};

  for (const cat of CATEGORIES) {
    const record = await prisma.forumCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, icon: cat.icon, order: cat.order },
      create: cat,
    });
    categoryMap[cat.slug] = record.id;
    console.log(`  ✅ Categoría: ${cat.name}`);
  }

  console.log("\n📝 Sembrando hilos del foro...");

  // Find an admin user to be the author, or create a system user reference
  const adminUser = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "OWNER"] } },
    orderBy: { createdAt: "asc" },
  });

  if (!adminUser) {
    console.log("  ⚠️ No se encontró usuario admin. No se crearán hilos.");
    console.log("  💡 Crea un usuario admin primero o asigna el rol ADMIN/OWNER a un usuario existente.");
  } else {
    for (const template of THREAD_TEMPLATES) {
      const categoryId = categoryMap[template.categorySlug];
      if (!categoryId) {
        console.log(`  ❌ Categoría ${template.categorySlug} no encontrada`);
        continue;
      }

      const slug = template.title
        .toLowerCase()
        .replace(/[^a-z0-9áéíóúñü\s]+/g, "")
        .replace(/\s+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 80)
        + "-" + Date.now().toString(36);

      await prisma.forumThread.upsert({
        where: { slug },
        update: { isPinned: template.isPinned ?? false },
        create: {
          title: template.title,
          slug,
          content: template.content,
          categoryId,
          authorId: adminUser.id,
          isPinned: template.isPinned ?? false,
          viewCount: Math.floor(Math.random() * 500),
        },
      });

      console.log(`  ✅ Hilo: ${template.title}`);
    }
  }

  console.log(`\n✅ ${CATEGORIES.length} categorías y ${THREAD_TEMPLATES.length} hilos sembrados`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
