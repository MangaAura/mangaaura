#!/usr/bin/env python3
"""Apply all GEO comparison SEO changes to es.json and en.json safely via JSON parsing."""
import json
import os

# ============== ES.JSON ==============
with open('src/i18n/locales/es.json', 'r', encoding='utf-8') as f:
    es = json.load(f)

# 1) page.comparison meta
cmp_meta = es.get('page', {}).get('comparison', {})
cmp_meta['title'] = 'Alternativas a Webtoon y MangaPlus | Comparativa MangaAura 2026'
cmp_meta['description'] = 'Descubre las mejores alternativas a Webtoon, Manga Plus y otras plataformas de manga. Comparamos MangaAura con Manga Plus, Webtoon, Tapas, Shonen Jump, MangaDex e INKR para lectores y creadores.'
cmp_meta['ogDescription'] = 'Comparativa de alternativas a Webtoon, Manga Plus y más. Analizamos MangaAura frente a las principales plataformas de manga para lectores y creadores.'
cmp_meta['twitterDescription'] = '¿Buscas alternativas a Webtoon o Manga Plus? Comparamos MangaAura con las plataformas de manga más populares. La guía definitiva para lectores y creadores.'

# 2) comparison.heroTitle
cmp_hero = es.get('page', {}).get('howItWorks', {}).get('comparison', {})
if cmp_hero:
    cmp_hero['heroTitle'] = 'Alternativas a Webtoon, MangaPlus y Más | Comparativa Completa'
    cmp_hero['heroSubtitle'] = '¿Buscas alternativas a Webtoon, Manga Plus u otras plataformas de manga? Descubre cómo MangaAura se compara con las más importantes del sector. Lectura, creación, IA, gamificación y crowdfunding en un solo lugar.'

# 3) blog.compareTitle / blog.compareDescription
es['admin']['pages']['blog']['compareTitle'] = '¿Alternativas a Webtoon o Manga Plus?'
es['admin']['pages']['blog']['compareDescription'] = 'Descubre cómo se compara MangaAura con otras plataformas de manga en nuestra guía comparativa completa.'

with open('src/i18n/locales/es.json', 'w', encoding='utf-8') as f:
    json.dump(es, f, ensure_ascii=False, indent=2)
    f.write('\n')
print('es.json: OK')

# ============== EN.JSON ==============
with open('src/i18n/locales/en.json', 'r', encoding='utf-8') as f:
    en = json.load(f)

# 1) page.comparison meta
cmp_meta_en = en.get('page', {}).get('comparison', {})
cmp_meta_en['title'] = 'Alternatives to Webtoon and MangaPlus | MangaAura Comparison 2026'
cmp_meta_en['description'] = 'Discover the best alternatives to Webtoon, Manga Plus and other manga platforms. We compare MangaAura with Manga Plus, Webtoon, Tapas, Shonen Jump, MangaDex and INKR for readers and creators.'
cmp_meta_en['ogDescription'] = 'Looking for alternatives to Webtoon, Manga Plus and other manga platforms? We compare MangaAura with all the leading platforms for readers and creators.'
cmp_meta_en['twitterDescription'] = 'Looking for alternatives to Webtoon or Manga Plus? See how MangaAura stacks up against the top manga platforms. The ultimate comparison guide for readers and creators.'

# 2) comparison.heroTitle
cmp_hero_en = en.get('page', {}).get('howItWorks', {}).get('comparison', {})
if cmp_hero_en:
    cmp_hero_en['heroTitle'] = 'Alternatives to Webtoon, MangaPlus and More | Full Comparison'

# 3) blog.compareTitle / blog.compareDescription
en['admin']['pages']['blog']['compareTitle'] = 'Looking for alternatives to Webtoon or Manga Plus?'
en['admin']['pages']['blog']['compareDescription'] = 'See how MangaAura stacks up against other manga platforms in our full comparison guide.'

with open('src/i18n/locales/en.json', 'w', encoding='utf-8') as f:
    json.dump(en, f, ensure_ascii=False, indent=2)
    f.write('\n')
print('en.json: OK')

# ============== VALIDATION ==============
print('\n--- Validation ---')
print(f'es.json blog.compareTitle: {es["admin"]["pages"]["blog"]["compareTitle"]}')
print(f'en.json blog.compareTitle: {en["admin"]["pages"]["blog"]["compareTitle"]}')
print(f'es.json page.comparison.title: {es["page"]["comparison"]["title"]}')
print(f'en.json page.comparison.title: {en["page"]["comparison"]["title"]}')

# Check no duplicate keys
blog_keys = list(es['admin']['pages']['blog'].keys())
ct_count = sum(1 for k in blog_keys if k == 'compareTitle')
cd_count = sum(1 for k in blog_keys if k == 'compareDescription')
print(f'es.json compareTitle count: {ct_count} (should be 1)')
print(f'es.json compareDescription count: {cd_count} (should be 1)')

print('\nAll changes applied successfully!')
