from pathlib import Path
import re
from collections import defaultdict

app = Path('app.html').read_text(encoding='utf-8')

def extract_obj_after(marker):
    idx = app.find(marker)
    if idx < 0:
        return ''
    start = app.find('{', idx)
    if start < 0:
        return ''
    depth=0; quote=None; esc=False
    for i in range(start, len(app)):
        ch=app[i]
        if quote:
            if esc: esc=False
            elif ch=='\\': esc=True
            elif ch==quote: quote=None
            continue
        if ch in ('"', "'", '`'):
            quote=ch; continue
        if ch=='{': depth+=1
        elif ch=='}':
            depth-=1
            if depth==0: return app[start:i+1]
    return ''

coords_obj = extract_obj_after('PLACE_COORDS')
coords = set(re.findall(r"['\"]([^'\"]+)['\"]\s*:\s*\[\s*-?\d", coords_obj))

candidates = defaultdict(set)

def add(name, source):
    if not name: return
    name = re.sub(r'\s+', ' ', str(name)).strip()
    if len(name) < 2 or len(name) > 90: return
    bad_sub = ['http', 'rgba', 'linear-gradient', 'function', 'localStorage', 'Firestore', 'firebase', 'innerHTML', 'onclick', 'style=', '</', '<div', '#', 'px', 'var ', 'const ', 'return ', 'querySelector', 'document.', 'console.', 'Date.now', 'appdata/', 'prague_', 'BUILD_ID']
    if any(b in name for b in bad_sub): return
    # remove obvious UI button labels and generic labels
    bad_exact = {'הוסף','שמור','בטל','סגור','ערוך','מחק','איפוס','יום','ללא יום','נוסף ידנית לסיכום','הסתר','הצג','כן','לא','כללי'}
    if name in bad_exact: return
    candidates[name].add(source)

# explicit structured names/places/titles
for key in ['name','place','title']:
    for x in re.findall(r"\b"+key+r"\s*:\s*['\"]([^'\"]{2,100})['\"]", app):
        add(x, key)

# trip summary manual add placeholder is free text, cannot enumerate runtime data.
# Pull known array-ish text entries near route/map/summary context.
for m in re.finditer(r"['\"]([^'\"]{2,100})['\"]", app):
    x=m.group(1)
    window=app[max(0,m.start()-140):m.end()+140]
    if any(tok in window for tok in ['stops', 'emoji', 'mapUrl', 'PLACE_COORDS', 'visited', 'tripSummary', 'coords', 'lat', 'lng']):
        add(x, 'context')

# focus: names that are likely places. Keep those with coords, or source looks structured, or place-like chars/words.
place_words = ['Prague','Praha','Palladium','Primark','Kampa','Cat','Makakiko','Sushi','Pizza','Pasta','Café','Cafe','Savoy','Výtopna','Rail','רכבות','ממלכת','Aquapalace','Chodov','Letná','Letna','Hamleys','LEGO','Metropole','Zličín','Zlicin','K12','BBQ','Taiyaki','Skalka','Action','Pepco','Tesco','Museum','מוזיאון','פארק','כיכר','בית הכנסת','Synagogue','Castle','Zoo','גן']
filtered=[]
for name, sources in candidates.items():
    if name in coords or any(w in name for w in place_words) or ('name' in sources and not any(x in name for x in ['לחץ','בחר','כרטיס','עלות','מומלץ'])):
        filtered.append((name, sorted(sources), name in coords))
filtered.sort(key=lambda t: (not t[2], t[0].lower()))

missing=[x for x in filtered if not x[2]]
withgps=[x for x in filtered if x[2]]

lines=[]
lines.append('# Full Trip Coordinate Audit')
lines.append('')
lines.append('Generated on branch `feature/missing-trip-summary-coords` from `app.html`.')
lines.append('')
lines.append(f'- PLACE_COORDS entries: {len(coords)}')
lines.append(f'- Filtered place-like candidates: {len(filtered)}')
lines.append(f'- With GPS: {len(withgps)}')
lines.append(f'- Missing GPS / needs review: {len(missing)}')
lines.append('')
lines.append('## Missing GPS / needs review')
lines.append('')
for name, sources, _ in missing:
    lines.append(f'- `{name}` — sources: {", ".join(sources)}')
lines.append('')
lines.append('## With GPS')
lines.append('')
for name, sources, _ in withgps:
    lines.append(f'- `{name}` — sources: {", ".join(sources)}')
lines.append('')
lines.append('## Runtime manual entries')
lines.append('')
lines.append('Manual entries saved by the user in localStorage/Firestore cannot be enumerated from repository code. The code resolves manual entry GPS by exact `PLACE_COORDS[name]`; if a manually typed name is not listed in PLACE_COORDS, it will have `coords = null`.')
Path('docs/FULL_TRIP_COORDS_AUDIT.md').write_text('\n'.join(lines)+'\n', encoding='utf-8')
print('\n'.join(lines[:120]))
print('---REPORT_WRITTEN docs/FULL_TRIP_COORDS_AUDIT.md')
