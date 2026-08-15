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

coords_obj = extract_object(app, 'PLACE_COORDS')
coord_names = sorted(set(re.findall(r"['\"]([^'\"]+)['\"]\s*:\s*\[\s*-?\d", coords_obj)))
all_strings = sorted(set(re.findall(r"['\"]([^'\"]{2,140})['\"]", app)))
terms = [
    'K12','12K','BBQ','Sushi','Fat Cat','Taiyaki','Metropole','Zličín','Zlicin','Primark',
    'Action','Hamleys','LEGO','Palladium','Výtopna','Vytopna','רכבות','Království','Kralovstvi',
    'Pasta','Pizza','Café Savoy','Savoy','Kampa','Aquapalace','Makakiko','Chodov','Letna','Letná'
]

lines = []
lines.append('# Targeted Trip Coordinate Audit')
lines.append('')
lines.append('Generated from `app.html`.')
lines.append('')
lines.append(f'- PLACE_COORDS entries: {len(coord_names)}')
lines.append('')
for term in terms:
    low = term.lower()
    coord_hits = [x for x in coord_names if low in x.lower()]
    string_hits = [x for x in all_strings if low in x.lower() and len(x) < 120]
    # remove obvious code-ish hits
    string_hits = [x for x in string_hits if not any(b in x for b in ['function','localStorage','console','onclick','innerHTML','http','rgba','px','document.','window.'])]
    lines.append(f'## {term}')
    lines.append('')
    lines.append('### PLACE_COORDS hits')
    lines.extend([f'- `{x}`' for x in coord_hits] or ['- none'])
    lines.append('')
    lines.append('### App string hits')
    lines.extend([f'- `{x}`' for x in string_hits[:30]] or ['- none'])
    if len(string_hits) > 30:
        lines.append(f'- ... {len(string_hits)-30} more')
    lines.append('')
Path('docs/TARGETED_TRIP_COORDS_AUDIT.md').write_text('\n'.join(lines), encoding='utf-8')
print('\n'.join(lines))
