import { PrismaClient } from "../src/generated/prisma/client.js";
const { PrismaPg } = require("@prisma/adapter-pg");
import { BLOG_COVERS } from "./data/blog-covers.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const AUTHOR_ID = "7e054872-aa97-4f0e-a354-ed7318a51c1f"; // mangaaura user

const articles = [
  {
    title: "Dónde leer manga online gratis y legal en español en 2026",
    slug: "donde-leer-manga-online-gratis-legal-2026",
    excerpt: "Descubre las mejores plataformas para leer manga online gratis y de forma legal en español. Comparamos MangaPlus, Webtoon, MangaAura y otras alternativas para que elijas la mejor.",
    category: "platform",
    content: `<p>Leer manga online se ha convertido en una de las actividades favoritas de millones de personas en todo el mundo. Pero con tantas opciones disponibles, puede ser difícil saber cuáles son las mejores plataformas para leer manga online gratis y legal en español.</p>

<h2>¿Por qué es importante leer manga legal?</h2>
<p>Leer manga de forma legal asegura que los creadores reciban el apoyo que merecen. Muchas páginas pirateadas roban contenido y no benefician a los autores. Afortunadamente, cada vez hay más plataformas oficiales y alternativas como MangaAura que ofrecen una experiencia excelente.</p>

<h2>Mejores plataformas para leer manga en 2026</h2>

<h3>1. MangaPlus (Shueisha)</h3>
<p>La plataforma oficial de Shueisha, la editorial de One Piece, My Hero Academia y Jujutsu Kaisen. Ofrece los primeros y últimos capítulos gratis de forma legal. Es perfecta para seguir series populares al día.</p>

<h3>2. Webtoon (Naver)</h3>
<p>La plataforma de webtoons más grande del mundo. Aunque se enfoca más en formato vertical coreano, tiene un catálogo masivo de obras en español. Ideal para descubrir nuevos talentos.</p>

<h3>3. MangaAura</h3>
<p>MangaAura es una plataforma emergente que combina lectura gratuita con gamificación. Ganas XP y subes de nivel mientras lees, puedes unirte a clanes y competir en rankings. Además, los creadores pueden publicar sus obras y recibir apoyo económico directo mediante crowdfunding con Aura, la moneda virtual de la plataforma.</p>

<p>Lo que hace única a MangaAura es que no solo eres un lector pasivo — cada capítulo que lees te acerca al siguiente nivel, desbloqueas logros y construyes tu reputación dentro de la comunidad.</p>

<h3>4. Tapas</h3>
<p>Otra plataforma popular con un catálogo variado que incluye webcomics y manga. Ofrece un modelo freemium con capítulos gratuitos y de pago.</p>

<h2>¿Cuál elegir?</h2>
<p>Depende de lo que busques. Si quieres seguir los grandes títulos de Shueisha, MangaPlus es tu mejor opción. Si prefieres webtoons, Webtoon tiene el catálogo más amplio. Pero si buscas una experiencia comunitaria donde tu actividad se recompense y puedas apoyar directamente a creadores emergentes, MangaAura es la opción más innovadora.</p>

<p>Lo mejor de todo es que puedes usar varias plataformas a la vez — no tienes por qué limitarte a una sola. Combínalas y tendrás acceso a más manga que el que podrías leer en una vida.</p>`,

    titleEn: "Where to read manga online for free and legally in Spanish in 2026",
    excerptEn: "Discover the best platforms to read manga online for free and legally in Spanish. We compare MangaPlus, Webtoon, MangaAura and other alternatives.",
    contentEn: `<p>Reading manga online has become one of the favorite activities of millions of people worldwide. But with so many options available, it can be hard to know which are the best platforms to read manga online for free and legally in Spanish.</p>

<h2>Why is reading manga legally important?</h2>
<p>Reading manga legally ensures that creators receive the support they deserve. Many pirate sites steal content and don't benefit the authors. Fortunately, there are more and more official platforms and alternatives like MangaAura that offer an excellent experience.</p>

<h2>Best platforms to read manga in 2026</h2>

<h3>1. MangaPlus (Shueisha)</h3>
<p>The official platform of Shueisha, the publisher of One Piece, My Hero Academia and Jujutsu Kaisen. It offers the first and latest chapters for free legally. Perfect for following popular series.</p>

<h3>2. Webtoon (Naver)</h3>
<p>The largest webtoon platform in the world. Although it focuses more on Korean vertical format, it has a massive catalog of works in Spanish.</p>

<h3>3. MangaAura</h3>
<p>MangaAura is an emerging platform that combines free reading with gamification. You earn XP and level up while reading, join clans and compete in rankings. Plus, creators can publish their works and receive direct financial support through crowdfunding with Aura, the platform's virtual currency.</p>

<h3>4. Tapas</h3>
<p>Another popular platform with a varied catalog including webcomics and manga. It offers a freemium model with free and paid chapters.</p>`,

    isPublished: true,
    isFeatured: true,
    publishedAt: new Date(),
  },
  {
    title: "Cómo crear tu propio manga: guía completa para publicar online",
    slug: "como-crear-tu-propio-manga-guia-completa",
    excerpt: "¿Sueñas con crear tu propio manga? Te explicamos paso a paso cómo escribir, dibujar y publicar tu serie online. Desde el guión hasta la publicación en plataformas como MangaAura.",
    category: "community",
    content: `<p>Crear tu propio manga es el sueño de muchos artistas y escritores. Lo que antes requería contactar con editoriales y pasar por procesos complicados, hoy está al alcance de cualquiera con conexión a internet. En esta guía te explicamos todo el proceso.</p>

<h2>Paso 1: El guión y la historia</h2>
<p>Todo buen manga empieza con una historia sólida. Define tu premisa, tus personajes principales y el conflicto central. Pregúntate: ¿qué hace única a mi historia? ¿Por qué alguien querría leer el siguiente capítulo?</p>

<p>Consejos para el guión:</p>
<ul>
<li>Crea fichas de personaje con su personalidad, pasado y motivaciones</li>
<li>Estructura tu historia en arcos argumentales</li>
<li>Define el tono: ¿será un shonen de acción, un slice of life o un seinen oscuro?</li>
<li>Escribe un esquema de los primeros 10-20 capítulos antes de empezar a dibujar</li>
</ul>

<h2>Paso 2: El arte y el estilo</h2>
<p>No necesitas ser un dibujante profesional para crear manga. Muchas obras exitosas tienen estilos únicos que las hacen destacar. La consistencia es más importante que la perfección.</p>

<p>Herramientas recomendadas:</p>
<ul>
<li>Clip Studio Paint: el estándar de la industria para manga</li>
<li>Procreate: excelente para iPad, muy intuitivo</li>
<li>Krita: alternativa gratuita y potente</li>
<li>MediBang Paint: gratuito, con herramientas específicas para manga</li>
</ul>

<h2>Paso 3: Publicación</h2>
<p>Una vez que tienes tus capítulos listos, llega el momento de publicarlos. Las plataformas digitales han democratizado la publicación de manga:</p>

<p><strong>MangaAura</strong> te permite publicar tu manga con un sistema de arrastrar y soltar. No necesitas saber código ni tener página web. Además, el sistema de crowdfunding integrado permite que tus lectores financien tus capítulos directamente con Aura.</p>

<p>Otras plataformas como Webtoon Canvas o Tapas también son excelentes para empezar, pero MangaAura destaca porque los creadores mantienen el 100% de sus derechos y reciben el apoyo económico directo de sus lectores desde el día uno.</p>

<h2>Paso 4: Promociona tu obra</h2>
<p>Publicar es solo el primer paso. Para que tu manga tenga lectores, necesitas darlo a conocer:</p>
<ul>
<li>Comparte en redes sociales (Instagram, X/Twitter, TikTok)</li>
<li>Participa en comunidades de manga (Reddit, Discord)</li>
<li>Colabora con otros creadores</li>
<li>Sé constante: publica con regularidad para mantener a tu audiencia enganchada</li>
</ul>

<p>Crear tu propio manga es un viaje largo pero increíblemente gratificante. Con las herramientas actuales, nunca ha sido más fácil compartir tus historias con el mundo.</p>`,

    isPublished: true,
    isFeatured: false,
    publishedAt: new Date(),
  },
  {
    title: "Gamificación en la lectura: cómo el XP y los logros transforman tu experiencia manga",
    slug: "gamificacion-lectura-xp-logros-manga",
    excerpt: "Descubre cómo la gamificación está revolucionando la forma de leer manga. Sube de nivel, gana logros y compite en rankings mientras disfrutas de tus series favoritas en MangaAura.",
    category: "platform",
    content: `<p>La gamificación — aplicar mecánicas de juego a actividades cotidianas — ha llegado al mundo del manga para quedarse. Plataformas como MangaAura están transformando la lectura pasiva en una experiencia activa y social.</p>

<h2>¿Qué es la gamificación aplicada a la lectura?</h2>
<p>Imagina que cada capítulo que lees te da puntos de experiencia (XP). Que cada 10 capítulos seguidos desbloqueas un logro. Que puedes competir con tus amigos para ver quién lee más. Eso es exactamente lo que hace la gamificación en plataformas de lectura como MangaAura.</p>

<h2>Beneficios de la lectura gamificada</h2>

<h3>1. Motivación constante</h3>
<p>El sistema de XP y niveles convierte la lectura en un hábito. Ver cómo sube tu barra de progreso te anima a leer "solo un capítulo más". Las rachas (streaks) de lectura consecutiva son particularmente efectivas: perder tu racha de 30 días duele lo suficiente como para no saltarte un día.</p>

<h3>2. Sentido de progreso</h3>
<p>Cada manga que terminas, cada logro que desbloqueas, cada nivel que subes — todo contribuye a una sensación tangible de progreso. No solo estás leyendo historias, estás construyendo tu perfil de lector.</p>

<h3>3. Comunidad y competición</h3>
<p>Los rankings semanales y mensuales, los clanes y los eventos crean una comunidad activa alrededor de la lectura. Puedes unirte a un clan con tus amigos, competir por el primer puesto del ranking y celebrar juntos cuando alguien alcanza un hito.</p>

<h2>El sistema de MangaAura</h2>
<p>MangaAura ha implementado uno de los sistemas de gamificación más completos para lectura de manga:</p>
<ul>
<li><strong>XP y niveles:</strong> Cada acción en la plataforma te da XP. Subes de nivel desde Novato hasta Leyenda del Manga.</li>
<li><strong>Logros:</strong> Más de 50 logros que van desde "Leer tu primer capítulo" hasta "Completar 100 series".</li>
<li><strong>Rachas:</strong> Lectura consecutiva con congeladores de racha para esos días que no puedes leer.</li>
<li><strong>Clanes:</strong> Grupos con identidad propia, rankings colectivos y membresías.</li>
<li><strong>Rankings:</strong> Competiciones semanales y mensuales con recompensas exclusivas.</li>
</ul>

<h2>¿Es solo un truco para engancharte?</h2>
<p>No exactamente. La gamificación bien implementada mejora genuinamente la experiencia. No se trata de manipularte para que leas más, sino de hacer que la lectura sea más divertida y social. Cuando funciona bien, la gamificación transforma un hábito solitario en una experiencia compartida.</p>

<p>Si aún no has probado la lectura gamificada, te invitamos a crear una cuenta en MangaAura y empezar tu viaje de lector. Nunca habías leído manga así.</p>`,

    isPublished: true,
    isFeatured: false,
    publishedAt: new Date(),
  },
  {
    title: "Guía de géneros de manga: shonen, shojo, seinen y más explicados",
    slug: "guia-generos-manga-shonen-shojo-seinen",
    excerpt: "¿No sabes la diferencia entre shonen y seinen? Te explicamos todos los géneros demográficos del manga con ejemplos de cada uno para que encuentres tu próxima serie favorita.",
    category: "community",
    content: `<p>Una de las primeras barreras al entrar al mundo del manga es entender la clasificación por géneros demográficos. Shonen, shojo, seinen, josei... ¿Qué significa cada uno? ¿Importa realmente? En esta guía te lo explicamos todo.</p>

<h2>¿Qué son los géneros demográficos?</h2>
<p>A diferencia de los géneros temáticos (acción, romance, comedia), los géneros demográficos clasifican el manga por su público objetivo. Esto no significa que no puedas leer de todo — de hecho, te animamos a explorar todos los géneros.</p>

<h2>Shonen: el género más popular</h2>
<p>Dirigido a chicos jóvenes (12-18 años), aunque lo leen personas de todas las edades. Se caracteriza por acción intensa, amistad, superación personal y batallas épicas.</p>
<p><strong>Ejemplos:</strong> Dragon Ball, One Piece, Naruto, My Hero Academia, Jujutsu Kaisen, Demon Slayer</p>

<h2>Shojo: romance y emociones</h2>
<p>Dirigido a chicas jóvenes (12-18 años). Se enfoca en relaciones románticas, desarrollo emocional y crecimiento personal. El arte suele ser más detallado y expresivo.</p>
<p><strong>Ejemplos:</strong> Sailor Moon, Fruits Basket, Kimi ni Todoke, Ao Haru Ride</p>

<h2>Seinen: para adultos</h2>
<p>Dirigido a hombres adultos (18+). Temas más maduros, violencia realista, psicología profunda y tramas complejas. Sin las restricciones del shonen.</p>
<p><strong>Ejemplos:</strong> Berserk, Vinland Saga, Monster, Tokyo Ghoul, Attack on Titan</p>

<h2>Josei: para mujeres adultas</h2>
<p>Dirigido a mujeres adultas (18+). Similar al shojo pero con relaciones más realistas y maduras. Tramas que exploran la vida laboral, el matrimonio y dilemas adultos.</p>
<p><strong>Ejemplos:</strong> Nana, Paradise Kiss, Honey and Clover, Princess Jellyfish</p>

<h2>Otros géneros importantes</h2>
<ul>
<li><strong>Kodomo:</strong> Para niños pequeños (Pokémon, Doraemon)</li>
<li><strong>Isekai:</strong> Reencarnación en otro mundo (Re:Zero, Mushoku Tensei)</li>
<li><strong>Slice of Life:</strong> Vida cotidiana (Yotsuba!, Non Non Biyori)</li>
<li><strong>Mecha:</strong> Robots gigantes (Neon Genesis Evangelion, Gundam)</li>
<li><strong>Horror:</strong> Terror psicológico y sobrenatural (Junji Ito, Another)</li>
</ul>

<h2>¿Importa realmente la clasificación?</h2>
<p>No te limites por las etiquetas. Muchas de las mejores series mezclan géneros y desafían las clasificaciones. Attack on Titan es técnicamente shonen pero tiene la oscuridad de un seinen. Fullmetal Alchemist tiene elementos de acción, drama y filosofía.</p>
<p>Lo importante es que explores, descubras y disfrutes. El mundo del manga es inmenso y hay algo para todos.</p>`,

    isPublished: true,
    isFeatured: false,
    publishedAt: new Date(),
  },
  {
    title: "Manga vs Webtoon: diferencias, ventajas y cuál elegir según tu estilo",
    slug: "manga-vs-webtoon-diferencias-ventajas",
    excerpt: "¿Manga japonés o webtoon coreano? Analizamos las diferencias clave entre ambos formatos: lectura, arte, plataformas y modelos de monetización. Descubre cuál se adapta mejor a ti.",
    category: "platform",
    content: `<p>Si eres fan de la narrativa visual, seguro que has oído hablar de mangas y webtoons. Pero aunque ambos cuentan historias a través de viñetas, tienen diferencias fundamentales que afectan tanto a la experiencia de lectura como a la creación.</p>

<h2>Formato de lectura</h2>
<p><strong>Manga:</strong> Se lee de derecha a izquierda (estilo japonés), en páginas individuales que forman un libro. Tradicionalmente en blanco y negro, aunque cada vez hay más series a color. El ritmo de lectura lo marca el paso de página.</p>
<p><strong>Webtoon:</strong> Formato vertical infinito diseñado para scroll en móvil. A todo color. El ritmo lo marca el scroll continuo, lo que permite transiciones más suaves y efectos visuales como fondos que se mueven con el scroll.</p>

<h2>Diferencias en el arte</h2>
<p>El manga suele tener un arte más detallado en blanco y negro, con tramas (screen tones) para texturas y sombreados. Los fondos son elaborados y las viñetas tienen composiciones complejas.</p>
<p>Los webtoons usan colores planos y estilos más simplificados, optimizados para pantalla. Los fondos pueden ser más simples porque el foco está en los personajes y el diálogo.</p>

<h2>Plataformas y monetización</h2>
<p><strong>Manga digital:</strong> MangaPlus, MangaAura, plataformas de editoriales. El modelo más común es gratuito con publicidad o suscripción premium.</p>
<p><strong>Webtoon:</strong> La plataforma Webtoon (Naver) domina el mercado. Su modelo es freemium: capítulos gratis y luego de pago. Los creadores reciben ingresos por publicidad y por compras.</p>

<h2>Ventajas de cada formato</h2>

<h3>Ventajas del manga</h3>
<ul>
<li>Arte más detallado y expresivo</li>
<li>Tradición e historia rica</li>
<li>Gran variedad de géneros y estilos</li>
<li>Experiencia de lectura más pausada y reflexiva</li>
</ul>

<h3>Ventajas del webtoon</h3>
<ul>
<li>Optimizado para móvil</li>
<li>A todo color</li>
<li>Actualizaciones frecuentes (semanal)</li>
<li>Más accesible para nuevos creadores</li>
</ul>

<h2>¿Cuál deberías elegir?</h2>
<p>No hay una respuesta correcta. Muchos lectores disfrutan de ambos formatos. Si te gusta el arte detallado y las historias pausadas, el manga es para ti. Si prefieres leer en el móvil con colores vibrantes y actualizaciones frecuentes, el webtoon te encantará.</p>
<p>En MangaAura, apostamos por el formato manga tradicional con las ventajas del medio digital: lectura optimizada, gamificación y comunidad. Pero sea cual sea tu preferencia, lo importante es que sigas disfrutando de grandes historias.</p>`,

    isPublished: true,
    isFeatured: false,
    publishedAt: new Date(),
  },
];

async function main() {
  console.log(`Insertando ${articles.length} artículos...`);
  for (const article of articles) {
    // Check if slug already exists
    const existing = await prisma.newsArticle.findUnique({ where: { slug: article.slug } });
    if (existing) {
      console.log(`  ↻ Ya existe: "${article.title}" (${article.slug})`);
      continue;
    }
    const created = await prisma.newsArticle.create({
      data: {
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        titleEn: article.titleEn ?? null,
        excerptEn: article.excerptEn ?? null,
        contentEn: article.contentEn ?? null,
        coverUrl: BLOG_COVERS[article.slug] || null,
        category: article.category,
        authorId: AUTHOR_ID,
        isPublished: article.isPublished,
        isFeatured: article.isFeatured,
        publishedAt: article.publishedAt,
      },
    });
    console.log(`  ✓ Creado: "${created.title}"`);
  }
  console.log("¡Artículos insertados correctamente!");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
