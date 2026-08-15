from pathlib import Path
import re

app = Path('app.html').read_text(encoding='utf-8')

def extract_object(src, name):
    m = re.search(r'(?:var|const|let)\s+' + re.escape(name) + r'\s*=\s*\{', src)
    if not m:
        return ''
    start = src.find('{', m.start())
    depth = 0
    quote = None
    esc = False
    for i in range(start, len(src)):
        ch = src[i]
        if quote:
            if esc:
                esc = False
            elif ch == '\\':
                esc = True
            elif ch == quote:
                quote = None
            continue
        if ch in ('"', "'", '`'):
            quote = ch
            continue
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                return src[start:i+1]
    return ''

def is_place_like(x):
    x = re.sub(r'\s+', ' ', x).strip()
    if len(x) < 2 or len(x) > 90:
        return False
    bad_chars = set('`{}[];=<>()')
    if any(ch in bad_chars for ch in x):
        return False
    if x.startswith('#') or x.startswith('.') or x.startswith('/'):
        return False
    if re.fullmatch(r'[A-Za-z0-9_\-]+', x):
        return False
    bad_words = [
        'function','localStorage','Firestore','firebase','console','innerHTML','onclick','style','class',
        'BUILD_ID','rgba','px','http','data:image','blob','querySelector','document.','window.',
        'גרסה','שמור','שתף','הוסף','ערוך','מחק','סגור','טעינה','שגיאה','בחר','אישור','ביטול'
    ]
    if any(b in x for b in bad_words):
        return False
    # Must contain a real Hebrew or Latin letter, not only symbols/numbers.
    if not re.search(r'[A-Za-zא-ת]', x):
        return False
    return True

coords_obj = extract_object(app, 'PLACE_COORDS')
coord_names = set(re.findall(r"['\"]([^'\"]+)['\"]\s*:\s*\[\s*-?\d", coords_obj))

candidates = set()
for pat in [
    r"\bname\s*:\s*['\"]([^'\"]{2,120})['\"]",
    r"\bplace\s*:\s*['\"]([^'\"]{2,120})['\"]",
    r"\btitle\s*:\s*['\"]([^'\"]{2,120})['\"]",
]:
    for x in re.findall(pat, app):
        x = re.sub(r'\s+', ' ', x).strip()
        if is_place_like(x):
            candidates.add(x)

# Prefer names that appear in proximity to schedule/place metadata.
nearby_candidates = set()
for m in re.finditer(r"['\"]([^'\"]{2,120})['\"]", app):
    x = re.sub(r'\s+', ' ', m.group(1)).strip()
    if not is_place_like(x):
        continue
    window = app[max(0, m.start()-240):m.end()+240]
    if any(marker in window for marker in ['emoji', 'icon', 'coords', 'PLACE_COORDS', 'gps', 'mapUrl', 'stops', 'type', 'desc']):
        nearby_candidates.add(x)

candidates |= nearby_candidates
missing = sorted([x for x in candidates if x not in coord_names])

lines = []
lines.append('# Missing Trip Summary Coordinates Audit')
lines.append('')
lines.append('Generated from `app.html`.')
lines.append('')
lines.append(f'- PLACE_COORDS entries: {len(coord_names)}')
lines.append(f'- Candidate place-like names after filtering: {len(candidates)}')
lines.append(f'- Missing candidate coordinates after filtering: {len(missing)}')
lines.append('')
lines.append('## Missing candidates')
lines.append('')
for x in missing:
    lines.append(f'- `{x}`')
lines.append('')
lines.append('## Notes')
lines.append('')
lines.append('- Static audit only; manually verify each candidate before adding coordinates.')
lines.append('- False positives are still possible, but CSS/UI/code strings are filtered out.')
Path('docs/MISSING_TRIP_COORDS_AUDIT.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('\n'.join(lines))
