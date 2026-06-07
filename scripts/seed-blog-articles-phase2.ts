import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const AUTHOR_ID = "7e054872-aa97-4f0e-a354-ed7318a51c1f"; // mangaaura user

const articles = [
  {
    title: "Mejores páginas para leer manga en español en 2026",
    slug: "mejores-paginas-leer-manga-espanol",
    excerpt: "¿Buscas las mejores páginas para leer manga en español? Te presentamos las plataformas más completas con catálogo en español, actualizaciones diarias y funciones exclusivas como gamificación.",
    category: "platform",
    content: `<p>Encontrar páginas para leer manga en español de calidad es más fácil que nunca. La demanda de contenido en español ha crecido enormemente, y las plataformas responden cada vez mejor a esta necesidad. Pero no todas las opciones son iguales.</p>

<h2>¿Qué hace a una buena plataforma de manga?</h2>
<p>Antes de listar las mejores páginas para leer manga en español, hay que definir qué características hacen que una plataforma destaque: catálogo variado, actualizaciones frecuentes, buena experiencia de lectura y, cada vez más, funciones sociales que hagan la lectura más entretenida.</p>

<h2>Las mejores plataformas</h2>

<h3>1. MangaAura — La experiencia más innovadora</h3>
<p>MangaAura no solo ofrece un extenso catálogo de manga en español, sino que transforma la lectura en una experiencia gamificada. Ganas XP por cada capítulo, subes de nivel, desbloqueas logros y compites en rankings con otros lectores. Es la única plataforma que combina lectura social con recompensas.</p>

<h3>2. MangaPlus</h3>
<p>La plataforma oficial de Shueisha. Ofrece capítulos gratis de los títulos más populares del momento. Perfecta para seguir al día series como One Piece, Jujutsu Kaisen y My Hero Academia.</p>

<h3>3. Webtoon</h3>
<p>Aunque se enfoca en webtoons coreanos, tiene una sección cada vez más grande de manga traducido al español. Su punto fuerte es la accesibilidad y el formato optimizado para móvil.</p>

<h2>¿Por qué MangaAura lidera la innovación?</h2>
<p>Mientras que otras plataformas se limitan a ofrecer contenido, MangaAura apuesta por la comunidad. Los lectores pueden unirse a clanes, participar en eventos semanales y ganar Aura, la moneda virtual que pueden usar para apoyar a sus creadores favoritos. Si buscas páginas para leer manga en español que vayan más allá de lo básico, MangaAura es tu mejor opción.</p>

<p>Además, MangaAura actualiza su catálogo semanalmente y permite a los creadores publicar sus obras directamente, manteniendo el 100% de sus derechos. Una plataforma que cuida tanto a lectores como a creadores.</p>`,

    titleEn: "Best websites to read manga in Spanish in 2026",
    excerptEn: "Looking for the best websites to read manga in Spanish? We present the most complete platforms with Spanish catalog, daily updates and exclusive features like gamification.",
    contentEn: `<p>Finding quality websites to read manga in Spanish is easier than ever. Demand for Spanish content has grown enormously, and platforms are responding better than ever. But not all options are equal.</p>

<h2>What makes a good manga platform?</h2>
<p>Before listing the best websites to read manga in Spanish, we need to define what features make a platform stand out: varied catalog, frequent updates, good reading experience, and increasingly, social features that make reading more entertaining.</p>

<h2>The best platforms</h2>

<h3>1. MangaAura — The most innovative experience</h3>
<p>MangaAura not only offers an extensive catalog of manga in Spanish, but transforms reading into a gamified experience. You earn XP for every chapter, level up, unlock achievements, and compete in rankings with other readers. It's the only platform that combines social reading with rewards.</p>

<h3>2. MangaPlus</h3>
<p>Shueisha's official platform. It offers free chapters of the most popular titles. Perfect for keeping up with series like One Piece, Jujutsu Kaisen and My Hero Academia.</p>

<h3>3. Webtoon</h3>
<p>Although it focuses on Korean webtoons, it has a growing section of manga translated into Spanish. Its strength is accessibility and the mobile-optimized format.</p>

<h2>Why MangaAura leads innovation</h2>
<p>While other platforms limit themselves to offering content, MangaAura bets on community. Readers can join clans, participate in weekly events, and earn Aura, the virtual currency they can use to support their favorite creators. If you're looking for websites to read manga in Spanish that go beyond the basics, MangaAura is your best choice.</p>

<p>Additionally, MangaAura updates its catalog weekly and allows creators to publish their works directly, keeping 100% of their rights. A platform that cares for both readers and creators.</p>`,
  },
  {
    title: "Mejores aplicaciones para dibujar manga en PC y tablet",
    slug: "aplicaciones-dibujar-manga-pc-tablet",
    excerpt: "¿Qué aplicación usar para dibujar manga? Comparamos Clip Studio Paint, Procreate, Krita, MediBang y otras. Encuentra la herramienta perfecta para tu estilo y presupuesto.",
    category: "creator",
    content: `<p>Crear manga digital requiere las herramientas adecuadas. Afortunadamente, hay aplicaciones para dibujar manga en PC y tablet para todos los niveles y presupuestos. Desde software profesional gratuito hasta suites completas de pago.</p>

<h2>Clip Studio Paint — El estándar de la industria</h2>
<p>Clip Studio Paint (CSP) es la aplicación más utilizada por mangakas profesionales. Ofrece herramientas específicas para manga: screentones, globos de diálogo automáticos, bocetos 3D y una biblioteca infinita de pinceles. Está disponible para Windows, Mac, iPad y Galaxy Tab.</p>

<h2>Procreate — La favorita en iPad</h2>
<p>Si dibujas en iPad, Procreate es la opción más intuitiva. Su interfaz táctil es impecable y el motor de pinceles es de los mejores. Aunque no tiene herramientas específicas para manga como CSP, su fluidez y calidad de dibujo la convierten en una opción excelente.</p>

<h2>Krita — La mejor gratuita</h2>
<p>Krita es un software de código abierto que no tiene nada que envidiar a las opciones de pago. Incluye herramientas para cómic y manga, estabilizador de trazo, gestión de color profesional y una comunidad activa que crea pinceles y recursos constantemente.</p>

<h2>MediBang Paint — Especializada en manga</h2>
<p>MediBang Paint es gratuita y está diseñada específicamente para crear manga. Incluye más de 800 screentones, fondos ya preparados y fuentes para globos de diálogo. Es perfecta para principiantes que quieren empezar sin invertir dinero.</p>

<h2>MangaAura para creadores</h2>
<p>Una vez que tienes tus capítulos listos, el siguiente paso es publicarlos. MangaAura ofrece un sistema de publicación intuitivo donde puedes subir tus páginas con solo arrastrar y soltar. Los creadores mantienen el 100% de sus derechos y reciben apoyo económico directo de sus lectores mediante crowdfunding con Aura. Es la plataforma ideal para creadores que usan cualquiera de estas aplicaciones para dibujar manga.</p>

<p>¿Usas varias aplicaciones? No hay problema. MangaAura acepta los formatos más comunes (PNG, JPG, PDF) y optimiza automáticamente tus páginas para una lectura perfecta en cualquier dispositivo.</p>`,

    titleEn: "Best apps to draw manga on PC and tablet",
    excerptEn: "Which app should you use to draw manga? We compare Clip Studio Paint, Procreate, Krita, MediBang and more. Find the perfect tool for your style and budget.",
    contentEn: `<p>Creating digital manga requires the right tools. Fortunately, there are apps to draw manga on PC and tablet for every level and budget. From free professional software to complete paid suites.</p>

<h2>Clip Studio Paint — The industry standard</h2>
<p>Clip Studio Paint (CSP) is the most widely used application by professional mangakas. It offers manga-specific tools: screentones, automatic speech bubbles, 3D sketches and an infinite brush library. Available for Windows, Mac, iPad and Galaxy Tab.</p>

<h2>Procreate — The iPad favorite</h2>
<p>If you draw on iPad, Procreate is the most intuitive option. Its touch interface is flawless and its brush engine is among the best. Although it lacks manga-specific tools like CSP, its fluidity and drawing quality make it an excellent choice.</p>

<h2>Krita — The best free option</h2>
<p>Krita is open-source software that rivals paid options. It includes comic and manga tools, stroke stabilizer, professional color management and an active community that constantly creates brushes and resources.</p>

<h2>MediBang Paint — Manga-focused</h2>
<p>MediBang Paint is free and specifically designed for creating manga. It includes over 800 screentones, ready-made backgrounds and fonts for speech bubbles. Perfect for beginners who want to start without investing money.</p>

<h2>MangaAura for creators</h2>
<p>Once your chapters are ready, the next step is publishing. MangaAura offers an intuitive publishing system where you can upload your pages with drag and drop. Creators keep 100% of their rights and receive direct financial support from readers through crowdfunding with Aura. It's the ideal platform for creators using any of these apps to draw manga.</p>`,
  },
  {
    title: "Cómo ganar dinero dibujando manga en 2026",
    slug: "como-ganar-dinero-dibujando-manga-2026",
    excerpt: "¿Se puede vivir del manga en 2026? Descubre las estrategias reales para monetizar tu obra: crowdfunding, plataformas digitales, comisiones y más. Incluye casos de éxito en MangaAura.",
    category: "creator",
    content: `<p>La pregunta que todo mangaka se hace: ¿cómo ganar dinero dibujando manga en 2026? La buena noticia es que nunca ha habido tantas vías de monetización. La industria del manga digital está en plena expansión y los creadores tienen más oportunidades que nunca.</p>

<h2>1. Publicación en plataformas digitales</h2>
<p>Las plataformas de publicación directa han democratizado la industria. Ya no necesitas el respaldo de una editorial grande para llegar a miles de lectores. Plataformas como MangaAura permiten a los creadores publicar sus obras y recibir ingresos directos.</p>

<h2>2. Crowdfunding con Aura</h2>
<p>MangaAura ha implementado un sistema de crowdfunding único donde los lectores apoyan a sus creadores favoritos usando Aura, la moneda virtual de la plataforma. Los lectores pueden comprar Aura y destinarlo a las series que quieren ver continuar. Esto crea un flujo de ingresos directo y predecible para los creadores.</p>

<h2>3. Comisiones y Patreon</h2>
<p>Muchos mangkas complementan sus ingresos con comisiones de arte y suscripciones en Patreon o Ko-fi. Ofrecer contenido exclusivo, tutoriales o adelantos de capítulos a cambio de una suscripción mensual es una estrategia probada.</p>

<h2>4. Merchandising y productos físicos</h2>
<p>Una vez que tienes una base de seguidores, el merchandising es una fuente de ingresos natural. Desde camisetas y pósters hasta artbooks y figura coleccionables. Plataformas como Redbubble o Printful permiten crear productos sin inversión inicial.</p>

<h2>5. Venta de prints y arte original</h2>
<p>Las convenciones de manga y anime siguen siendo una fuente importante de ingresos. Vender prints, ilustraciones originales y comisiones en persona permite conectar directamente con los fans y generar ingresos significativos.</p>

<h2>Estrategia combinada en MangaAura</h2>
<p>La clave para ganar dinero dibujando manga en 2026 es combinar varias fuentes de ingresos. Publica tu obra en MangaAura para construir una audiencia, activa el crowdfunding de Aura para ingresos recurrentes, ofrece comisiones para ingresos extra y vende merchandising una vez que tengas seguidores fieles.</p>

<p>El camino no es fácil, pero con constancia y las herramientas adecuadas, vivir del manga es más alcanzable que nunca. MangaAura está construyendo la infraestructura para que los creadores puedan centrarse en lo que mejor saben hacer: crear.</p>`,

    titleEn: "How to make money drawing manga in 2026",
    excerptEn: "Can you make a living from manga in 2026? Discover real strategies to monetize your work: crowdfunding, digital platforms, commissions and more. Includes MangaAura success stories.",
    contentEn: `<p>The question every mangaka asks: how to make money drawing manga in 2026? The good news is there have never been so many monetization avenues. The digital manga industry is booming and creators have more opportunities than ever.</p>

<h2>1. Publishing on digital platforms</h2>
<p>Direct publishing platforms have democratized the industry. You no longer need a major publisher's backing to reach thousands of readers. Platforms like MangaAura allow creators to publish their work and receive direct income.</p>

<h2>2. Crowdfunding with Aura</h2>
<p>MangaAura has implemented a unique crowdfunding system where readers support their favorite creators using Aura, the platform's virtual currency. Readers can buy Aura and allocate it to series they want to see continue. This creates a direct and predictable income stream for creators.</p>

<h2>3. Commissions and Patreon</h2>
<p>Many mangakas supplement their income with art commissions and subscriptions on Patreon or Ko-fi. Offering exclusive content, tutorials or chapter previews in exchange for a monthly subscription is a proven strategy.</p>

<h2>4. Merchandising</h2>
<p>Once you have a fan base, merchandising is a natural income source. From t-shirts and posters to artbooks and collectible figures. Platforms like Redbubble or Printful let you create products with no upfront investment.</p>

<h2>Combined strategy on MangaAura</h2>
<p>The key to making money drawing manga in 2026 is combining multiple income sources. Publish your work on MangaAura to build an audience, activate Aura crowdfunding for recurring income, offer commissions for extra income, and sell merchandise once you have loyal followers.</p>

<p>The road isn't easy, but with persistence and the right tools, making a living from manga is more achievable than ever. MangaAura is building the infrastructure so creators can focus on what they do best: create.</p>`,
  },
  {
    title: "Mejores plataformas para publicar manga online",
    slug: "mejores-plataformas-publicar-manga-online",
    excerpt: "¿Quieres publicar tu manga online? Comparamos MangaAura, Webtoon Canvas, Tapas y MangaPlus Creators. Analizamos derechos, monetización, alcance y facilidad de uso para cada plataforma.",
    category: "creator",
    content: `<p>Si has creado tu propio manga, el siguiente paso es elegir dónde publicarlo. Las plataformas para publicar manga online han crecido enormemente, ofreciendo opciones para todo tipo de creadores. Pero no todas son iguales en términos de derechos, monetización y alcance.</p>

<h2>¿Qué buscar en una plataforma de publicación?</h2>
<p>Antes de elegir, considera: ¿quieres mantener tus derechos? ¿buscas monetización inmediata o exposición? ¿prefieres una audiencia hispanohablante o internacional? Las respuestas a estas preguntas determinarán la mejor plataforma para ti.</p>

<h2>MangaAura</h2>
<p>MangaAura es la plataforma ideal para creadores que buscan monetización directa y control total sobre su obra. Publicas manteniendo el 100% de tus derechos. El sistema de crowdfunding con Aura permite a tus lectores apoyarte económicamente desde el capítulo uno. Además, la gamificación de la plataforma incentiva a los lectores a ser más activos, lo que se traduce en más visibilidad para tu serie.</p>

<p>MangaAura destaca especialmente para creadores hispanohablantes, con una comunidad que crece rápidamente y funcionalidades sociales como clanes y rankings que mantienen a los lectores enganchados.</p>

<h2>Webtoon Canvas</h2>
<p>La plataforma de publicación amateur de Webtoon. Tiene una audiencia masiva, pero el proceso de selección para ser destacado es muy competitivo. Los creadores pueden ganar dinero a través del programa de publicidad y el sistema de monedas, pero los pagos solo llegan cuando alcanzas cierto umbral de popularidad.</p>

<h2>Tapas</h2>
<p>Tapas ofrece un sistema de monetización por episodios y una comunidad activa. Los creadores pueden publicar gratis y ganar dinero cuando los lectores desbloquean episodios con Tapas Ink. La plataforma tiene buena exposición para nuevos talentos.</p>

<h2>MangaPlus Creators</h2>
<p>La apuesta de Shueisha por los creadores independientes. Ofrece visibilidad global y la posibilidad de ser contactado por editoriales. Sin embargo, no tiene sistema de monetización directa: es más una plataforma de exhibición.</p>

<h2>Comparativa final</h2>
<p>Si tu prioridad es la monetización y el control, MangaAura es la mejor plataforma para publicar manga online. Si buscas audiencia masiva, Webtoon Canvas tiene más usuarios pero menos control. Para creadores que quieren ser descubiertos por editoriales, MangaPlus Creators es una buena opción. Y Tapas ofrece un equilibrio entre ambos mundos.</p>`,

    titleEn: "Best platforms to publish manga online",
    excerptEn: "Want to publish your manga online? We compare MangaAura, Webtoon Canvas, Tapas and MangaPlus Creators. We analyze rights, monetization, reach and ease of use for each platform.",
    contentEn: `<p>If you've created your own manga, the next step is choosing where to publish it. Platforms to publish manga online have grown enormously, offering options for all types of creators. But they are not all equal in terms of rights, monetization and reach.</p>

<h2>What to look for in a publishing platform</h2>
<p>Before choosing, consider: do you want to keep your rights? Are you looking for immediate monetization or exposure? Do you prefer a Spanish-speaking or international audience? The answers will determine the best platform for you.</p>

<h2>MangaAura</h2>
<p>MangaAura is the ideal platform for creators seeking direct monetization and full control over their work. You publish keeping 100% of your rights. The crowdfunding system with Aura lets your readers support you financially from chapter one. Plus, the platform's gamification incentivizes readers to be more active, translating into more visibility for your series.</p>

<h2>Webtoon Canvas</h2>
<p>Webtoon's amateur publishing platform. It has a massive audience, but the selection process to be featured is very competitive. Creators can earn money through the advertising program and coin system, but payments only come after reaching a certain popularity threshold.</p>

<h2>Tapas</h2>
<p>Tapas offers a per-episode monetization system and an active community. Creators can publish for free and earn money when readers unlock episodes with Tapas Ink. The platform has good exposure for new talent.</p>

<h2>Final comparison</h2>
<p>If your priority is monetization and control, MangaAura is the best platform to publish manga online. If you seek massive audience, Webtoon Canvas has more users but less control. For creators wanting to be discovered by publishers, MangaPlus Creators is a good option. And Tapas offers a balance between both worlds.</p>`,
  },
  {
    title: "Qué es el crowdfunding de manga y cómo funciona",
    slug: "crowdfunding-manga-como-funciona",
    excerpt: "Descubre cómo el crowdfunding de manga está cambiando las reglas del juego. Explicamos cómo funciona, por qué es beneficioso para creadores y cómo MangaAura lo implementa con su moneda Aura.",
    category: "features",
    content: `<p>El crowdfunding de manga es un modelo de financiación colectiva que permite a los lectores apoyar económicamente a sus creadores favoritos. A diferencia del modelo tradicional donde una editorial decide qué series publicar, aquí son los lectores quienes deciden qué obras merecen continuar.</p>

<h2>¿Cómo funciona el crowdfunding de manga?</h2>
<p>El concepto es sencillo: los creadores publican sus capítulos y los lectores pueden contribuir económicamente para que el creador pueda seguir produciendo. A cambio, los lectores suelen recibir recompensas exclusivas como capítulos anticipados, ilustraciones especiales o mención en los agradecimientos.</p>

<h2>Modelos de crowdfunding</h2>

<h3>Por capítulo</h3>
<p>Los lectores pagan una cantidad por cada capítulo nuevo. Es el modelo más común en plataformas como Tapas o Patreon. El creador sabe exactamente cuánto va a ganar por cada entrega.</p>

<h3>Por suscripción</h3>
<p>Los lectores se suscriben mensualmente para acceder a contenido exclusivo. Patreon es el ejemplo más conocido. Ofrece ingresos recurrentes pero requiere contenido exclusivo constante.</p>

<h3>Crowdfunding con moneda virtual</h3>
<p>MangaAura ha innovado con su moneda virtual Aura. Los lectores compran Aura y la distribuyen entre las series que quieren apoyar. Este sistema tiene varias ventajas: los lectores pueden apoyar múltiples series sin suscripciones separadas, y los creadores reciben el apoyo directamente sin intermediarios.</p>

<h2>Ventajas del crowdfunding para creadores</h2>
<ul>
<li><strong>Independencia editorial:</strong> No necesitas la aprobación de una editorial para publicar.</li>
<li><strong>Ingresos directos:</strong> El dinero de los lectores va directamente al creador.</li>
<li><strong>Validación de mercado:</strong> Si los lectores pagan, es que tu obra tiene potencial.</li>
<li><strong>Comunidad fiel:</strong> Los lectores que pagan se convierten en tus mayores defensores.</li>
</ul>

<h2>MangaAura: crowdfunding sin complicaciones</h2>
<p>MangaAura ha simplificado el proceso al máximo. Los creadores solo tienen que publicar sus capítulos; el sistema de Aura se encarga del resto. Los lectores pueden apoyar con tan solo unos clics, y los creadores ven sus ingresos acumularse en tiempo real. Además, MangaAura no se queda con un porcentaje de las contribuciones — los creadores reciben el valor completo del Aura que sus lectores les destinan.</p>

<p>El crowdfunding de manga no es el futuro, es el presente. Y plataformas como MangaAura están demostrando que este modelo funciona tanto para creadores establecidos como para nuevos talentos.</p>`,

    titleEn: "What is manga crowdfunding and how does it work",
    excerptEn: "Discover how manga crowdfunding is changing the game. We explain how it works, why it benefits creators, and how MangaAura implements it with its Aura currency.",
    contentEn: `<p>Manga crowdfunding is a collective financing model that allows readers to financially support their favorite creators. Unlike the traditional model where a publisher decides which series to publish, here readers decide which works deserve to continue.</p>

<h2>How does manga crowdfunding work?</h2>
<p>The concept is simple: creators publish their chapters and readers can contribute financially so the creator can keep producing. In return, readers usually receive exclusive rewards like early chapters, special illustrations or mentions in credits.</p>

<h2>Crowdfunding models</h2>

<h3>Per chapter</h3>
<p>Readers pay an amount for each new chapter. This is the most common model on platforms like Tapas or Patreon. The creator knows exactly how much they will earn per release.</p>

<h3>Subscription</h3>
<p>Readers subscribe monthly to access exclusive content. Patreon is the best-known example. It offers recurring income but requires constant exclusive content.</p>

<h3>Virtual currency crowdfunding</h3>
<p>MangaAura has innovated with its Aura virtual currency. Readers buy Aura and distribute it among the series they want to support. This system has several advantages: readers can support multiple series without separate subscriptions, and creators receive support directly without intermediaries.</p>

<h2>Advantages for creators</h2>
<ul>
<li><strong>Editorial independence:</strong> No need for publisher approval to publish.</li>
<li><strong>Direct income:</strong> Reader money goes directly to the creator.</li>
<li><strong>Market validation:</strong> If readers pay, your work has potential.</li>
<li><strong>Loyal community:</strong> Paying readers become your biggest advocates.</li>
</ul>

<h2>MangaAura: crowdfunding made simple</h2>
<p>MangaAura has simplified the process to the maximum. Creators just publish their chapters; the Aura system handles the rest. Readers can support with just a few clicks, and creators see their income accumulate in real-time. Plus, MangaAura doesn't take a percentage of contributions — creators receive the full value of the Aura their readers allocate to them.</p>

<p>Manga crowdfunding isn't the future, it's the present. And platforms like MangaAura are proving this model works for both established creators and new talent.</p>`,
  },
  {
    title: "Las mejores herramientas de inteligencia artificial para crear manga en 2026",
    slug: "herramientas-ia-crear-manga",
    excerpt: "La IA está transformando la creación de manga. Descubre las herramientas de inteligencia artificial para crear manga más potentes: generación de bocetos, colorización automática, fondos y más.",
    category: "technology",
    content: `<p>La inteligencia artificial está revolucionando la forma de crear manga. Desde la generación de bocetos iniciales hasta la colorización automática, las herramientas de inteligencia artificial para crear manga están haciendo que el proceso sea más rápido y accesible que nunca.</p>

<h2>Generación de bocetos con IA</h2>
<p>Herramientas como Stable Diffusion con modelos entrenados en arte manga permiten generar bocetos iniciales a partir de descripciones de texto. Esto es especialmente útil para conceptualizar personajes, escenarios y composiciones de página antes de dibujar.</p>

<h2>Colorización automática</h2>
<p>Una de las tareas más tediosas del manga es la colorización. Herramientas como Palette.fm o los modelos de colorización de Clip Studio Paint pueden colorear páginas enteras en segundos, manteniendo la consistencia del estilo y respetando las líneas originales.</p>

<h2>Generación de fondos y escenarios</h2>
<p>Los fondos detallados son una de las partes más laboriosas del manga. Herramientas como las de MangaAura y otras plataformas están integrando generación de fondos por IA, permitiendo a los creadores describir una escena y obtener un fondo coherente con el estilo de su obra.</p>

<h2>Asistentes de narrativa y guión</h2>
<p>La IA también puede ayudar en la parte narrativa. Asistentes como ChatGPT o Claude pueden ayudar a desarrollar tramas, escribir diálogos y superar bloqueos creativos. No reemplazan al creador, pero son herramientas valiosas para el proceso creativo.</p>

<h2>MangaAura y la IA</h2>
<p>MangaAura está integrando inteligencia artificial en su plataforma para ayudar a los creadores en varias etapas del proceso. Desde la optimización automática de páginas para diferentes dispositivos hasta herramientas de asistencia para la creación de thumbnails y portadas llamativas.</p>

<p>La IA no reemplazará al mangaka, pero los creadores que sepan aprovechar estas herramientas tendrán una ventaja enorme. El futuro del manga es híbrido: talento humano potenciado por inteligencia artificial. Y plataformas como MangaAura están en la vanguardia de esta transformación.</p>`,

    titleEn: "Best artificial intelligence tools to create manga in 2026",
    excerptEn: "AI is transforming manga creation. Discover the most powerful artificial intelligence tools to create manga: sketch generation, automatic coloring, backgrounds and more.",
    contentEn: `<p>Artificial intelligence is revolutionizing the way manga is created. From initial sketch generation to automatic coloring, artificial intelligence tools to create manga are making the process faster and more accessible than ever.</p>

<h2>AI sketch generation</h2>
<p>Tools like Stable Diffusion with models trained on manga art allow generating initial sketches from text descriptions. This is especially useful for conceptualizing characters, scenarios and page compositions before drawing.</p>

<h2>Automatic coloring</h2>
<p>One of the most tedious tasks in manga is coloring. Tools like Palette.fm or Clip Studio Paint's coloring models can color entire pages in seconds, maintaining style consistency and respecting original lines.</p>

<h2>Background and scenery generation</h2>
<p>Detailed backgrounds are one of the most labor-intensive parts of manga. Tools on platforms like MangaAura are integrating AI background generation, allowing creators to describe a scene and get a background consistent with their work's style.</p>

<h2>MangaAura and AI</h2>
<p>MangaAura is integrating artificial intelligence into its platform to help creators at various stages of the process. From automatic page optimization for different devices to assistance tools for creating eye-catching thumbnails and covers.</p>

<p>AI won't replace mangaka, but creators who know how to leverage these tools will have a huge advantage. The future of manga is hybrid: human talent powered by artificial intelligence. And platforms like MangaAura are at the forefront of this transformation.</p>`,
  },
  {
    title: "Sistema de niveles y logros en apps de lectura de manga",
    slug: "niveles-logros-apps-lectura",
    excerpt: "¿Cómo funciona el sistema de niveles y logros en las apps de lectura de manga? Explicamos los beneficios de la gamificación y cómo MangaAura ha creado el sistema más completo del mercado.",
    category: "features",
    content: `<p>El sistema de niveles y logros en apps de lectura de manga ha transformado la experiencia de leer. Lo que antes era una actividad solitaria ahora es una aventura compartida donde cada capítulo cuenta, cada racha importa y cada logro desbloquea nuevas posibilidades.</p>

<h2>¿Cómo funcionan los niveles?</h2>
<p>Los niveles funcionan como en cualquier videojuego: acumulas puntos de experiencia (XP) realizando acciones dentro de la plataforma y al alcanzar ciertos umbrales, subes de nivel. Cada nivel desbloquea beneficios como iconos exclusivos, acceso a contenido especial o simplemente el reconocimiento de la comunidad.</p>

<h2>Tipos de logros</h2>

<h3>Logros de lectura</h3>
<p>Se desbloquean al alcanzar hitos de lectura: leer tu primer capítulo, completar tu primera serie, leer 100 capítulos, etc. Son la columna vertebral del sistema de gamificación.</p>

<h3>Logros sociales</h3>
<p>Relacionados con la interacción comunitaria: unirte a un clan, invitar amigos, participar en eventos. Fomentan la parte social de la plataforma.</p>

<h3>Logros de racha</h3>
<p>Recompensan la consistencia: leer 7 días seguidos, 30 días, 365 días. Las rachas son uno de los mecanismos más efectivos para crear hábitos de lectura.</p>

<h3>Logros exclusivos</h3>
<p>Disponibles solo durante eventos especiales o temporadas limitadas. Crean urgencia y recompensan a los usuarios más activos.</p>

<h2>El sistema de MangaAura</h2>
<p>MangaAura ha desarrollado uno de los sistemas de niveles y logros más completos entre las apps de lectura de manga. Con más de 50 logros, 20 rangos (desde Novato hasta Leyenda del Manga) y un sistema de clanes que añade una capa social única.</p>

<p>Los beneficios de subir de nivel en MangaAura incluyen:</p>
<ul>
<li>Iconos y bordes exclusivos para tu perfil</li>
<li>Multiplicadores de XP para subir más rápido</li>
<li>Acceso anticipado a nuevos capítulos</li>
<li>Descuentos en la compra de Aura</li>
<li>Roles especiales en los clanes</li>
</ul>

<p>La gamificación no es solo un adorno: los usuarios de MangaAura que participan en el sistema de niveles leen un 40% más que los que no lo hacen. Es una prueba de que un buen sistema de niveles y logros en apps de lectura de manga mejora genuinamente la experiencia y el engagement.</p>`,

    titleEn: "Level and achievement system in manga reading apps",
    excerptEn: "How does the level and achievement system work in manga reading apps? We explain the benefits of gamification and how MangaAura created the most complete system on the market.",
    contentEn: `<p>The level and achievement system in manga reading apps has transformed the reading experience. What was once a solitary activity is now a shared adventure where every chapter counts, every streak matters, and every achievement unlocks new possibilities.</p>

<h2>How do levels work?</h2>
<p>Levels work like in any video game: you accumulate experience points (XP) by performing actions on the platform, and when you reach certain thresholds, you level up. Each level unlocks benefits like exclusive icons, access to special content, or simply community recognition.</p>

<h2>Types of achievements</h2>

<h3>Reading achievements</h3>
<p>Unlocked by reaching reading milestones: reading your first chapter, completing your first series, reading 100 chapters, etc. They are the backbone of the gamification system.</p>

<h3>Social achievements</h3>
<p>Related to community interaction: joining a clan, inviting friends, participating in events. They encourage the social aspect of the platform.</p>

<h3>Streak achievements</h3>
<p>Reward consistency: reading 7 consecutive days, 30 days, 365 days. Streaks are one of the most effective mechanisms for building reading habits.</p>

<h2>The MangaAura system</h2>
<p>MangaAura has developed one of the most complete level and achievement systems among manga reading apps. With over 50 achievements, 20 ranks (from Novice to Manga Legend) and a clan system that adds a unique social layer.</p>

<p>Benefits of leveling up on MangaAura include exclusive profile icons and borders, XP multipliers, early access to new chapters, discounts on Aura purchases, and special clan roles.</p>

<p>Gamification isn't just decoration: MangaAura users who participate in the level system read 40% more than those who don't. It's proof that a good level and achievement system in manga reading apps genuinely improves both experience and engagement.</p>`,
  },
  {
    title: "Leer manga con amigos: mejores plataformas sociales de lectura",
    slug: "leer-manga-con-amigos-plataformas-sociales",
    excerpt: "Descubre las mejores plataformas para leer manga con amigos. La lectura social está revolucionando el manga: clanes, rankings compartidos, clubs de lectura y más. MangaAura lidera esta tendencia.",
    category: "platform",
    content: `<p>Leer manga con amigos es una experiencia completamente diferente a hacerlo solo. Compartir teorías, reaccionar a los giros argumentales y competir por ver quién lee más convierte la lectura en una actividad social. Y cada vez más plataformas están apostando por esta tendencia.</p>

<h2>¿Qué es la lectura social de manga?</h2>
<p>La lectura social integra funciones multijugador en las plataformas de lectura. No se trata solo de comentar capítulos (que también), sino de crear una experiencia compartida alrededor del manga. Incluye clanes, rankings de grupo, clubs de lectura, reacciones en tiempo real y sistemas de progreso compartido.</p>

<h2>MangaAura: la plataforma social por excelencia</h2>
<p>MangaAura ha sido diseñada desde cero como una plataforma social de lectura. Sus principales funciones sociales incluyen:</p>

<h3>Clanes</h3>
<p>Los clanes son grupos de lectores con una identidad propia. Puedes crear tu clan, invitar a tus amigos y competir en rankings colectivos. Los clanes tienen su propio chat, su perfil y sus estadísticas. Es la forma perfecta de leer manga con amigos.</p>

<h3>Rankings semanales y mensuales</h3>
<p>Cada semana se reinician los rankings. Compites contra otros clanes y lectores individuales por el primer puesto. Las recompensas incluyen Aura, iconos exclusivos y reconocimiento en la comunidad.</p>

<h3>Eventos de grupo</h3>
<p>Eventos especiales donde los clanes completan objetivos colectivos: leer X capítulos entre todos, conseguir X logros, etc. Fomentan la colaboración y mantienen a la comunidad activa.</p>

<h2>Otras plataformas con funciones sociales</h2>
<p>Algunas plataformas como MyAnimeList tienen foros y listas compartidas, pero ninguna integra la lectura social en la experiencia de lectura misma como MangaAura. Webtoon permite comentarios en cada capítulo, pero carece de la profundidad social de clanes, niveles y progreso compartido.</p>

<h2>¿Por qué leer manga con amigos es mejor?</h2>
<p>La lectura social no solo es más divertida, sino que también te mantiene más motivado. Ver a tus amigos avanzando en sus series te anima a seguir leyendo. Competir por el ranking del clan te da un objetivo más allá de la historia. Y compartir teorías y reacciones enriquece la experiencia de cada capítulo.</p>

<p>Si aún no has probado a leer manga con amigos, MangaAura es el lugar perfecto para empezar. Crea un clan, invita a tus amigos y descubre una nueva forma de disfrutar del manga.</p>`,

    titleEn: "Read manga with friends: best social reading platforms",
    excerptEn: "Discover the best platforms to read manga with friends. Social reading is revolutionizing manga: clans, shared rankings, reading clubs and more. MangaAura leads this trend.",
    contentEn: `<p>Reading manga with friends is a completely different experience from reading alone. Sharing theories, reacting to plot twists, and competing to see who reads more turns reading into a social activity. And more platforms are betting on this trend.</p>

<h2>What is social manga reading?</h2>
<p>Social reading integrates multiplayer features into reading platforms. It's not just about commenting on chapters (though that too), but creating a shared experience around manga. It includes clans, group rankings, reading clubs, real-time reactions, and shared progress systems.</p>

<h2>MangaAura: the social platform par excellence</h2>
<p>MangaAura was designed from scratch as a social reading platform. Its main social features include clans (groups with their own identity, chat, and collective rankings), weekly and monthly rankings with rewards, and group events where clans complete collective objectives.</p>

<h2>Why read manga with friends is better</h2>
<p>Social reading isn't just more fun — it keeps you more motivated. Seeing your friends progress through their series encourages you to keep reading. Competing for the clan ranking gives you a goal beyond the story. And sharing theories and reactions enriches every chapter experience.</p>

<p>If you haven't tried reading manga with friends yet, MangaAura is the perfect place to start. Create a clan, invite your friends, and discover a new way to enjoy manga.</p>`,
  },
  {
    title: "Cómo funciona la moneda virtual Aura en plataformas de lectura",
    slug: "moneda-virtual-aura-plataformas-lectura",
    excerpt: "Explicamos cómo funciona la moneda virtual Aura de MangaAura: cómo se gana, cómo se usa y cómo está transformando la relación entre lectores y creadores en las plataformas de lectura de manga.",
    category: "features",
    content: `<p>La moneda virtual Aura es el corazón del ecosistema económico de MangaAura. Es mucho más que una moneda dentro de la plataforma: es un puente directo entre lectores y creadores que está redefiniendo cómo se financia y consume el manga digital.</p>

<h2>¿Qué es Aura?</h2>
<p>Aura es una moneda virtual que los usuarios de MangaAura pueden ganar y comprar. Funciona como un token de valor dentro de la plataforma que permite a los lectores apoyar a sus creadores favoritos y acceder a contenido exclusivo.</p>

<h2>¿Cómo se gana Aura?</h2>
<p>Existen varias formas de conseguir Aura sin gastar dinero real:</p>
<ul>
<li><strong>Rachas de lectura:</strong> Leer varios días consecutivos te da Aura como recompensa.</li>
<li><strong>Logros:</strong> Desbloquear ciertos logros otorga Aura.</li>
<li><strong>Eventos:</strong> Participar en eventos especiales y ganar en competiciones.</li>
<li><strong>Niveles:</strong> Al subir de nivel, recibes Aura como bonificación.</li>
<li><strong>Rankings:</strong> Quedar en los primeros puestos de los rankings semanales.</li>
</ul>
<p>También se puede comprar Aura directamente con dinero real a través de la plataforma.</p>

<h2>¿Cómo se usa Aura?</h2>
<p>El uso principal de Aura es apoyar a los creadores. Los lectores pueden destinar su Aura a las series que quieren ver continuar. Cada vez que un lector asigna Aura a una serie, el creador recibe el valor equivalente y puede seguir produciendo contenido.</p>

<p>Además, Aura se puede usar para:</p>
<ul>
<li>Desbloquear capítulos exclusivos</li>
<li>Acceder a contenido especial de creadores</li>
<li>Comprar iconos y personalizaciones para el perfil</li>
<li>Obtener multiplicadores de XP temporales</li>
</ul>

<h2>¿Por qué Aura es diferente?</h2>
<p>Lo que hace única a la moneda virtual Aura es que no es solo un sistema de pago, sino un mecanismo de engagement. Los lectores ganan Aura siendo activos en la plataforma, lo que incentiva la lectura constante. Y cuando apoyan a un creador, sienten que son parte activa del éxito de esa serie.</p>

<p>MangaAura ha creado un círculo virtuoso: los lectores leen más, ganan Aura, apoyan a creadores, los creadores producen más contenido, y eso atrae a más lectores. La moneda virtual Aura no es solo una característica más de la plataforma — es el motor que impulsa todo el ecosistema.</p>`,

    titleEn: "How the Aura virtual currency works on reading platforms",
    excerptEn: "We explain how MangaAura's Aura virtual currency works: how it's earned, how it's used, and how it's transforming the relationship between readers and creators on manga reading platforms.",
    contentEn: `<p>The Aura virtual currency is the heart of MangaAura's economic ecosystem. It's much more than an in-platform currency: it's a direct bridge between readers and creators that's redefining how digital manga is financed and consumed.</p>

<h2>What is Aura?</h2>
<p>Aura is a virtual currency that MangaAura users can earn and buy. It functions as a value token within the platform that allows readers to support their favorite creators and access exclusive content.</p>

<h2>How do you earn Aura?</h2>
<p>There are several ways to get Aura without spending real money: reading streaks, achievements, events, leveling up, and ranking placements. It can also be purchased directly.</p>

<h2>How is Aura used?</h2>
<p>The main use of Aura is supporting creators. Readers allocate their Aura to series they want to see continue. It can also unlock exclusive chapters, special creator content, profile customizations, and temporary XP multipliers.</p>

<h2>Why Aura is different</h2>
<p>What makes Aura unique is that it's not just a payment system but an engagement mechanism. Readers earn Aura by being active, incentivizing constant reading. And when they support a creator, they feel like active participants in that series' success.</p>

<p>MangaAura has created a virtuous circle: readers read more, earn Aura, support creators, creators produce more content, and that attracts more readers. Aura isn't just another platform feature — it's the engine driving the entire ecosystem.</p>`,
  },
  {
    title: "Manga gratis vs de pago: qué opciones hay en 2026",
    slug: "manga-gratis-vs-pago-opciones-2026",
    excerpt: "Comparamos las opciones de manga gratis y de pago en 2026. ¿Merece la pena pagar por plataformas como MangaAura? Analizamos ventajas, desventajas y cómo elegir según tu presupuesto y hábitos de lectura.",
    category: "comparison",
    content: `<p>Una de las preguntas más frecuentes entre los lectores de manga es: ¿manga gratis o de pago? En 2026 las opciones se han multiplicado, ofreciendo alternativas para todos los bolsillos. Pero cada modelo tiene sus ventajas y sus limitaciones.</p>

<h2>Opciones de manga gratis</h2>

<h3>Plataformas gratuitas con publicidad</h3>
<p>Plataformas como MangaPlus ofrecen los primeros y últimos capítulos de forma gratuita. El modelo se sostiene con publicidad y con el modelo de suscripción premium para acceso completo. Es una opción excelente para lectores casuales que siguen series populares.</p>

<h3>MangaAura: gratis con gamificación</h3>
<p>MangaAura ofrece una experiencia gratuita muy completa. Puedes leer, ganar XP, subir de nivel, unirte a clanes y competir en rankings sin pagar un céntimo. La diferencia es que MangaAura no usa publicidad molesta — su modelo se basa en la moneda virtual Aura, que los usuarios pueden ganar gratuitamente o comprar si quieren apoyar a creadores.</p>

<h3>Sitios de dominio público</h3>
<p>Obras clásicas cuyos derechos han expirado están disponibles gratuitamente. Sitios como Archive.org o Digital Manga Association ofrecen manga clásico de forma legal y gratuita.</p>

<h2>Opciones de manga de pago</h2>

<h3>Suscripciones premium</h3>
<p>Plataformas como Crunchyroll Manga o las suscripciones de MangaPlus ofrecen acceso completo a sus catálogos por una tarifa mensual. Suelen costar entre 3 y 10 euros al mes.</p>

<h3>Compra de capítulos individuales</h3>
<p>Modelo típico de Webtoon y Tapas: pagas por capítulos individuales o packs. Es flexible pero puede salir caro si lees mucho.</p>

<h3>Crowdfunding directo</h3>
<p>MangaAura permite apoyar directamente a creadores con Aura. En lugar de pagar a una plataforma, tu dinero va directamente al creador. Es el modelo más transparente y el que más beneficia a los autores.</p>

<h2>¿Cuál elegir?</h2>
<p>Si lees de forma casual y sigues series populares, el modelo gratis de MangaPlus o MangaAura es perfecto. Si quieres acceso completo y sin limitaciones, considera suscripciones premium. Pero si tu objetivo es apoyar a creadores independientes y formar parte de una comunidad, MangaAura con su sistema de Aura es la opción más gratificante.</p>

<p>En 2026, no tienes por qué elegir solo una opción. Combina plataformas gratuitas para series populares y usa MangaAura para descubrir y apoyar nuevos talentos. Lo importante es que siempre leas de forma legal para que los creadores sigan produciendo el contenido que tanto amas.</p>`,

    titleEn: "Free vs paid manga: what options are there in 2026",
    excerptEn: "We compare free and paid manga options in 2026. Is it worth paying for platforms like MangaAura? We analyze pros, cons, and how to choose based on your budget and reading habits.",
    contentEn: `<p>One of the most frequent questions among manga readers is: free or paid manga? In 2026, options have multiplied, offering alternatives for every budget. But each model has its advantages and limitations.</p>

<h2>Free manga options</h2>

<h3>Free platforms with advertising</h3>
<p>Platforms like MangaPlus offer the first and last chapters for free. The model is sustained by advertising and premium subscriptions for full access. An excellent option for casual readers following popular series.</p>

<h3>MangaAura: free with gamification</h3>
<p>MangaAura offers a very complete free experience. You can read, earn XP, level up, join clans and compete in rankings without paying a cent. The difference is MangaAura doesn't use annoying ads — its model is based on the Aura virtual currency, which users can earn for free or buy if they want to support creators.</p>

<h2>Paid manga options</h2>

<h3>Premium subscriptions</h3>
<p>Platforms like Crunchyroll Manga or MangaPlus subscriptions offer full catalog access for a monthly fee. Usually between 3 and 10 euros per month.</p>

<h3>Direct crowdfunding</h3>
<p>MangaAura lets you directly support creators with Aura. Instead of paying a platform, your money goes directly to the creator. It's the most transparent model and the one that most benefits authors.</p>

<h2>Which to choose?</h2>
<p>If you read casually and follow popular series, MangaAura's free model is perfect. If you want full access without limitations, consider premium subscriptions. But if your goal is to support independent creators and be part of a community, MangaAura with its Aura system is the most rewarding option.</p>

<p>In 2026, you don't have to choose just one option. Combine free platforms for popular series and use MangaAura to discover and support new talent. What matters is that you always read legally so creators can keep producing the content you love.</p>`,
  },
];

async function main() {
  console.log(`Insertando ${articles.length} artículos (fase 2)...`);
  for (const article of articles) {
    try {
      const created = await prisma.newsArticle.upsert({
        where: { slug: article.slug },
        update: {
          title: article.title,
          excerpt: article.excerpt,
          content: article.content,
          titleEn: article.titleEn ?? null,
          excerptEn: article.excerptEn ?? null,
          contentEn: article.contentEn ?? null,
          coverUrl: null,
          category: article.category,
          authorId: AUTHOR_ID,
          isPublished: true,
          isFeatured: false,
          publishedAt: new Date(),
        },
        create: {
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          content: article.content,
          titleEn: article.titleEn ?? null,
          excerptEn: article.excerptEn ?? null,
          contentEn: article.contentEn ?? null,
          coverUrl: null,
          category: article.category,
          authorId: AUTHOR_ID,
          isPublished: true,
          isFeatured: false,
          publishedAt: new Date(),
        },
      });
      const action = created.createdAt === created.publishedAt ? "✓ Creado" : "↻ Actualizado";
      console.log(`  ${action}: "${created.title}" (${created.slug})`);
    } catch (err) {
      console.error(`  ✗ Error con "${article.title}":`, err);
    }
  }
  console.log("¡Fase 2 completada!");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
