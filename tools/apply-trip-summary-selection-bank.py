from pathlib import Path
import re, subprocess

APP = Path('app.html')
app = APP.read_text(encoding='utf-8')
old_app = subprocess.check_output(['git', 'show', 'origin/main:app.html'], text=True)

if "function openTripSummarySelectionBank()" in app:
    raise SystemExit('selection bank already exists')

# Add bank functions before the existing manual editor function.
anchor