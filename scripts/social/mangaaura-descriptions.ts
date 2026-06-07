interface DirectoryListing {
  tier: string;
  name: string;
  url: string;
  dr: number;
  tagline: string;
  shortDescription: string;
  longDescription: string;
  categoryTags: string[];
  notes: string;
}

export const DIRECTORY_LISTINGS: DirectoryListing[] = [
  // ── Tier 1: Launch ──────────────────────────────────────────────────
  {
    tier: "launch",
    name: "Product Hunt",
    url: "https://producthunt.com",
    dr: 92,
    tagline: "MangaAura usa IA para ayudarte a crear mangas, traducir capítulos y descubrir nueva lectura",
    shortDescription:
      "Plataforma de manga con IA para crear, traducir y leer. Sube tus obras, usa herramientas de IA para generar capítulos, y crowdfundea tu proyecto.",
    longDescription:
      "MangaAura es una plataforma impulsada por inteligencia artificial donde puedes leer manga online, crear tus propias historias con ayuda de IA, traducir capítulos automáticamente, y financiar tu proyecto mediante crowdfunding. Con funciones de gamificación como XP, niveles, logros, clanes y una moneda virtual (Aura), la comunidad de lectores y creadores crece día a día.",
    categoryTags: ["artificial-intelligence", "manga", "comics", "crowdfunding", "reading"],
    notes: "Prep 5 screenshots + 1 GIF demo. Hunt yourself or find a hunter. Launch at 00:01 PST.",
  },
  {
    tier: "launch",
    name: "BetaList",
    url: "https://betalist.com",
    dr: 82,
    tagline: "MangaAura usa IA para ayudarte a crear mangas, traducir capítulos y descubrir nueva lectura",
    shortDescription:
      "Lee, crea y crowdfundea manga con herramientas de IA. Gamificación con XP, clanes y moneda virtual.",
    longDescription:
      "MangaAura combina lectura de manga online, herramientas de inteligencia artificial para creadores, crowdfunding para proyectos independientes y un sistema de gamificación completo. Los lectores ganan experiencia, suben de nivel y participan en la comunidad mientras descubren nuevas series. Los creadores publican sus obras y reciben financiación directa de sus seguidores.",
    categoryTags: ["ai", "manga", "crowdfunding", "community", "reading"],
    notes: "Approval usually takes 1-3 days. Submit right after Product Hunt launch.",
  },
  {
    tier: "launch",
    name: "Fazier",
    url: "https://fazier.com",
    dr: 54,
    tagline: "MangaAura usa IA para ayudarte a crear mangas, traducir capítulos y descubrir nueva lectura",
    shortDescription:
      "Plataforma todo-en-uno para leer manga, crear con IA y crowdfundear proyectos.",
    longDescription:
      "MangaAura es el punto de encuentro para lectores y creadores de manga. Ofrece lectura gratuita, herramientas de inteligencia artificial para la creación y traducción de capítulos, crowdfunding para proyectos independientes, y un sistema de gamificación completo con XP, niveles, clanes, logros y moneda virtual Aura.",
    categoryTags: ["manga", "ai", "crowdfunding", "reading"],
    notes: "Quick approval. Good for early backlinks.",
  },
  {
    tier: "launch",
    name: "Uneed",
    url: "https://uneed.best",
    dr: 65,
    tagline: "MangaAura usa IA para ayudarte a crear mangas, traducir capítulos y descubrir nueva lectura",
    shortDescription:
      "Lee manga gratis, crea con IA y crowdfundea tu proyecto. Comunidad activa y gamificada.",
    longDescription:
      "MangaAura es una plataforma social de manga donde puedes descubrir nuevas lecturas, crear tus propias historias con herramientas de IA, traducir capítulos automáticamente y financiar proyectos mediante crowdfunding. Todo potenciado por un sistema de gamificación: XP, niveles, clanes y la moneda virtual Aura.",
    categoryTags: ["ai-tools", "manga", "community", "crowdfunding"],
    notes: "Curated directory. Approval may take a bit longer.",
  },
  {
    tier: "launch",
    name: "Microlaunch",
    url: "https://microlaunch.net",
    dr: 58,
    tagline: "MangaAura es la plataforma que gamifica la lectura de manga con XP, logros y crowdfunding",
    shortDescription:
      "Plataforma social de manga con gamificación, IA para creadores y crowdfunding comunitario.",
    longDescription:
      "MangaAura transforma la lectura de manga en una experiencia social y gamificada. Ganas XP, subes de nivel, formas parte de clanes y participas en el crowdfunding de nuevos proyectos. Los creadores publican sus obras y usan herramientas de IA para acelerar su trabajo.",
    categoryTags: ["indie", "manga", "crowdfunding", "gamification"],
    notes: "Very indie-friendly. Quick listing.",
  },
  {
    tier: "launch",
    name: "DevHunt",
    url: "https://devhunt.com",
    dr: 52,
    tagline: "MangaAura usa IA para ayudarte a crear mangas, traducir capítulos y descubrir nueva lectura",
    shortDescription:
      "Open-source friendly plataforma de manga con IA, gamificación y crowdfunding para creadores independientes.",
    longDescription:
      "MangaAura es una plataforma construida para la comunidad manga: lectura gratuita, herramientas de IA para creadores, crowdfunding para proyectos independientes y un sistema de gamificación con XP, niveles, clanes y moneda virtual. Ideal para desarrolladores y creadores que quieren llevar sus proyectos al siguiente nivel.",
    categoryTags: ["ai", "developer-tools", "manga", "open-source"],
    notes: "Good for tech audience. Highlight AI + dev-friendly aspects.",
  },

  // ── Tier 3: AI ──────────────────────────────────────────────────────
  {
    tier: "ai",
    name: "TAAFT",
    url: "https://theresanaiforthat.com",
    dr: 78,
    tagline: "MangaAura usa IA para ayudarte a crear mangas, traducir capítulos y descubrir nueva lectura",
    shortDescription:
      "Plataforma de manga con IA para crear, traducir y leer. Crowdfunding y gamificación incluidos.",
    longDescription:
      "MangaAura integra inteligencia artificial en cada aspecto del mundo manga: generación de capítulos, traducción automática entre idiomas, recomendaciones personalizadas y herramientas para creadores. Todo combinado con una experiencia social gamificada con XP, niveles, clanes y crowdfunding. Es la plataforma más completa para la comunidad manga hispanohablante.",
    categoryTags: ["ai-content-creation", "ai-writing", "ai-translation", "ai-recommendation"],
    notes: "High DR. Focus on all AI features: creation, translation, recommendations.",
  },
  {
    tier: "ai",
    name: "Futurepedia",
    url: "https://futurepedia.io",
    dr: 67,
    tagline: "MangaAura usa IA para ayudarte a crear mangas, traducir capítulos y descubrir nueva lectura",
    shortDescription:
      "Crea mangas con IA, traduce capítulos automáticamente y descubre nuevas lecturas con recomendaciones inteligentes.",
    longDescription:
      "MangaAura aprovecha la inteligencia artificial para democratizar la creación de manga. Los creadores pueden generar paneles y capítulos con asistencia de IA, traducir sus obras a múltiples idiomas automáticamente, y llegar a una audiencia global. Los lectores disfrutan de recomendaciones personalizadas y una experiencia gamificada con XP, logros y clanes.",
    categoryTags: ["ai-content", "ai-translation", "ai-art", "content-creation"],
    notes: "Popular AI directory. Approval usually quick.",
  },
  {
    tier: "ai",
    name: "Toolify",
    url: "https://toolify.ai",
    dr: 49,
    tagline: "MangaAura usa IA para ayudarte a crear mangas, traducir capítulos y descubrir nueva lectura",
    shortDescription:
      "Herramientas de IA para creadores de manga: generación, traducción y recomendación inteligente.",
    longDescription:
      "MangaAura ofrece un conjunto de herramientas de IA diseñadas específicamente para el mundo del manga: generación asistida de capítulos, traducción automática, recomendaciones personalizadas y análisis de tendencias. Todo dentro de una plataforma social con gamificación y crowdfunding.",
    categoryTags: ["ai-writing", "ai-image", "ai-translator", "ai-content"],
    notes: "Good DR. Focus on the AI tool aspect.",
  },
  {
    tier: "ai",
    name: "Future Tools",
    url: "https://futuretools.io",
    dr: 59,
    tagline: "MangaAura usa IA para ayudarte a crear mangas, traducir capítulos y descubrir nueva lectura",
    shortDescription:
      "Crea y traduce manga con IA. Plataforma todo-en-uno para la comunidad manga.",
    longDescription:
      "MangaAura es una plataforma impulsada por IA que permite a cualquier persona crear su propio manga, traducir capítulos a otros idiomas y descubrir nuevas series gracias a recomendaciones inteligentes. Además cuenta con crowdfunding comunitario y un sistema de gamificación con XP, niveles y clanes.",
    categoryTags: ["ai-writing", "ai-image-generation", "ai-translation", "community"],
    notes: "Established directory. Highlight AI creation + translation features.",
  },
  {
    tier: "ai",
    name: "AI Stage",
    url: "https://aistage.com",
    dr: 45,
    tagline: "MangaAura usa IA para ayudarte a crear mangas, traducir capítulos y descubrir nueva lectura",
    shortDescription:
      "Plataforma de manga con IA para creadores y lectores. Crowdfunding y gamificación integrados.",
    longDescription:
      "MangaAura es el ecosistema definitivo para el manga impulsado por IA. Los creadores acceden a herramientas de generación y traducción asistidas por IA, mientras los lectores disfrutan de recomendaciones inteligentes y una experiencia social gamificada con XP, clanes y moneda virtual. El crowdfunding permite que cualquier proyecto encuentre su audiencia y financiación.",
    categoryTags: ["ai-content", "ai-creation", "crowdfunding", "manga"],
    notes: "Growing directory. Good for early positioning.",
  },
  {
    tier: "ai",
    name: "aitools.inc",
    url: "https://aitools.inc",
    dr: 36,
    tagline: "MangaAura usa IA para ayudarte a crear mangas, traducir capítulos y descubrir nueva lectura",
    shortDescription:
      "IA para crear y traducir manga. Plataforma social con gamificación y crowdfunding.",
    longDescription:
      "MangaAura integra inteligencia artificial en la creación y traducción de manga, ofreciendo herramientas potentes para creadores independientes. La plataforma combina estas capacidades con una experiencia social completa: XP, niveles, clanes, moneda virtual Aura y crowdfunding para proyectos.",
    categoryTags: ["ai-content", "ai-writing", "ai-image", "community"],
    notes: "Lower DR but nofollow is fine. Submit for completeness.",
  },

  // ── Tier 2: Startup ─────────────────────────────────────────────────
  {
    tier: "startup",
    name: "AlternativeTo",
    url: "https://alternativeto.net",
    dr: 85,
    tagline: "MangaAura es la plataforma que gamifica la lectura de manga con XP, logros y crowdfunding",
    shortDescription:
      "Alternativa social y gamificada a las plataformas tradicionales de lectura de manga. Crea, lee y crowdfundea.",
    longDescription:
      "MangaAura es la alternativa moderna a las plataformas tradicionales de lectura de manga. Ofrece una experiencia social gamificada con XP, niveles, clanes y moneda virtual, herramientas de IA para creadores, y crowdfunding para proyectos independientes. A diferencia de sitios estáticos de lectura, MangaAura construye comunidad en torno a cada serie.",
    categoryTags: ["manga", "comics", "reading", "crowdfunding", "community"],
    notes: "High DR. Users compare and vote. Create a compelling alternative page later.",
  },
  {
    tier: "startup",
    name: "SaaSHub",
    url: "https://saashub.com",
    dr: 78,
    tagline: "MangaAura es la plataforma que gamifica la lectura de manga con XP, logros y crowdfunding",
    shortDescription:
      "Plataforma SaaS de manga con gamificación, IA y crowdfunding para creadores independientes.",
    longDescription:
      "MangaAura es una plataforma SaaS que ofrece un ecosistema completo para el manga: lectura online, herramientas de IA para creadores, crowdfunding integrado y un sistema de gamificación social. Los usuarios ganan XP y suben de nivel, los creadores publican y monetizan sus obras, y la comunidad decide qué proyectos se financian.",
    categoryTags: ["saas", "manga", "crowdfunding", "ai", "community"],
    notes: "Focus on SaaS/platform angle. Decent DR.",
  },
  {
    tier: "startup",
    name: "Startup Stash",
    url: "https://startupstash.com",
    dr: 62,
    tagline: "MangaAura es la plataforma que gamifica la lectura de manga con XP, logros y crowdfunding",
    shortDescription:
      "Plataforma de manga con gamificación, IA y crowdfunding. Indie-friendly y community-first.",
    longDescription:
      "MangaAura nace como un proyecto independiente para revolucionar la forma en que se lee, crea y financia manga. Con gamificación (XP, niveles, clanes, moneda virtual Aura), herramientas de IA para creadores y crowdfunding comunitario, es la plataforma más completa para la comunidad manga hispanohablante.",
    categoryTags: ["manga", "indie", "crowdfunding", "gamification", "community"],
    notes: "Curated. Submit with a personal story about being solo founder.",
  },
  {
    tier: "startup",
    name: "Indie Hackers",
    url: "https://indiehackers.com",
    dr: 70,
    tagline: "MangaAura es la plataforma que gamifica la lectura de manga con XP, logros y crowdfunding",
    shortDescription:
      "Indie project: plataforma de manga con IA, gamificación y crowdfunding. Construida por un solo founder.",
    longDescription:
      "MangaAura es un proyecto indie que está construyendo la plataforma de manga definitiva: lectura gratuita, herramientas de IA para creadores, crowdfunding para proyectos independientes y gamificación social. Creada por un solo founder, con usuarios reales y pagos en vivo. Una historia de bootstrap y community-building.",
    categoryTags: ["indie", "saas", "manga", "crowdfunding", "bootstrapped"],
    notes: "Community + backlink. Write a 'build in public' post for maximum value.",
  },
  {
    tier: "startup",
    name: "SideProjectors",
    url: "https://sideprojectors.com",
    dr: 46,
    tagline: "MangaAura es la plataforma que gamifica la lectura de manga con XP, logros y crowdfunding",
    shortDescription:
      "Side project convertido en plataforma completa de manga con IA, gamificación y crowdfunding.",
    longDescription:
      "Lo que empezó como un side project se ha convertido en MangaAura: una plataforma completa para la comunidad manga con herramientas de IA, gamificación (XP, niveles, clanes, Aura) y crowdfunding. Con usuarios reales, Stripe en producción y un roadmap ambicioso.",
    categoryTags: ["manga", "side-project", "crowdfunding", "gamification", "indie"],
    notes: "Good for indie narrative. Emphasize the side project origin.",
  },
  {
    tier: "startup",
    name: "Slant",
    url: "https://slant.co",
    dr: 66,
    tagline: "MangaAura es la plataforma que gamifica la lectura de manga con XP, logros y crowdfunding",
    shortDescription:
      "La plataforma más completa para leer, crear y crowdfundear manga. Gamificación e IA incluidas.",
    longDescription:
      "MangaAura es una plataforma todo-en-uno para el manga: lectura gratuita de miles de capítulos, herramientas de IA para creadores, crowdfunding integrado y un sistema de gamificación que hace que cada interacción cuente. XP, niveles, clanes y una economía virtual con la moneda Aura mantienen a la comunidad activa y comprometida.",
    categoryTags: ["manga", "comics", "reading", "community", "tools"],
    notes: "Review-style platform. Good for long-tail discovery.",
  },

  // ── Tier 8: Profile ─────────────────────────────────────────────────
  {
    tier: "profile",
    name: "Crunchbase",
    url: "https://crunchbase.com",
    dr: 90,
    tagline: "MangaAura es la plataforma de manga con IA para leer, crear y crowdfundear",
    shortDescription:
      "MangaAura is an AI-powered manga platform for reading, creating, and crowdfunding manga with gamification.",
    longDescription:
      "MangaAura is an AI-powered manga platform based in Spain that combines manga reading, AI-assisted creation tools, community crowdfunding, and gamification (XP, levels, clans, virtual currency). The platform serves both readers and creators in the Spanish-speaking manga community.",
    categoryTags: ["manga", "ai", "crowdfunding", "entertainment", "publishing"],
    notes: "Investor/data presence. Use company email. Keep description professional.",
  },
  {
    tier: "profile",
    name: "LinkedIn",
    url: "https://linkedin.com",
    dr: 98,
    tagline: "MangaAura — La plataforma de manga con IA para leer, crear y crowdfundear",
    shortDescription:
      "MangaAura es una plataforma que gamifica la lectura y creación de manga con IA, XP y crowdfunding comunitario.",
    longDescription:
      "MangaAura es una plataforma española que está revolucionando la industria del manga combinando inteligencia artificial, gamificación y crowdfunding. Los lectores descubren nuevas series y ganan XP, los creadores publican sus obras con herramientas de IA y reciben financiación directa de la comunidad. Construida por un solo founder, con usuarios reales y pagos en vivo.",
    categoryTags: ["internet", "entertainment", "manga", "ai", "publishing"],
    notes: "Create company page. Optimize with keywords. Link to website and blog.",
  },
  {
    tier: "profile",
    name: "Dev.to",
    url: "https://dev.to",
    dr: 90,
    tagline: "MangaAura usa IA para ayudarte a crear mangas, traducir capítulos y descubrir nueva lectura",
    shortDescription:
      "Open building a manga platform with AI, gamification and crowdfunding. Built by a solo founder with Next.js and Stripe.",
    longDescription:
      "I'm building MangaAura, an AI-powered manga platform with gamification (XP, levels, clans, virtual currency), AI tools for creators, and community crowdfunding. Built with Next.js, Stripe live payments, PostgreSQL, and deployed on Vercel. This is the story of building in public, bootstrapping a platform for the Spanish-speaking manga community.",
    categoryTags: ["nextjs", "startup", "indie", "building-in-public", "ai"],
    notes: 'Write technical "build in public" articles. Include MangaAura in your dev.to bio.',
  },
  {
    tier: "profile",
    name: "GitHub",
    url: "https://github.com",
    dr: 97,
    tagline: "MangaAura — AI-powered manga platform with gamification and crowdfunding",
    shortDescription:
      "MangaAura is an AI-powered manga reading, creation and crowdfunding platform with gamification.",
    longDescription:
      "MangaAura combines manga reading, AI-assisted creation tools, community crowdfunding, and gamification (XP, levels, clans, virtual currency) in one platform. Built with Next.js, TypeScript, Tailwind CSS, PostgreSQL, Stripe, and deployed on Vercel.",
    categoryTags: ["manga", "nextjs", "typescript", "ai", "crowdfunding", "gamification"],
    notes: "Create repo. Link from website footer. Keep README updated.",
  },
];
