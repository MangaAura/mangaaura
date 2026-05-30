import os
import re
import json

remaining = []

for root, dirs, files in os.walk('src/app'):
    for f in files:
        if not f.endswith('.tsx') and not f.endswith('.ts'):
            continue
        filepath = os.path.join(root, f)
        with open(filepath, 'r', encoding='utf-8') as fh:
            content = fh.read()

        if 'export const metadata' in content:
            if 'detectLocale' not in content and 'generateMetadata' not in content:
                remaining.append((filepath, content))

# Filter out admin pages and categorize
results = []
for path, content in remaining:
    normalized = path.replace(os.sep, '/')
    # Skip admin
    if '/admin/' in normalized:
        continue
    if '(protected)/admin/' in normalized:
        continue

    # Extract metadata info
    title_match = re.search(r"title:\s*'([^']+)", content)
    desc_match = re.search(r"description:\s*'([^']+)", content)
    has_og = 'openGraph:' in content
    has_twitter = 'twitter:' in content
    has_canonical = 'canonical:' in content
    has_robots = 'robots:' in content
    has_full_desc = desc_match is not None
    desc_text = desc_match.group(1) if desc_match else ''

    display_path = normalized.replace('src/', '', 1)

    results.append({
        'path': display_path,
        'full_path': path,
        'title': title_match.group(1) if title_match else 'N/A',
        'description': desc_text,
        'has_description': has_full_desc,
        'has_og': has_og,
        'has_twitter': has_twitter,
        'has_canonical': has_canonical,
        'has_robots': has_robots,
    })

# Categorize
for item in results:
    p = item['path']
    if p.startswith('app/auth/'):
        item['category'] = 'Auth'
    elif 'economy' in p:
        item['category'] = 'Economy'
    elif 'checkout' in p or '/cart/' in p:
        item['category'] = 'Checkout'
    elif '(protected)' in p:
        item['category'] = 'Protected'
    elif '(public)' in p:
        item['category'] = 'Public'
    elif 'reader' in p:
        item['category'] = 'Reader'
    elif 'creator' in p:
        item['category'] = 'Creator'
    else:
        item['category'] = 'Other'

# Sort by category then path
results.sort(key=lambda x: (x['category'], x['path']))

# Print categorized list
print(f'Total non-admin pages to convert: {len(results)}')
print()
categories = {}
for item in results:
    cat = item['category']
    if cat not in categories:
        categories[cat] = []
    categories[cat].append(item)

for cat in sorted(categories.keys()):
    items = categories[cat]
    print(f'## {cat} ({len(items)})')
    for item in items:
        has = []
        if item['has_description']:
            has.append('desc')
        if item['has_og']:
            has.append('og')
        if item['has_twitter']:
            has.append('twitter')
        if item['has_canonical']:
            has.append('canonical')
        if item['has_robots']:
            has.append('robots')
        extra = f' [{", ".join(has)}]' if has else ''
        print(f'  {item["path"]}')
        print(f'    -> {item["title"]}{extra}')
    print()

# Output JSON for processing
with open('scripts/non-admin-metadata.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
print('JSON output written to scripts/non-admin-metadata.json')
