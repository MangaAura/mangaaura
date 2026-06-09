#!/usr/bin/env python3
"""Fix es.json: remove duplicate compareTitle/compareDescription keys and fix JSON issues."""
import re
import json

with open('src/i18n/locales/es.json', 'r', encoding='utf-8') as f:
    content = f.read()

# First, try to parse as-is to find the exact issue
try:
    json.loads(content)
    print("JSON already valid!")
except json.JSONDecodeError as e:
    print(f"JSON error at line {e.lineno}, col {e.colno}, pos {e.pos}")
    # Show context around the error
    start = max(0, e.pos - 80)
    end = min(len(content), e.pos + 80)
    context = content[start:end]
    print(f"Context: {repr(context)}")

# Strategy 1: Remove duplicate compareTitle/compareDescription keys
# (second occurrence around line 2266-2267)
# Strategy 2: Fix any escape issues

# Remove the SECOND occurrence of compareTitle and compareDescription
# by splitting into lines and filtering
lines = content.split('\n')
found_compare_title = False
found_compare_desc = False
new_lines = []
removed = 0

for i, line in enumerate(lines):
    stripped = line.strip()
    if '"compareTitle"' in stripped:
        if found_compare_title:
            print(f"Removing duplicate compareTitle at line {i+1}: {stripped}")
            removed += 1
            continue
        found_compare_title = True
    if '"compareDescription"' in stripped:
        if found_compare_desc:
            print(f"Removing duplicate compareDescription at line {i+1}: {stripped}")
            removed += 1
            continue
        found_compare_desc = True
    new_lines.append(line)

if removed:
    print(f"Removed {removed} duplicate keys")
    content = '\n'.join(new_lines)
else:
    print("No duplicates found, checking for other issues...")

# Try parsing again
try:
    data = json.loads(content)
    print("JSON is valid!")
    # Write cleaned version
    with open('src/i18n/locales/es.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print("File rewritten successfully")
    adm = data.get('admin', {}).get('pages', {}).get('blog', {})
    print(f"blog.compareTitle: {adm.get('compareTitle', 'MISSING')}")
    print(f"blog.compareDescription: {adm.get('compareDescription', 'MISSING')}")
    # Verify no duplicates
    keys = list(adm.keys())
    ct_count = sum(1 for k in keys if k == 'compareTitle')
    cd_count = sum(1 for k in keys if k == 'compareDescription')
    print(f"compareTitle count: {ct_count}")
    print(f"compareDescription count: {cd_count}")
except json.JSONDecodeError as e:
    print(f"JSON still invalid: {e}")
    # More aggressive fix - rebuild the JSON using a more lenient parser
    # Use regex to find and fix the specific problem
    # The issue is likely in the search section
    start = max(0, e.pos - 100)
    end = min(len(content), e.pos + 100)
    print(f"Problem area: {repr(content[start:end])}")
