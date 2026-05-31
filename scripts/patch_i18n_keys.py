import json, re, sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# New keys to add (Spanish values)
new_keys_es = {
    "ctaDescription": "Unete hoy a MangaAura y descubre un mundo de manga, creatividad y comunidad. Es gratis y siempre lo sera.",
    "ctaPricing": "Ver precios",
    "ctaTitle": "Listo para empezar?",
    "featureCreateDesc": "Herramientas de inteligencia artificial para crear manga desde cero. Genera personajes, escenarios y guiones sin necesidad de saber dibujar.",
    "featureCreateTitle": "Crea con IA",
    "featureCrowdfundDesc": "Los lectores apoyan a sus creadores favoritos con Aura. Cuando se alcanza la meta, el capitulo se publica para toda la comunidad.",
    "featureCrowdfundTitle": "Crowdfunding de capitulos",
    "featureFreeDesc": "Sin suscripciones ni pagos obligatorios. Lee todo el manga que quieras sin limites ni publicidad invasiva.",
    "featureFreeTitle": "100% gratis",
    "featureOfflineDesc": "Instala MangaAura como app y descarga capitulos para leer sin conexion a internet. Perfecto para viajes.",
    "featureOfflineTitle": "Lectura offline",
    "featureReadDesc": "Accede a miles de series de manga organizadas por genero, popularidad y ultimas actualizaciones. Lectura online gratuita.",
    "featureReadTitle": "Lee manga gratis",
    "featureXpDesc": "Gana XP leyendo, manteniendo rachas y completando logros. Sube de nivel, desbloquea insignias y aparece en los rankings.",
    "featureXpTitle": "Gana XP y sube de nivel",
    "sectionFaqBadge": "Preguntas frecuentes",
    "sectionFaqSubtitle": "Resolvemos tus dudas sobre MangaAura, Aura, la creacion de manga y como funciona la plataforma.",
    "sectionFaqTitle": "Tienes dudas?",
    "sectionFeaturesBadge": "Funcionalidades",
    "sectionFeaturesTitle": "Todo lo que necesitas en un solo lugar",
    "sectionStepsSubtitle": "No necesitas experiencia. Registrate, elige como quieres participar y empieza a disfrutar de MangaAura al instante.",
    "step1Desc": "Registrate gratis con tu email o conecta con Google. En menos de un minuto tendras acceso a toda la plataforma: miles de mangas, herramientas de creacion y una comunidad activa.",
    "step2Desc": "Descubre manga de todos los generos: accion, romance, fantasia, terror y mas. Usa filtros avanzados, sigue a tus autores favoritos y recibe recomendaciones personalizadas.",
    "step3Desc": "Lee, comenta, vota con Aura, crowdfundea capitulos, gana XP y desbloquea logros. Los creadores reciben Aura como recompensa por su trabajo."
}

new_keys_en = {
    "ctaDescription": "Join MangaAura today and discover a world of manga, creativity, and community. It's free and always will be.",
    "ctaPricing": "View pricing",
    "ctaTitle": "Ready to get started?",
    "featureCreateDesc": "Artificial intelligence tools to create manga from scratch. Generate characters, scenarios, and scripts without needing to draw.",
    "featureCreateTitle": "Create with AI",
    "featureCrowdfundDesc": "Readers support their favorite creators with Aura. When the goal is reached, the chapter is published for the entire community.",
    "featureCrowdfundTitle": "Chapter crowdfunding",
    "featureFreeDesc": "No subscriptions or mandatory payments. Read all the manga you want without limits or intrusive ads.",
    "featureFreeTitle": "100% free",
    "featureOfflineDesc": "Install MangaAura as an app and download chapters to read offline. Perfect for travel.",
    "featureOfflineTitle": "Offline reading",
    "featureReadDesc": "Access thousands of manga series organized by genre, popularity, and latest updates. Free online reading.",
    "featureReadTitle": "Read manga free",
    "featureXpDesc": "Earn XP by reading, maintaining streaks, and completing achievements. Level up, unlock badges, and appear on rankings.",
    "featureXpTitle": "Earn XP and level up",
    "sectionFaqBadge": "Frequently asked questions",
    "sectionFaqSubtitle": "We answer your questions about MangaAura, Aura, manga creation, and how the platform works.",
    "sectionFaqTitle": "Have questions?",
    "sectionFeaturesBadge": "Features",
    "sectionFeaturesTitle": "Everything you need in one place",
    "sectionStepsSubtitle": "No experience needed. Sign up, choose how you want to participate, and start enjoying MangaAura instantly.",
    "step1Desc": "Register for free with your email or connect with Google. In less than a minute you'll have access to the entire platform: thousands of mangas, creation tools, and an active community.",
    "step2Desc": "Discover manga across all genres: action, romance, fantasy, horror, and more. Use advanced filters, follow your favorite authors, and get personalized recommendations.",
    "step3Desc": "Read, comment, vote with Aura, crowdfund chapters, earn XP, and unlock achievements. Creators receive Aura as a reward for their work."
}

for lang_file, new_keys in [('src/i18n/locales/es.json', new_keys_es), ('src/i18n/locales/en.json', new_keys_en)]:
    with open(lang_file, 'r', encoding='utf-8') as f:
        d = json.load(f)
    
    como = d.get('page', {}).get('comoFunciona', {})
    como.update(new_keys)
    d['page']['comoFunciona'] = como
    
    with open(lang_file, 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
    
    print(f"OK Updated {lang_file} - now has {len(como)} keys", flush=True)

# Verify
with open('src/app/(public)/como-funciona/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

keys_in_page = set()
for match in re.finditer(r"t\('page\.comoFunciona\.([^']+)'", content):
    keys_in_page.add(match.group(1))

missing_any = False
for lang_name, lang_file in [('es.json', 'src/i18n/locales/es.json'), ('en.json', 'src/i18n/locales/en.json')]:
    with open(lang_file, 'r', encoding='utf-8') as f:
        d = json.load(f)
    existing = set(d.get('page', {}).get('comoFunciona', {}).keys())
    missing = keys_in_page - existing
    if missing:
        print(f"FAIL Still missing in {lang_name}: {sorted(missing)}", flush=True)
        missing_any = True

if not missing_any:
    print("OK ALL KEYS MATCH. Total keys per locale:", len(keys_in_page), flush=True)
