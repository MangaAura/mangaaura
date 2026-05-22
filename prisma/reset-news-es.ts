/**
 * reset-news-es.ts
 *
 * Borra todas las noticias existentes y las recrea en español,
 * auto-traduciendo al inglés con Google Translate.
 *
 * Uso: npx tsx prisma/reset-news-es.ts
 */

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { translateText } from '../src/lib/translate';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

interface ArticleEs {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  coverUrl: string;
}

const articulos: ArticleEs[] = [
  {
    title: '¡Temporada 3 de Clanes!',
    slug: 'clan-season-3',
    excerpt:
      'Reúne a tu gremio y prepárate para la nueva batalla por InkCoins. Nuevas recompensas añadidas al pozo.',
    content:
      '¡La Temporada 3 de Clanes ha comenzado oficialmente! Reúne a los miembros de tu gremio y prepárate para batallas épicas. Esta temporada trae nuevas recompensas en InkCoins, insignias exclusivas y un sistema de emparejamiento renovado. Completa misiones diarias, escala en la tabla de clasificación y demuestra el valor de tu clan. Se han añadido nuevas recompensas al pozo de premios, incluyendo marcos de avatar raros y cosméticos de tiempo limitado. ¡La temporada dura hasta el 15 de agosto, así que empieza a ganar puntos ahora!',
    category: 'community',
    date: '2026-05-15',
    coverUrl:
      'https://images.unsplash.com/photo-1612287230202-1ff1d85d1b8a?w=400&h=225&fit=crop&auto=format',
  },
  {
    title: 'Nuevo Modo de Lectura Paginada',
    slug: 'paged-reader',
    excerpt:
      'Basado en sus comentarios, hemos refinado el sistema de lectura página por página para menor consumo de RAM en móviles.',
    content:
      'Gracias a sus valiosos comentarios, hemos renovado por completo nuestro sistema de lectura página por página. El nuevo Modo de Lectura Paginada consume significativamente menos RAM en dispositivos móviles, ofrece transiciones de página más rápidas e incluye una experiencia de lectura personalizable. Ahora puedes ajustar el brillo, el color de fondo y el tamaño de fuente a tu gusto. Tanto el desplazamiento vertical como la paginación horizontal son compatibles. ¡Pruébalo en cualquier manga y cuéntanos qué te parece!',
    category: 'platform',
    date: '2026-05-10',
    coverUrl:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=225&fit=crop&auto=format',
  },
  {
    title: 'Nuevas Herramientas de IA para Creadores',
    slug: 'ai-tools',
    excerpt:
      'Potentes nuevas herramientas de generación y edición para creadores. Lleva tu manga al siguiente nivel.',
    content:
      '¡Nos emociona anunciar una gran actualización de nuestras herramientas de creación con IA! El nuevo conjunto incluye generación de personajes mejorada con mayor consistencia, creación de escenas de fondo mejoradas y una herramienta avanzada de retoque para afinar tus viñetas. Nuestra IA ahora comprende mejor los estilos de arte manga y puede ayudarte con patrones de tramas, líneas de velocidad y fondos de efectos. Estas herramientas están disponibles para todos los creadores en MangaAura. ¡Mejora tu flujo de trabajo y da vida a tus historias!',
    category: 'platform',
    date: '2026-05-05',
    coverUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=225&fit=crop&auto=format',
  },
  {
    title: 'App Móvil en Beta Cerrada',
    slug: 'mobile-beta',
    excerpt:
      'La beta cerrada de MangaAura para iOS y Android ya está disponible. Experiencia móvil optimizada.',
    content:
      '¡La beta cerrada de nuestra aplicación móvil ya está disponible para usuarios de iOS y Android! Disfruta de MangaAura optimizado para tu teléfono con una interfaz nativa, desplazamiento fluido y soporte de lectura sin conexión. La beta incluye acceso a tu biblioteca, el lector y las funciones de la comunidad. Para unirte a la beta, revisa tu bandeja de entrada para ver si tienes una invitación o regístrate en la lista de espera. ¡Esperamos tus comentarios para hacer que la experiencia móvil sea aún mejor antes del lanzamiento público!',
    category: 'platform',
    date: '2026-04-28',
    coverUrl:
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=225&fit=crop&auto=format',
  },
  {
    title: 'Concurso de Manga MangaAura',
    slug: 'manga-contest',
    excerpt:
      'Participa en nuestro concurso mensual de manga y gana InkCoins, visibilidad e insignias exclusivas.',
    content:
      '¡Nuestro concurso mensual de manga regresa con premios más grandes que nunca! El tema de este mes es "Mundos Paralelos": crea un one-shot de manga explorando dimensiones alternativas. El ganador recibe 5000 InkCoins, un lugar destacado en la página principal, una insignia exclusiva de "Ganador del Concurso" y comentarios directos de nuestro equipo editorial. Las inscripciones están abiertas hasta fin de mes. Todos los géneros y estilos son bienvenidos. ¡Deja volar tu imaginación!',
    category: 'community',
    date: '2026-04-20',
    coverUrl:
      'https://images.unsplash.com/photo-1529111290557-82f6d5b59a2a?w=400&h=225&fit=crop&auto=format',
  },
  {
    title: 'Nuevo Panel de Estadísticas de Lectura',
    slug: 'reading-stats',
    excerpt:
      'Registra tus hábitos de lectura, establece metas y descubre tus géneros más leídos con nuestro nuevo panel de estadísticas personalizado.',
    content:
      '¡Nos emociona presentar el Panel de Estadísticas de Lectura, tu compañero personal de lectura! Ahora puedes registrar cada capítulo que lees, visualizar tus hábitos de lectura a lo largo del tiempo y descubrir información fascinante sobre tu viaje manga.\n\nEl panel muestra tus capítulos totales leídos, rachas de lectura, géneros favoritos y patrones de lectura por hora. Establece metas de lectura semanales y gana insignias al alcanzar hitos. Compara tus estadísticas con amigos y descubre quién es el lector más dedicado de tu clan.\n\nAccede a tu panel desde tu página de perfil o haciendo clic en el nuevo botón "Estadísticas" en el lector. Tus datos son privados por defecto, pero puedes elegir compartir estadísticas seleccionadas con tu clan o seguidores. ¡Empieza a registrar hoy y descubre cuán profunda es tu adicción al manga!',
    category: 'community',
    date: '2026-04-15',
    coverUrl:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop&auto=format',
  },
  {
    title: 'Destacado de Creadores: Estrellas Emergentes',
    slug: 'creator-spotlight',
    excerpt:
      'Conoce a los creadores que han conquistado el corazón de la comunidad este mes con sus historias y arte excepcionales.',
    content:
      'Cada mes destacamos a los talentosos creadores que hacen especial a MangaAura. Este mayo, presentamos a tres estrellas emergentes cuyo trabajo ha generado una participación excepcional de la comunidad.\n\nEn primer lugar, SakuraManga con "Susurros de la Luna", un romance inquietantemente hermoso ambientado en el Japón feudal que tiene a los lectores enganchados con su intrincada composición de viñetas y profundidad emocional. Con más de 50,000 lecturas en su primer mes, esta serie es una a seguir.\n\nA continuación, tenemos a PixelNinja cuya épica de acción "Dragones de Neón" combina estética cyberpunk con narrativa clásica de artes marciales. La dinámica coreografía de combate y la vibrante paleta de colores le han ganado una base de fans dedicada que crece a diario.\n\nFinalmente, conoce a ArtWanderer, un creador que se unió a MangaAura hace solo tres meses y ya ha publicado 4 capítulos completos de "El Jardín Mecánico", una aventura de fantasía steampunk con un hermoso arte lineal y un mundo ricamente imaginado.\n\n¡Felicidades a todos nuestros creadores destacados! ¿Quieres aparecer el próximo mes? Sigue creando, interactuando con tus lectores y superando los límites de tu arte.',
    category: 'community',
    date: '2026-04-08',
    coverUrl:
      'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400&h=225&fit=crop&auto=format',
  },
  {
    title: 'API para Desarrolladores Ya Disponible',
    slug: 'developer-api',
    excerpt:
      'Crea integraciones, bots y extiende MangaAura con nuestra API REST oficial ahora en beta abierta para todos los creadores verificados.',
    content:
      '¡Nos emociona anunciar la beta abierta de la API para Desarrolladores de MangaAura, tu puerta de entrada para crear integraciones personalizadas y ampliar las capacidades de la plataforma!\n\nLa API proporciona acceso programático a metadatos de manga, listados de capítulos, perfiles de usuario (con consentimiento) y funciones de la comunidad. Crea un bot de Discord que notifique a tu servidor sobre nuevos lanzamientos de capítulos, crea un widget de seguimiento de lectura para tu sitio web personal o desarrolla un cliente de terceros con tu propia interfaz de lectura.\n\nLas claves de API están disponibles para todos los creadores verificados a través de la página de Configuración de Desarrollador. Proporcionamos documentación completa con ejemplos de código en JavaScript, Python y curl. Cada clave incluye límites de tasa generosos y análisis detallados de uso.\n\nEstamos iterando activamente la API basándonos en los comentarios de los desarrolladores, así que únete a nuestro canal de Discord para Desarrolladores para compartir tus casos de uso y sugerencias. La API es gratuita durante la beta, con niveles de precios que se anunciarán en el lanzamiento completo.',
    category: 'platform',
    date: '2026-03-25',
    coverUrl:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=225&fit=crop&auto=format',
  },
  {
    title: 'Renovación Visual de la Plataforma',
    slug: 'ui-redesign',
    excerpt:
      'Una experiencia visual más pulida, rápida y consistente en toda la plataforma. Esto es lo que cambió y por qué.',
    content:
      '¡Puede que hayas notado que las cosas se ven un poco diferentes! Hemos implementado una renovación visual integral en todo MangaAura para hacer la plataforma más intuitiva, visualmente cohesiva y con mejor rendimiento.\n\nLa renovación incluye tipografía actualizada con mejor legibilidad, paletas de colores refinadas para mejorar el contraste y la accesibilidad, transiciones y micro-interacciones más suaves, y un sistema de navegación rediseñado que muestra tus funciones más usadas más rápido.\n\nEstandarizamos los componentes de tarjetas en todo el sitio para consistencia visual, redujimos el desorden visual en la interfaz del lector y añadimos animaciones sutiles que hacen que la navegación se sienta más receptiva. La experiencia móvil también se ha mejorado significativamente con áreas táctiles más grandes y diseños optimizados.\n\nEsta actualización es el resultado de meses de comentarios de usuarios y pruebas de usabilidad. Seguiremos refinando basándonos en tus opiniones. ¡Envíanos un mensaje a través del formulario de comentarios si ves algo que podría mejorarse!',
    category: 'platform',
    date: '2026-03-15',
    coverUrl:
      'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format',
  },
  {
    title: 'Gran Mejora de Rendimiento',
    slug: 'performance-boost',
    excerpt:
      'Las páginas cargan un 40% más rápido, el uso de datos se redujo un 60% en móviles y los tiempos de respuesta del servidor se redujeron a la mitad.',
    content:
      'El rendimiento siempre ha sido una prioridad máxima, y nos enorgullece anunciar nuestra mayor actualización de infraestructura hasta la fecha. Durante el último mes, nuestro equipo de ingeniería ha estado trabajando arduamente optimizando cada capa de la pila tecnológica.\n\nLas mejoras clave incluyen: una reescritura completa de nuestro sistema de entrega de imágenes con formatos de última generación y compresión inteligente, implementación de caché en el borde a través de nuestra CDN global que sirve el 80% de las solicitudes desde caché, optimización de consultas a la base de datos que redujo los tiempos promedio de carga de página en un 40%, y una nueva estrategia de carga diferida para el lector que reduce la transferencia inicial de datos en un 60%.\n\nLos usuarios móviles notarán la mayor diferencia: las páginas cargan en menos de 2 segundos incluso en conexiones más lentas, y el lector consume significativamente menos ancho de banda por capítulo. También hemos reducido nuestros tiempos de respuesta del servidor en más del 50%, haciendo que toda la plataforma se sienta más ágil.\n\nEstas mejoras están activas ahora en todas las regiones. ¡Cuéntanos cómo se siente el nuevo rendimiento para ti!',
    category: 'platform',
    date: '2026-03-05',
    coverUrl:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop&auto=format',
  },
  {
    title: 'Festival de Lectura de Verano',
    slug: 'summer-event',
    excerpt:
      '¡Únete al Festival de Lectura de Verano con insignias exclusivas, fines de semana de XP doble y un gran premio de 10,000 InkCoins!',
    content:
      '¡El verano está aquí y también nuestro evento comunitario más grande del año: el Festival de Lectura de Verano de MangaAura! Del 1 de junio al 31 de agosto, lectores y creadores pueden participar en una celebración de manga de toda una temporada.\n\n¿Qué hay preparado? Fines de semana de XP doble cada mes, insignias exclusivas del Festival de Verano para los participantes que completen los desafíos de lectura, recompensas diarias de inicio de sesión incluyendo InkCoins gratis y artículos cosméticos, y un gran premio de 10,000 InkCoins otorgado al lector con más capítulos completados para el final del verano.\n\nLos creadores tampoco se quedan fuera: organizamos un concurso de one-shot "Especial de Verano" con premios separados. Publica un capítulo con temática veraniega entre junio y agosto y podrías ganar 5,000 InkCoins más un lugar destacado permanente en la página principal.\n\nEl festival también incluye eventos comunitarios semanales, sesiones de preguntas y respuestas con creadores y fiestas de lectura colaborativas. Consulta la página de Eventos para ver el calendario completo y ¡comienza tu viaje de lectura veraniego hoy! Haz una captura de tus estadísticas de lectura y compártela con #MangaAuraVerano para tener la oportunidad de aparecer en nuestras redes sociales.',
    category: 'community',
    date: '2026-02-20',
    coverUrl:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=225&fit=crop&auto=format',
  },
];

async function resetAndSeedNews() {
  console.log('🗑️  Eliminando todas las noticias existentes...');

  const deleted = await prisma.newsArticle.deleteMany();
  console.log(`   ${deleted.count} artículos eliminados.\n`);

  // Buscar un admin para asignar como autor
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  });

  if (!admin) {
    console.error(
      '❌ No se encontró ningún usuario admin. ' +
        'Ejecuta primero `npx tsx prisma/seed.ts` para crear usuarios de prueba.',
    );
    process.exit(1);
  }

  console.log(`✅ Admin encontrado: ${admin.id}\n`);
  console.log('📰 Creando noticias en español y auto-traduciendo al inglés...\n');

  let creados = 0;
  let fallosTraduccion = 0;

  for (let i = 0; i < articulos.length; i++) {
    const articulo = articulos[i];
    const publishedAt = new Date(articulo.date + 'T12:00:00Z');

    console.log(`  [${i + 1}/${articulos.length}] "${articulo.title}"`);

    // Auto-traducir al inglés
    let titleEn: string | null = null;
    let excerptEn: string | null = null;
    let contentEn: string | null = null;

    try {
      [titleEn, excerptEn, contentEn] = await Promise.all([
        translateText(articulo.title, 'es', 'en'),
        translateText(articulo.excerpt, 'es', 'en'),
        translateText(articulo.content, 'es', 'en'),
      ]);
      console.log('     ✅ Traducido al inglés');
    } catch (err: any) {
      console.log(`     ⚠️  Falló la traducción: ${err.message}`);
      fallosTraduccion++;
    }

    await prisma.newsArticle.create({
      data: {
        title: articulo.title,
        slug: articulo.slug,
        excerpt: articulo.excerpt,
        content: articulo.content,
        titleEn,
        excerptEn,
        contentEn,
        coverUrl: articulo.coverUrl,
        category: articulo.category,
        authorId: admin.id,
        isPublished: true,
        publishedAt,
      },
    });

    creados++;
    // Pequeña pausa entre artículos para no saturar Google Translate
    if (i < articulos.length - 1) {
      await new Promise((r) => setTimeout(r, 800));
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   Eliminados: ${deleted.count}`);
  console.log(`   Creados: ${creados}`);
  console.log(`   Con traducción: ${creados - fallosTraduccion}`);
  console.log(`   Fallos de traducción: ${fallosTraduccion}`);
  console.log('✨ Noticias recreadas en español correctamente');
}

resetAndSeedNews()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
