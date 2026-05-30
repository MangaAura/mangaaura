"""
Convert all non-admin pages from static `export const metadata` to `generateMetadata` with i18n.
Run in two phases:
  1. Add all i18n keys to es.json / en.json
  2. Convert each page file
"""
import json
import os
import re

# ── Phase 1: Define all i18n keys ─────────────────────────────────────

# Each entry: (path_segment, es_title, es_desc, en_title, en_desc, is_layout, details)
# details = dict with extra info like canonical, robots, og_title_diff, twitter_desc_diff

pages_def = [
    # Auth (5)
    ("authLogin", "Iniciar Sesión | MangaAura", "Accede a tu cuenta de MangaAura para disfrutar de todo el contenido.",
     "Sign In | MangaAura", "Access your MangaAura account to enjoy all content.",
     False, {"canonical": "/auth/login", "robots": "noindex", "full_og": True, "full_twitter": True}),
    ("authRegister", "Crear Cuenta | MangaAura", "Regístrate en MangaAura y descubre un mundo de manga.",
     "Create Account | MangaAura", "Sign up for MangaAura and discover a world of manga.",
     False, {"canonical": "/auth/register", "robots": "noindex", "full_og": True, "full_twitter": True}),
    ("authForgotPassword", "Recuperar Contraseña | MangaAura", "Recupera el acceso a tu cuenta de MangaAura.",
     "Forgot Password | MangaAura", "Recover access to your MangaAura account.",
     False, {"canonical": "/auth/forgot-password", "robots": "noindex", "full_og": True, "full_twitter": True}),
    ("authResetPassword", "Restablecer Contraseña | MangaAura", "Establece una nueva contraseña para tu cuenta de MangaAura.",
     "Reset Password | MangaAura", "Set a new password for your MangaAura account.",
     False, {"canonical": "/auth/reset-password", "robots": "noindex", "full_og": True, "full_twitter": True}),
    ("authLayout", "Autenticación | MangaAura", "Inicia sesión o regístrate en MangaAura.",
     "Authentication | MangaAura", "Sign in or create an account on MangaAura.",
     True, {"robots": "noindex"}),

    # Checkout (3)
    ("checkout", "Comprar Aura | MangaAura", "Adquiere Aura, la moneda virtual de MangaAura, y apoya a tus creadores favoritos.",
     "Buy Aura | MangaAura", "Purchase Aura, the virtual currency of MangaAura, and support your favorite creators.",
     False, {"canonical": "/checkout", "robots": "noindex", "full_og": True, "full_twitter": True}),
    ("checkoutCancel", "Compra Cancelada | MangaAura", "El proceso de compra de Aura en MangaAura ha sido cancelado.",
     "Purchase Cancelled | MangaAura", "The Aura purchase process on MangaAura has been cancelled.",
     False, {"canonical": "/checkout/cancel", "robots": "noindex", "full_og": True, "full_twitter": True}),
    ("checkoutLayout", "Finalizar Compra | MangaAura", "Completa tu compra de capítulos o manga en MangaAura de forma segura.",
     "Checkout | MangaAura", "Complete your purchase of chapters or manga on MangaAura securely.",
     True, {}),

    # Creator (8)
    ("creatorDashboard", "Panel del Creador | MangaAura", "Panel de control para creadores en MangaAura. Gestiona tus mangas y capítulos.",
     "Creator Dashboard | MangaAura", "Control panel for creators on MangaAura. Manage your manga and chapters.",
     False, {"canonical": "/creator/dashboard", "robots": "noindex", "full_og": True, "full_twitter": True}),
    ("creatorCommunity", "Comunidad de Creadores | MangaAura", "Conecta con otros creadores en la comunidad de MangaAura.",
     "Creator Community | MangaAura", "Connect with other creators in the MangaAura community.",
     False, {"canonical": "/creator/community", "robots": "noindex", "full_og": True, "full_twitter": True}),
    ("creatorLayout", "Panel de Creador | MangaAura", "Gestiona tu contenido como creador en MangaAura. Sube capítulos, edita información de manga y más.",
     "Creator Panel | MangaAura", "Manage your content as a creator on MangaAura. Upload chapters, edit manga info and more.",
     True, {"robots": "noindex"}),
    ("creatorManga", "Mis Mangas | MangaAura", "Gestiona tus series de manga publicadas en MangaAura.",
     "My Manga | MangaAura", "Manage your published manga series on MangaAura.",
     False, {"canonical": "/creator/manga", "robots": "noindex", "full_og": True, "full_twitter": True}),
    ("creatorMangaNew", "Nuevo Manga | MangaAura", "Publica una nueva serie de manga en MangaAura.",
     "New Manga | MangaAura", "Publish a new manga series on MangaAura.",
     False, {"canonical": "/creator/manga/new", "robots": "noindex", "full_og": True, "full_twitter": True}),
    ("creatorMangaDetail", "Detalle del Manga | MangaAura", "Gestiona los capítulos y detalles de tu manga en MangaAura.",
     "Manga Details | MangaAura", "Manage the chapters and details of your manga on MangaAura.",
     False, {"canonical": "/creator/manga/[slug]", "robots": "noindex", "full_og": True, "full_twitter": True}),
    ("creatorMangaEdit", "Editar Manga | MangaAura", "Edita los detalles de tu serie de manga en MangaAura.",
     "Edit Manga | MangaAura", "Edit the details of your manga series on MangaAura.",
     False, {"canonical": "/creator/manga/[slug]/edit", "robots": "noindex", "full_og": True, "full_twitter": True}),
    ("creatorChapterEdit", "Editar Capítulo | MangaAura", "Sube y edita las páginas de un capítulo de tu manga en MangaAura.",
     "Edit Chapter | MangaAura", "Upload and edit the pages of your manga chapter on MangaAura.",
     False, {"canonical": "/creator/manga/[slug]/chapter/[chapterId]/edit", "robots": "noindex", "full_og": True, "full_twitter": True}),

    # Economy (4)
    ("economy", "Economía Aura | MangaAura", "Gestiona tu Aura: transferencias, retiros, referidos e historial",
     "Aura Economy | MangaAura", "Manage your Aura: transfers, withdrawals, referrals and history",
     False, {}),
    ("economyHistory", "Historial de Transacciones | MangaAura", "Ver todas tus transacciones de Aura",
     "Transaction History | MangaAura", "View all your Aura transactions",
     False, {}),
    ("economyReferrals", "Programa de Referencias | MangaAura", "Invita amigos y gana 10% de su primera compra de Aura",
     "Referral Program | MangaAura", "Invite friends and earn 10% of their first Aura purchase",
     False, {}),
    ("economyTransfer", "Enviar Aura | MangaAura", "Transfiere Aura a otros usuarios",
     "Send Aura | MangaAura", "Transfer Aura to other users",
     False, {}),

    # Community / Other (8)
    ("community", "Comunidad | MangaAura", "Conecta con otros lectores de manga. Únete a clanes, participa en eventos y compite en el ranking.",
     "Community | MangaAura", "Connect with other manga readers. Join clans, participate in events and compete in rankings.",
     False, {}),
    ("communityLayout", "Comunidad | MangaAura", "Únete a la comunidad de MangaAura. Participa en foros, crea clans y más.",
     "Community | MangaAura", "Join the MangaAura community. Participate in forums, create clans and more.",
     True, {}),
    ("clans", "Clanes | MangaAura", "Únete a un clan y compite con otros lectores en las temporadas",
     "Clans | MangaAura", "Join a clan and compete with other readers in seasons",
     False, {}),
    ("clansCreate", "Crear Clán | MangaAura", "Crea tu propio clán en MangaAura y reúne a otros amantes del manga.",
     "Create Clan | MangaAura", "Create your own clan on MangaAura and gather other manga lovers.",
     False, {"canonical": "/community/clans/create", "full_og": True, "full_twitter": True}),
    ("forum", "Foro | MangaAura", "Foro de la comunidad de creadores de MangaAura",
     "Forum | MangaAura", "MangaAura creator community forum",
     False, {}),
    ("forumCreate", "Nuevo Hilo | Foro | MangaAura", "Crear un nuevo hilo en el foro",
     "New Thread | Forum | MangaAura", "Create a new thread in the forum",
     False, {}),
    ("rules", "Reglas de la Comunidad | MangaAura", "Conoce las reglas y normas de convivencia de la comunidad MangaAura.",
     "Community Rules | MangaAura", "Learn the rules and guidelines of the MangaAura community.",
     False, {"canonical": "/community/rules", "full_og": True, "full_twitter": True}),
    ("mangaLayout", "Manga | MangaAura", "Lee manga en MangaAura. Miles de títulos de manga en español con capítulos actualizados daily.",
     "Manga | MangaAura", "Read manga on MangaAura. Thousands of manga titles with daily updated chapters.",
     True, {}),

    # Protected (19)
    ("achievements", "Logros | MangaAura", "Descubre y desbloquea logros mientras lees manga",
     "Achievements | MangaAura", "Discover and unlock achievements while reading manga",
     False, {}),
    ("bookmarks", "Marcadores | MangaAura", "Tus mangas y capítulos marcados",
     "Bookmarks | MangaAura", "Your bookmarked manga and chapters",
     False, {}),
    ("collections", "Colecciones | MangaAura", "Explora y descubre colecciones de manga creadas por la comunidad",
     "Collections | MangaAura", "Explore and discover manga collections created by the community",
     False, {"full_og": True}),  # has OG but not twitter
    ("collectionsEdit", "Editar Colección | MangaAura", "Edita los detalles de tu colección de manga en MangaAura.",
     "Edit Collection | MangaAura", "Edit the details of your manga collection on MangaAura.",
     False, {"canonical": "/collections/[id]/edit", "robots": "noindex", "full_og": True, "full_twitter": True}),
    ("comments", "Mis Comentarios | MangaAura", "Administra todos tus comentarios en MangaAura",
     "My Comments | MangaAura", "Manage all your comments on MangaAura",
     False, {}),
    ("corrections", "Correcciones | MangaAura", "Revisa y envía correcciones de capítulos",
     "Corrections | MangaAura", "Review and submit chapter corrections",
     False, {}),
    ("feed", "Actividad | MangaAura", "Mira lo que está pasando en la comunidad",
     "Activity | MangaAura", "See what's happening in the community",
     False, {}),
    ("following", "Siguiendo | MangaAura", "Gestiona las cuentas que sigues",
     "Following | MangaAura", "Manage the accounts you follow",
     False, {}),
    ("protectedLayout", "MangaAura", "Plataforma de manga para creadores y lectores.",
     "MangaAura", "Manga platform for creators and readers.",
     True, {}),
    ("messages", "Mensajes | MangaAura", "Tus conversaciones y mensajes directos",
     "Messages | MangaAura", "Your conversations and direct messages",
     False, {}),
    ("messagesConversation", "Conversación | MangaAura", "Conversación privada en MangaAura.",
     "Conversation | MangaAura", "Private conversation on MangaAura.",
     False, {"canonical": "/messages/[id]", "robots": "noindex", "full_og": True, "full_twitter": True}),
    ("messagesClan", "Chat de Clán | MangaAura", "Chat en vivo para tu clán en MangaAura.",
     "Clan Chat | MangaAura", "Live chat for your clan on MangaAura.",
     False, {"canonical": "/messages/clan/[clanId]", "robots": "noindex", "full_og": True, "full_twitter": True}),
    ("profile", "Mi Perfil | MangaAura", "Tu perfil y estadísticas",
     "My Profile | MangaAura", "Your profile and statistics",
     False, {}),
    ("quests", "Misiones | MangaAura", "Completa misiones diarias y semanales para ganar XP y monedas",
     "Quests | MangaAura", "Complete daily and weekly quests to earn XP and coins",
     False, {}),
    ("readingHistory", "Historial de Lectura | MangaAura", "Revisa todo tu historial de lectura en MangaAura",
     "Reading History | MangaAura", "Review your entire reading history on MangaAura",
     False, {}),
    ("reposts", "Reposts | MangaAura", "Tus reposts y actividad reciente en MangaAura.",
     "Reposts | MangaAura", "Your reposts and recent activity on MangaAura.",
     False, {"canonical": "/reposts", "robots": "noindex", "full_og": True, "full_twitter": True}),
    ("sponsorships", "Mis Patrocinios | MangaAura", "Gestiona tus patrocinios y pujas en capítulos",
     "My Sponsorships | MangaAura", "Manage your sponsorships and chapter bids",
     False, {}),
    ("tips", "Propinas | MangaAura", "Historial de propinas enviadas y recibidas",
     "Tips | MangaAura", "History of tips sent and received",
     False, {}),
    ("transactions", "Historial de Transacciones | MangaAura", "Revisa tu historial de transacciones en MangaAura",
     "Transaction History | MangaAura", "Review your transaction history on MangaAura",
     False, {}),

    # Public (20)
    ("announcements", "Anuncios | MangaAura", "Anuncios oficiales, mantenimientos y novedades importantes de MangaAura.",
     "Announcements | MangaAura", "Official announcements, maintenance updates and important news from MangaAura.",
     False, {"canonical": "/announcements", "full_og": True, "full_twitter": True}),
    ("blog", "Blog de MangaAura | Guías, tutoriales y novedades",
     "Guías para crear manga, tutoriales de la plataforma, consejos de crowdfunding y novedades de la comunidad MangaAura. Aprende a publicar y monetizar tu manga.",
     "MangaAura Blog | Guides, tutorials and news",
     "Guides for creating manga, platform tutorials, crowdfunding tips and MangaAura community news. Learn to publish and monetize your manga.",
     False, {"canonical": "/blog", "robots": "index", "full_og": True, "og_title_diff": True}),
    ("contact", "Contacto | MangaAura", "Ponte en contacto con el equipo de MangaAura. Estamos aquí para ayudarte.",
     "Contact | MangaAura", "Get in touch with the MangaAura team. We're here to help you.",
     False, {"canonical": "/contact", "full_og": True, "full_twitter": True}),
    ("contacto", "Contacto | MangaAura", "Ponte en contacto con el equipo de MangaAura. Estamos aquí para ayudarte.",
     "Contact | MangaAura", "Get in touch with the MangaAura team. We're here to help you.",
     False, {"canonical": "/contacto", "full_og": True, "full_twitter": True}),
    ("discover", "Descubrir | MangaAura", "Descubre nuevos mangas, tendencias y recomendaciones",
     "Discover | MangaAura", "Discover new manga, trends and recommendations",
     False, {}),
    ("genres", "Géneros de Manga | Explora por categoría",
     "Explora mangas por género en MangaAura: yuri, acción, aventura, romance, fantasía, a color y más. Encuentra tu próximo manga favorito.",
     "Manga Genres | Explore by category",
     "Explore manga by genre on MangaAura: yuri, action, adventure, romance, fantasy, full color and more. Find your next favorite manga.",
     False, {}),
    ("publicLayout", "MangaAura", "Plataforma de manga para creadores y lectores.",
     "MangaAura", "Manga platform for creators and readers.",
     True, {}),
    ("help", "Ayuda | MangaAura", "Encuentra respuestas a tus preguntas sobre MangaAura. Guías, tutoriales y soporte.",
     "Help | MangaAura", "Find answers to your questions about MangaAura. Guides, tutorials and support.",
     False, {"canonical": "/help", "full_og": True, "full_twitter": True}),
    ("news", "Noticias de MangaAura | MangaAura",
     "Últimas noticias, novedades y actualizaciones de MangaAura - la plataforma de manga con inteligencia artificial. Novedades de la comunidad, nuevas herramientas y más.",
     "MangaAura News | MangaAura",
     "Latest news, updates and releases from MangaAura - the AI-powered manga platform. Community news, new tools and more.",
     False, {"canonical": "/news", "robots": "index", "full_og": True, "full_twitter": True}),
    ("rankings", "Rankings | MangaAura", "Los lectores y creadores más activos de la comunidad",
     "Rankings | MangaAura", "The most active readers and creators in the community",
     False, {}),
    ("report", "Reportar Contenido | MangaAura", "Reporta contenido inapropiado, infracciones o violaciones en MangaAura.",
     "Report Content | MangaAura", "Report inappropriate content, violations or abuse on MangaAura.",
     False, {"canonical": "/report", "full_og": True, "full_twitter": True}),
    ("sobreNosotros", "Sobre Nosotros | MangaAura", "Conoce más sobre MangaAura, la plataforma definitiva para leer y descubrir manga.",
     "About Us | MangaAura", "Learn more about MangaAura, the ultimate platform to read and discover manga.",
     False, {"canonical": "/sobre-nosotros", "full_og": True, "full_twitter": True}),
    ("welcome", "Bienvenido a MangaAura", "Comienza tu aventura en MangaAura. Lee, crea y crowdfundea manga con inteligencia artificial.",
     "Welcome to MangaAura", "Start your adventure on MangaAura. Read, create and crowdfund manga with AI.",
     False, {"robots": "noindex"}),
    ("guias", "Guías de Manga | Leer, crear y comprar manga online",
     "Guías completas sobre dónde leer manga legal, mejores aplicaciones, plataformas de compra en España, y consejos para empezar en el mundo del manga.",
     "Manga Guides | Read, create and buy manga online",
     "Complete guides on where to read manga legally, best apps, purchase platforms in Spain, and tips for getting started in the world of manga.",
     False, {"canonical": "/guias", "robots": "index", "full_og": True, "og_title_diff": True}),
    ("guiasDondeLeer", "¿Dónde leer manga online de forma legal y segura? | Guía 2026",
     "Descubre las mejores plataformas legales para leer manga online en español y inglés. Alternativas seguras a sitios piratas como MangaPlus, Shonen Jump, MangaAura y más.",
     "Where to read manga online legally and safely? | Guide 2026",
     "Discover the best legal platforms to read manga online in Spanish and English. Safe alternatives to pirate sites like MangaPlus, Shonen Jump, MangaAura and more.",
     False, {"canonical": "/guias/donde-leer-manga-legal-seguro", "robots": "index", "full_og": True}),
    ("guiasMejoresApps", "Mejores aplicaciones para leer manga digitalmente | 2026",
     "Comparativa de las mejores apps para leer manga en Android, iOS y PC. Tachiyomi, Manga Plus, Shonen Jump, MangaAura y más.",
     "Best apps to read manga digitally | 2026",
     "Comparison of the best apps to read manga on Android, iOS and PC. Tachiyomi, Manga Plus, Shonen Jump, MangaAura and more.",
     False, {"canonical": "/guias/mejores-apps-leer-manga", "robots": "index", "full_og": True}),
    ("guiasComprarManga", "Mejores plataformas para comprar manga digital en España | 2026",
     "¿Dónde comprar manga digital en España? Comparativa de Amazon Kindle, ComiXology, Casa del Libro, FNAC y MangaAura. Precios, catálogo y ventajas.",
     "Best platforms to buy digital manga in Spain | 2026",
     "Where to buy digital manga in Spain? Comparison of Amazon Kindle, ComiXology, Casa del Libro, FNAC and MangaAura. Prices, catalog and benefits.",
     False, {"canonical": "/guias/comprar-manga-digital-espana", "robots": "index", "full_og": True}),
    ("guiasRecomendaciones", "Apps para seguir mangas con recomendaciones personalizadas",
     "Descubre aplicaciones que recomiendan mangas según tus gustos. Sistemas de recomendación IA, listas inteligentes y descubrimiento de nuevas series.",
     "Apps to follow manga with personalized recommendations",
     "Discover apps that recommend manga based on your tastes. AI recommendation systems, smart lists and new series discovery.",
     False, {"canonical": "/guias/aplicaciones-recomendaciones-personalizadas", "robots": "index", "full_og": True}),
    ("guiasPrincipiantes", "Guía para principiantes en la lectura de cómics japoneses",
     "Todo lo que necesitas saber para empezar a leer manga: cómo se lee, géneros populares, dónde empezar, diferencias con el anime, y plataformas recomendadas.",
     "Beginner's guide to reading Japanese comics",
     "Everything you need to know to start reading manga: how to read it, popular genres, where to start, differences from anime, and recommended platforms.",
     False, {"canonical": "/guias/guia-principiantes-manga", "robots": "index", "full_og": True}),
    ("guiasMasVendido", "¿Cuál es el manga más vendido de la historia? | Ranking 2026",
     "One Piece lidera como el manga más vendido de la historia con más de 516 millones de copias. Conoce el ranking completo: Golgo 13, Dragon Ball, Naruto, Demon Slayer y más.",
     "What is the best-selling manga of all time? | Ranking 2026",
     "One Piece leads as the best-selling manga of all time with over 516 million copies. Check out the full ranking: Golgo 13, Dragon Ball, Naruto, Demon Slayer and more.",
     False, {"canonical": "/guias/manga-mas-vendido-historia", "robots": "index", "full_og": True}),

    # Reader (1)
    ("reader", "Lector de Manga | MangaAura", "Disfruta de la mejor experiencia de lectura de manga en MangaAura.",
     "Manga Reader | MangaAura", "Enjoy the best manga reading experience on MangaAura.",
     False, {"canonical": "/reader/[slug]", "full_og": True, "full_twitter": True}),
]

# ── Phase 2: Add keys to locale files ──────────────────────────────────

def update_locale(filepath, is_es):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Remove old page section if exists, we'll rebuild it
    existing_page = data.get('page', {})
    data.pop('page', None)

    page_section = {}
    for key, es_title, es_desc, en_title, en_desc, is_layout, details in pages_def:
        t_key = key
        if is_layout:
            page_section[t_key] = {
                'title': es_title if is_es else en_title,
                'description': es_desc if is_es else en_desc,
            }
        else:
            page_section[t_key] = {
                'title': es_title if is_es else en_title,
                'description': es_desc if is_es else en_desc,
            }

    # Preserve any existing page keys that are not in our list (from previous conversion)
    for k, v in existing_page.items():
        if k not in page_section:
            page_section[k] = v

    data['page'] = page_section

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')

    print(f"Updated {filepath} ({'es' if is_es else 'en'}) with {len(pages_def)} page keys")

update_locale('src/i18n/locales/es.json', True)
update_locale('src/i18n/locales/en.json', False)

print("\n✅ Phase 1 complete: i18n keys added\n")
