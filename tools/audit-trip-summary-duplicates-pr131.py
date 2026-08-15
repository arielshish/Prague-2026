from pathlib import Path
import re, json, math

app = Path('app.html').read_text(encoding='utf-8')

# Parse PLACE_COORDS keys roughly: 'name': [lat,lng]
coords = []
for m in re.finditer(r"['\"]([^'\"]+)['\"]\s*:\s*\[\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]", app):
    name, lat, lng = m.group(1), float(m.group(2)), float(m.group(3))
    coords.append((name, lat, lng))

# Helper normalization for visible duplicate families.
def norm_name(s):
    s = s.strip().lower()
    s = re.sub(r'\s+', ' ', s)
    s = s.replace('—', '-').replace('–', '-')
    return s

def canonical(s):
    n = norm_name(s)
    if 'pure' in n or 'náplavka' in n or 'naplavka' in n or 'שוק האיכרים' in s:
        return 'naplavka-farmers-market-pure'
    if 'pražská tržnice' in n or 'prazska trznice' in n or 'השוק הגדול' in s or 'הולשוביצה' in s:
        return 'prazska-trznice'
    if 'jerusalem synagogue' in n or 'jubilee synagogue' in n or 'בית הכנסת ירושלים' in s:
        return 'jerusalem-synagogue'
    if 'josefov' in n or 'הרובע היהודי' in s:
        return 'josefov'
    if 'café savoy' in n or 'cafe savoy' in n:
        return 'cafe-savoy'
    if 'prague zoo' in n or 'zoo praha' in n or 'גן החיות' in s:
        return 'prague-zoo'
    if 'museum kampa' in n or 'מוזיאון קמפה' in s:
        return 'museum-kampa'
    if 'lego store' in n:
        return 'lego-store'
    if 'albert' in n and 'palladium' in n:
        return 'albert-palladium'
    if 'manifesto' in n:
        return 'manifesto-market-andel'
    # coordinate is the fallback family, to catch aliases sharing exact/near-exact coords
    return None

families = {}
for name, lat, lng in coords:
    key = canonical(name) or ('gps:%0.5f,%0.5f' % (lat, lng))
    families.setdefault(key, []).append((name, lat, lng))

suspects = []
for key, items in sorted(families.items()):
    # report only families with more than one distinct visible name
    distinct = sorted({x[0] for x in items})
    if len(distinct) > 1:
        suspects.append({
            'key': key,
            'count': len(distinct),
            'names': distinct[:30],
        })

# Focus: groups relevant to summary-visible / recent changes.
focus_keys = [
    'naplavka-farmers-market-pure',
    'prazska-trznice',
    'jerusalem-synagogue',
    'josefov',
    'cafe-savoy',
    'prague-zoo',
    'museum-kampa',
    'lego-store',
    'albert-palladium',
    'manifesto-market-andel',
]
focus = [s for s in suspects if s['key'] in focus_keys]

print('TRIP SUMMARY DUPLICATE AUDIT')
print('PLACE_COORDS parsed:', len(coords))
print('Alias families with >1 visible name:', len(suspects))
print('Focus families:')
print(json.dumps(focus, ensure_ascii=False, indent=2))

# Check whether the clean branch has the wrapper in app.html.
checks = {
    'BUILD_ID_i': "var BUILD_ID = '2026-08-15-i';" in app,
    'raw_wrapper': 'function _tripSummaryDataRaw()' in app,
    'dedupe_wrapper': 'function _tripSummaryData()' in app and '_tripSummaryDedupeRows(_tripSummaryDataRaw())' in app,
    'pure_mapping': 'naplavka-farmers-market-pure' in app,
    'trznice_mapping': 'prazska-trznice' in app,
}
print('Checks:')
print(json.dumps(checks, ensure_ascii=False, indent=2))

# Fail only if the intended fix is missing, not for known alias families.
if not all(checks.values()):
    raise SystemExit('dedupe wrapper checks failed')
print('audit ok')
