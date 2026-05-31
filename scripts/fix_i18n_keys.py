import json, re

# Read the page to extract all i18n keys used
with open('src/app/(public)/como-funciona/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all t('page.comoFunciona.XXX') patterns
keys_in_page = set()
pattern = r"t\('page\.comoFunciona\.([^']+)'"
for match in re.finditer(pattern, content):
    keys_in_page.add(match.group(1))

print("Keys used in page:")
for k in sorted(keys_in_page):
    print(f"  - {k}")

# Read translation files
with open('src/i18n/locales/es.json', 'r', encoding='utf-8') as f:
    es = json.load(f)
with open('src/i18n/locales/en.json', 'r', encoding='utf-8') as f:
    en = json.load(f)

es_keys = set(es.get('page', {}).get('comoFunciona', {}).keys())
en_keys = set(en.get('page', {}).get('comoFunciona', {}).keys())

print(f"\nKeys in es.json: {len(es_keys)}")
print(f"Keys in en.json: {len(en_keys)}")

missing_es = keys_in_page - es_keys
missing_en = keys_in_page - en_keys

if missing_es:
    print(f"\nMissing in es.json ({len(missing_es)}):")
    for k in sorted(missing_es):
        print(f"  - {k}")

if missing_en:
    print(f"\nMissing in en.json ({len(missing_en)}):")
    for k in sorted(missing_en):
        print(f"  - {k}")

extra_es = es_keys - keys_in_page
extra_en = en_keys - keys_in_page

if extra_es:
    print(f"\nExtra keys in es.json (in translations but not in page): {len(extra_es)}")
    for k in sorted(extra_es):
        print(f"  - {k}")

if extra_en:
    print(f"\nExtra keys in en.json (in translations but not in page): {len(extra_en)}")
    for k in sorted(extra_en):
        print(f"  - {k}")

if not missing_es and not missing_en:
    print("\n✅ All keys match!")
else:
    print("\n❌ Mismatch detected!")
