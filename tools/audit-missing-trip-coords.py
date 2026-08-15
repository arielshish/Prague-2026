from pathlib import Path
import re

app = Path('app.html').read_text(encoding='utf-8')

def extract_object(src, name):
    m = re.search(r'(?:var|const|let)\s+' + re.escape(name) + r'\s*=\s*\{', src)
    if not m:
        return ''
    start = src.find('{', m.start())
    depth = 0
    for i in range(start, len(src)):
        ch = src[i]
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                return src[start:i+1]
    return ''

coords_obj = extract_object(app, 'PLACE_COORDS')
coord_names = set(re.findall(r"['\"]([^'\"]+)['\"]\s*:\s*\[\s*-?\d", coords_obj))

# Candidate place names from structured place-like objects and display lists.
patterns = [
    r"\bname\s*:\s*['\"]([^'\"]{2,120})['\"]",
    r"\bplace\s*:\s*['\"]([^'\"]{2,120})['\"]",
    r"\btitle\s*:\s*['\"]([^'\"]{2,120})['\"]",
]
candidates = set()
for pat in patterns:
    for x in re.findall(pat, app):
        x = re.sub(r'\s+', ' ', x).strip()
        if not x:
            continue
        # filter obvious UI labels, not places
        if any(bad in x for bad in ['function', 'localStorage', 'Firestore', 'BUILD_ID', 'גרסה', 'שמור', 'שתף', 'הוסף', 'ערוך']):
            continue
        if len(x) < 2 or len(x) > 100:
            continue
        candidates.add(x)

# Also find explicit stop-like strings in known arrays/objects by nearby emoji/type/coords context.
for m in re.finditer(r"['\"]([^'\"]{2,120})['\"]", app):
    x = re.sub(r'\s+', ' ', m.group(1)).strip()
    if not x or x in coord_names or x in candidates:
        continue
    window = app[max(0, m.start()-180):m.end()+180]
    if any(marker in window for marker in ['emoji', 'icon', 'coords', 'PLACE_COORDS', 'lat', 'lng', 'stop', 'stops', 'type']):
        if not any(bad in x for bad in ['http', 'rgba', 'px', 'function', 'localStorage', 'console.', 'Firestore', 'firebase', 'innerHTML', 'onclick']):
            candidates.add(x)

missing = sorted([x for x in candidates if x not in coord_names])

lines = []
lines.append('# Missing Trip Summary Coordinates Audit')
lines.append('')
lines.append('Generated from `app.html`.')
lines.append('')
lines.append(f'- PLACE_COORDS entries: {len(coord_names)}')
lines.append(f'- Candidate place-like names: {len(candidates)}')
lines.append(f'- Missing candidate coordinates: {len(missing)}')
lines.append('')
lines.append('## Missing candidates')
lines.append('')
for x in missing:
    lines.append(f'- `{x}`')
lines.append('')
lines.append('## Notes')
lines.append('')
lines.append('- This is a static audit only.')
lines.append('- It may include UI labels if they appear in place-like structures.')
lines.append('- Do not add coordinates before manual review/verification.')
Path('docs/MISSING_TRIP_COORDS_AUDIT.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('\n'.join(lines))
