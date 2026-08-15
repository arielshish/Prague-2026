from pathlib import Path

src = Path('tools/apply-trip-summary-regression-fix-pr132c.py').read_text(encoding='utf-8')
old = "if 'Burger King — OC Eden' not in app.split(marker, 1)[0]:\n    rep(marker, marker + \"\"\"  // PR #132: Burger King OC Eden aliases moved to PLACE_COORDS"
new = "if True:\n    rep(marker, marker + \"\"\"  // PR #132: Burger King OC Eden aliases moved to PLACE_COORDS"
if old not in src:
    print('::error file=tools/apply-trip-summary-regression-fix-pr132d.py::runtime patch anchor missing', flush=True)
    raise SystemExit('runtime patch anchor missing')
patched = src.replace(old, new, 1)
Path('/tmp/pr132c_forced_coords.py').write_text(patched, encoding='utf-8')
exec(compile(patched, '/tmp/pr132c_forced_coords.py', 'exec'))
