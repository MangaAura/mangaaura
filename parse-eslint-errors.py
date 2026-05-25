import re
with open('eslint-out.txt', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

current_file = ''
file_errors = {}
for line in lines:
    stripped = line.strip()
    if re.match(r'^[A-Z]:\\\\', stripped) or stripped.startswith('src/'):
        current_file = stripped
    elif ' error ' in stripped and current_file:
        file_errors.setdefault(current_file, []).append(stripped)

print(f'Total files with errors: {len(file_errors)}')
for f, errs in sorted(file_errors.items()):
    print(f'{f}: {len(errs)} error(s)')
    for e in errs[:2]:
        print(f'  -> {e}')
    if len(errs) > 2:
        print(f'  ... and {len(errs)-2} more')
