import os
import re

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
                remaining.append(filepath)

categories = {}
for path in sorted(remaining):
    normalized = path.replace(os.sep, '/')
    if normalized.startswith('src/app/auth/'):
        cat = 'Auth'
    elif 'economy' in normalized:
        cat = 'Economy'
    elif 'checkout' in normalized or 'cart' in normalized:
        cat = 'Checkout'
    elif '(protected)' in normalized:
        cat = 'Protected'
    elif '(public)' in normalized:
        cat = 'Public'
    elif 'reader' in normalized:
        cat = 'Reader'
    elif 'creator' in normalized:
        cat = 'Creator'
    elif 'admin' in normalized:
        cat = 'Admin'
    else:
        cat = 'Other'

    if cat not in categories:
        categories[cat] = []

    with open(path, 'r', encoding='utf-8') as fh:
        content = fh.read()
    title_match = re.search(r"title:\s*'([^']+)", content)
    title = title_match.group(1) if title_match else 'N/A'
    display = normalized.replace('src/', '', 1)
    categories[cat].append((display, title))

print('=' * 70)
print('PAGES WITH HARDCODED METADATA (not yet converted to i18n)')
print('=' * 70)
total = 0
for cat in sorted(categories.keys()):
    items = categories[cat]
    print(f'\n## {cat} ({len(items)})')
    for path, title in items:
        print(f'  {path}')
        print(f'     Title: {title}')
        total += 1

print(f'\n{"=" * 70}')
print(f'Total remaining: {total}')
print('=' * 70)
