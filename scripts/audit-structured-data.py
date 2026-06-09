import sys, json, re, urllib.request

url = 'https://mangaaura.es/es/comparison/vs/webtoon'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; AuditBot/1.0)'})
html = urllib.request.urlopen(req).read().decode('utf-8')

pattern = r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>'
matches = re.findall(pattern, html, re.DOTALL | re.IGNORECASE)

print(f'Found {len(matches)} JSON-LD blocks\n')
print('=' * 70)

issues = []
for i, block in enumerate(matches):
    block = block.strip()
    try:
        data = json.loads(block)
        if '@graph' in data:
            types = [item.get('@type', '?') for item in data['@graph']]
            print(f'Block {i+1}: @graph [{", ".join(types)}]')
            if not data.get('@context'):
                issues.append(f'Block {i+1}: Missing @context')
            for item in data['@graph']:
                t = item.get('@type')
                if t == 'Product':
                    name = item.get('name', '?')
                    desc = item.get('description', '')
                    offers = item.get('offers', {})
                    brand = item.get('brand', {})
                    print(f'  Product:')
                    print(f'    name: {name}')
                    print(f'    desc length: {len(desc)}')
                    print(f'    brand: {brand.get("name", "?")}')
                    print(f'    price: {offers.get("price","?")} {offers.get("priceCurrency","?")}')
                    fl = item.get('featureList', [])
                    print(f'    featureList: {len(fl)} items')
                    if fl:
                        print(f'    first 3: {fl[:3]}')
                    if not offers.get('availability'):
                        issues.append(f'  Product "{name}": Missing availability')
                elif t == 'ItemList':
                    items = item.get('itemListElement', [])
                    print(f'  ItemList:')
                    print(f'    items: {len(items)}')
                    for j, el in enumerate(items):
                        if el.get('position') != j + 1:
                            issues.append(f'  ItemList: Position mismatch at {j}')
                elif t in ('WebPage', 'BreadcrumbList', 'WebSite', 'Organization', 'SoftwareApplication'):
                    print(f'  {t}: OK')
        else:
            t = data.get('@type', '?')
            print(f'Block {i+1}: {t}')
            if not data.get('@context'):
                issues.append(f'Block {i+1} ({t}): Missing @context')
    except json.JSONDecodeError as e:
        issues.append(f'Block {i+1}: INVALID JSON - {e}')
    print()

print('=' * 70)
if issues:
    print(f'\nIssues found ({len(issues)}):')
    for issue in issues:
        print(f'  \u26a0\ufe0f  {issue}')
else:
    print('\n\u2705 No issues found - all structured data valid!')
