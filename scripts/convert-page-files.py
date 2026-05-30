"""
Phase 2: Convert all 68 page files from `export const metadata` to `generateMetadata` with i18n.
"""
import os
import re

# Mapping: (file_suffix, i18n_key, canonical, has_robots, has_og, has_twitter, og_title_diff)
# og_title_diff = True means OG title is different from page title

PAGES = [
    # ── Auth (5) ──
    ("auth/login/page.tsx",       "authLogin",       "/auth/login",          "noindex", True, True, False),
    ("auth/register/page.tsx",    "authRegister",    "/auth/register",       "noindex", True, True, False),
    ("auth/forgot-password/page.tsx", "authForgotPassword", "/auth/forgot-password", "noindex", True, True, False),
    ("auth/reset-password/page.tsx",  "authResetPassword", "/auth/reset-password", "noindex", True, True, False),
    ("auth/layout.tsx",           "authLayout",      None,                  "noindex", False, False, False),

    # ── Checkout (3) ──
    ("checkout/page.tsx",         "checkout",        "/checkout",            "noindex", True, True, False),
    ("checkout/cancel/page.tsx",  "checkoutCancel",  "/checkout/cancel",     "noindex", True, True, False),
    ("checkout/layout.tsx",       "checkoutLayout",  None,                   None,      False, False, False),

    # ── Creator (8) ──
    ("creator/dashboard/page.tsx",   "creatorDashboard",   "/creator/dashboard",       "noindex", True, True, False),
    ("creator/community/page.tsx",   "creatorCommunity",   "/creator/community",       "noindex", True, True, False),
    ("creator/layout.tsx",           "creatorLayout",      None,                        "noindex", False, False, False),
    ("creator/manga/page.tsx",       "creatorManga",       "/creator/manga",           "noindex", True, True, False),
    ("creator/manga/new/page.tsx",   "creatorMangaNew",    "/creator/manga/new",       "noindex", True, True, False),
    ("creator/manga/[slug]/page.tsx", "creatorMangaDetail", "/creator/manga/[slug]",    "noindex", True, True, False),
    ("creator/manga/[slug]/edit/page.tsx", "creatorMangaEdit", "/creator/manga/[slug]/edit", "noindex", True, True, False),
    ("creator/manga/[slug]/chapter/[chapterId]/edit/page.tsx", "creatorChapterEdit", "/creator/manga/[slug]/chapter/[chapterId]/edit", "noindex", True, True, False),

    # ── Economy (4) ──
    ("economy/page.tsx",          "economy",          None, None, False, False, False),
    ("economy/history/page.tsx",  "economyHistory",   None, None, False, False, False),
    ("economy/referrals/page.tsx","economyReferrals", None, None, False, False, False),
    ("economy/transfer/page.tsx", "economyTransfer",  None, None, False, False, False),

    # ── Community (8) ──
    ("community/page.tsx",              "community",       None,                  None,  False, False, False),
    ("community/layout.tsx",            "communityLayout", None,                  None,  False, False, False),
    ("community/clans/page.tsx",        "clans",           None,                  None,  False, False, False),
    ("community/clans/create/page.tsx", "clansCreate",     "/community/clans/create", None, True, True, False),
    ("community/forum/page.tsx",        "forum",           None,                  None,  False, False, False),
    ("community/forum/create/page.tsx", "forumCreate",     None,                  None,  False, False, False),
    ("community/rules/page.tsx",        "rules",           "/community/rules",    None,  True, True, False),
    ("manga/layout.tsx",               "mangaLayout",      None,                  None,  False, False, False),

    # ── Protected (19) ──
    ("(protected)/achievements/page.tsx",   "achievements",     None,                None,  False, False, False),
    ("(protected)/bookmarks/page.tsx",      "bookmarks",        None,                None,  False, False, False),
    ("(protected)/collections/page.tsx",    "collections",      None,                None,  True,  False, False),
    ("(protected)/collections/[id]/edit/page.tsx", "collectionsEdit", "/collections/[id]/edit", "noindex", True, True, False),
    ("(protected)/comments/page.tsx",       "comments",         None,                None,  False, False, False),
    ("(protected)/corrections/page.tsx",    "corrections",      None,                None,  False, False, False),
    ("(protected)/feed/page.tsx",           "feed",             None,                None,  False, False, False),
    ("(protected)/following/page.tsx",      "following",        None,                None,  False, False, False),
    ("(protected)/layout.tsx",              "protectedLayout",  None,                None,  False, False, False),
    ("(protected)/messages/page.tsx",       "messages",         None,                None,  False, False, False),
    ("(protected)/messages/[id]/page.tsx",  "messagesConversation", "/messages/[id]", "noindex", True, True, False),
    ("(protected)/messages/clan/[clanId]/page.tsx", "messagesClan", "/messages/clan/[clanId]", "noindex", True, True, False),
    ("(protected)/profile/page.tsx",        "profile",          None,                None,  False, False, False),
    ("(protected)/quests/page.tsx",         "quests",           None,                None,  False, False, False),
    ("(protected)/reading-history/page.tsx","readingHistory",   None,                None,  False, False, False),
    ("(protected)/reposts/page.tsx",        "reposts",          "/reposts",          "noindex", True, True, False),
    ("(protected)/sponsorships/page.tsx",   "sponsorships",     None,                None,  False, False, False),
    ("(protected)/tips/page.tsx",           "tips",             None,                None,  False, False, False),
    ("(protected)/transactions/page.tsx",   "transactions",     None,                None,  False, False, False),

    # ── Public (20) ──
    ("(public)/announcements/page.tsx",  "announcements",  "/announcements",    None,    True, True, False),
    ("(public)/blog/page.tsx",           "blog",           "/blog",             "index", True, False, True),
    ("(public)/contact/page.tsx",        "contact",        "/contact",          None,    True, True, False),
    ("(public)/contacto/page.tsx",       "contacto",       "/contacto",         None,    True, True, False),
    ("(public)/discover/page.tsx",       "discover",       None,                None,    False, False, False),
    ("(public)/genres/page.tsx",         "genres",         None,                None,    False, False, False),
    ("(public)/help/page.tsx",           "help",           "/help",            None,    True, True, False),
    ("(public)/layout.tsx",              "publicLayout",   None,                None,    False, False, False),
    ("(public)/news/page.tsx",           "news",           "/news",            "index", True, True, False),
    ("(public)/rankings/page.tsx",       "rankings",       None,                None,    False, False, False),
    ("(public)/report/page.tsx",         "report",         "/report",           None,    True, True, False),
    ("(public)/sobre-nosotros/page.tsx", "sobreNosotros",  "/sobre-nosotros",   None,    True, True, False),
    ("(public)/welcome/page.tsx",        "welcome",        None,                "noindex", False, False, False),

    # Guides (7)
    ("(public)/guias/page.tsx",         "guias",         "/guias",                "index", True, False, True),
    ("(public)/guias/donde-leer-manga-legal-seguro/page.tsx", "guiasDondeLeer", "/guias/donde-leer-manga-legal-seguro", "index", True, False, False),
    ("(public)/guias/mejores-apps-leer-manga/page.tsx",      "guiasMejoresApps", "/guias/mejores-apps-leer-manga", "index", True, False, False),
    ("(public)/guias/comprar-manga-digital-espana/page.tsx",  "guiasComprarManga","/guias/comprar-manga-digital-espana", "index", True, False, False),
    ("(public)/guias/aplicaciones-recomendaciones-personalizadas/page.tsx", "guiasRecomendaciones", "/guias/aplicaciones-recomendaciones-personalizadas", "index", True, False, False),
    ("(public)/guias/guia-principiantes-manga/page.tsx",     "guiasPrincipiantes","/guias/guia-principiantes-manga", "index", True, False, False),
    ("(public)/guias/manga-mas-vendido-historia/page.tsx",   "guiasMasVendido",   "/guias/manga-mas-vendido-historia", "index", True, False, False),

    # ── Reader (1) ──
    ("reader/[slug]/page.tsx",        "reader",         "/reader/[slug]",     None,    True, True, False),
]

def mk_generate_metadata(key, canonical, robots, has_og, has_twitter, og_title_diff):
    """Build the generateMetadata function string."""
    lines = []
    lines.append("export async function generateMetadata(): Promise<Metadata> {")
    lines.append("  const locale = await detectLocale();")
    lines.append("  const t = getT(locale);")
    lines.append(f"  const title = t('page.{key}.title');")
    lines.append(f"  const description = t('page.{key}.description');")
    lines.append("")
    lines.append("  return {")
    lines.append("    title,")
    lines.append("    description,")

    if robots == "noindex":
        lines.append("    robots: { index: false, follow: false },")
    elif robots == "index":
        lines.append("    robots: { index: true, follow: true },")

    if has_og:
        if og_title_diff:
            lines.append(f"    openGraph: {{")
            lines.append(f"      title: t('page.{key}Og.title'),")
            lines.append(f"      description: t('page.{key}Og.description'),")
            lines.append("      type: 'website',")
            lines.append("      images: ['/og-image.png'],")
            lines.append("    },")
        else:
            lines.append("    openGraph: {")
            lines.append("      title,")
            lines.append("      description,")
            lines.append("      type: 'website',")
            lines.append("      images: ['/og-image.png'],")
            lines.append("    },")

    if has_twitter:
        lines.append("    twitter: {")
        lines.append("      card: 'summary_large_image',")
        lines.append("      title,")
        lines.append("      description,")
        lines.append("      images: ['/og-image.png'],")
        lines.append("    },")

    if canonical:
        lines.append(f"    alternates: {{ canonical: '{canonical}' }},")

    lines.append("  };")
    lines.append("}")
    return "\n".join(lines)

def convert_file(rel_path, key, canonical, robots, has_og, has_twitter, og_title_diff):
    full_path = os.path.join('src', 'app', rel_path.replace('/', os.sep))
    if not os.path.exists(full_path):
        alt_path = os.path.join('src', 'app', rel_path.replace('/', os.sep))
        if not os.path.exists(alt_path):
            print(f"  [SKIP] File not found: {full_path}")
            return False
        full_path = alt_path

    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Build the replacement
    gen_meta = mk_generate_metadata(key, canonical, robots, has_og, has_twitter, og_title_diff)

    imports_block = """import { Metadata } from 'next';
import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';
"""
    gen_meta_block = "\n" + gen_meta + "\n"

    # Find the metadata block boundaries
    pattern = r'export (?:const )?metadata(?:: Metadata)?\s*=\s*\{'
    match = re.search(pattern, content)
    if not match:
        print(f"  [SKIP] No metadata found in: {full_path}")
        return False

    start = match.start()
    # Track brace depth to find end
    brace_depth = 0
    end = start
    in_block = False
    for i in range(start, len(content)):
        c = content[i]
        if c == '{':
            brace_depth += 1
            in_block = True
        elif c == '}':
            brace_depth -= 1
            if in_block and brace_depth == 0:
                end = i + 1
                if end < len(content) and content[end] == ';':
                    end += 1
                break

    if end <= start:
        print(f"  [SKIP] Could not find metadata block end in: {full_path}")
        return False

    # 1. Replace metadata block with gen_meta_block (at same position)
    new_content = content[:start] + gen_meta_block + content[end:]

    # 2. Remove old import type { Metadata } from 'next'
    new_content = re.sub(
        r'import\s+type\s*\{\s*Metadata\s*\}\s*from\s*[\'"]next[\'"]\s*;?\s*\n?',
        '',
        new_content
    )
    # Also remove any duplicate import { Metadata } from 'next'
    new_content = re.sub(
        r'import\s*\{\s*Metadata\s*\}\s*from\s*[\'"]next[\'"]\s*;?\s*\n?',
        '',
        new_content
    )

    # 3. Add new import block at the very top
    new_content = imports_block + new_content.lstrip()

    # 4. Clean up triple blank lines
    new_content = re.sub(r'\n{3,}', '\n\n', new_content)

    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"  [OK] {rel_path}")
    return True

# Also need to add OG title keys for blog and guias pages
def add_og_keys():
    """Add OG title/description keys for pages where OG differs from page."""
    import json

    for lang_file, is_es in [('src/i18n/locales/es.json', True), ('src/i18n/locales/en.json', False)]:
        with open(lang_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # blog OG: different title
        if is_es:
            data['page']['blogOg'] = {
                'title': 'Blog de MangaAura | Guías y tutoriales',
                'description': 'Aprende a crear, publicar y monetizar tu manga con las guías y tutoriales de MangaAura.'
            }
            data['page']['guiasOg'] = {
                'title': 'Guías de Manga | MangaAura',
                'description': 'Guías completas sobre dónde leer manga legal, mejores aplicaciones y plataformas de compra.'
            }
        else:
            data['page']['blogOg'] = {
                'title': 'MangaAura Blog | Guides and tutorials',
                'description': 'Learn to create, publish and monetize your manga with MangaAura guides and tutorials.'
            }
            data['page']['guiasOg'] = {
                'title': 'Manga Guides | MangaAura',
                'description': 'Complete guides on where to read manga legally, best apps and purchase platforms.'
            }

        with open(lang_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write('\n')
        print(f"  [OK] OG keys added to {lang_file}")

print("Adding OG-specific i18n keys...")
add_og_keys()

print("\nConverting pages...")
success = 0
fail = 0
for rel_path, key, canonical, robots, has_og, has_twitter, og_title_diff in PAGES:
    if convert_file(rel_path, key, canonical, robots, has_og, has_twitter, og_title_diff):
        success += 1
    else:
        fail += 1

print(f"\n[OK] Phase 2 complete: {success} files converted, {fail} failed")
