"""Download official platform logo files."""
import urllib.request
import re
import os

os.makedirs('public/logos', exist_ok=True)

# 1. Shonen Jump SVG from Wikimedia Commons
print("=== Shonen Jump ===")
url = 'https://commons.wikimedia.org/wiki/File:Weekly_Shonen_Jump_logo.svg'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
resp = urllib.request.urlopen(req, timeout=15)
html = resp.read().decode('utf-8')
svg_urls = re.findall(r'https://upload\.wikimedia\.org/wikipedia/commons/[^"\']+\.svg', html)
print(f'Found {len(svg_urls)} SVG URLs')
for u in svg_urls[:3]:
    print(f'  {u}')

if svg_urls:
    svg_req = urllib.request.Request(svg_urls[0], headers={'User-Agent': 'Mozilla/5.0'})
    svg_data = urllib.request.urlopen(svg_req, timeout=15).read()
    text = svg_data.decode('utf-8')
    with open('public/logos/shonenjump.svg', 'wb') as f:
        f.write(svg_data)
    print(f'Downloaded: {len(text)} chars')
    print(text[:500])

# 2. Webtoon - try from their CDN
print("\n=== Webtoon ===")
webtoon_url = 'https://webtoons-static.pstatic.net/image/static/pc/sprite/sp_webtoon_svg_e0eb7ebe.svg'
req2 = urllib.request.Request(webtoon_url, headers={'User-Agent': 'Mozilla/5.0'})
resp2 = urllib.request.urlopen(req2, timeout=15)
sprite_data = resp2.read()
with open('public/logos/webtoon-sprite.svg', 'wb') as f:
    f.write(sprite_data)
print(f'Webtoon sprite: {len(sprite_data)} bytes already saved')

# Try to find the logo in the sprite - look for large path groups
sprite_text = sprite_data.decode('utf-8')
# Split by </g> to find logical groups
groups = sprite_text.split('</g>')
print(f'Found {len(groups)} groups in sprite')
# Look for groups with many paths (logo would be a substantial element)
large_groups = [(i, len(g)) for i, g in enumerate(groups) if len(g) > 500]
print(f'Large groups (>500 chars): {len(large_groups)}')
for idx, size in large_groups[:10]:
    preview = groups[idx][:100].replace('\n', ' ').strip()
    print(f'  Group {idx}: {size} chars - {preview}...')

print("\nDone!")
