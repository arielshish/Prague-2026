#!/usr/bin/env python3
"""
sync_gas.py — מסנכרן app.html → index.html + gas_project/index.html
מסיר את כל שכבת GitHub Pages (Firebase, login, JSONP) ומשאיר קוד נקי ל-GAS.
"""
import re, shutil

SRC = 'app.html'
DST = ['index.html', 'gas_project/index.html']

GAS_URL = 'AKfycby3K9gKoVwWZY7tUVf8hUDLnM6WAryzBwmBLxm82XzD8u_bn5URmg9Roixxf-vdrpn6'

with open(SRC, encoding='utf-8') as f:
    content = f.read()

# 1. הסר Firebase SDK tags
content = re.sub(r'<!-- Firebase SDK.*?-->\n', '', content)
content = re.sub(r'<script src="https://www\.gstatic\.com/firebasejs/.*?></script>\n', '', content)

# 2. הסר Firebase init script block
content = re.sub(r'<script>\n// Firebase init.*?</script>\n', '', content, flags=re.DOTALL)

# 3. הסר Firebase polyfill script block
content = re.sub(r'<script>\n// Firebase Firestore polyfill.*?</script>\n', '', content, flags=re.DOTALL)

# 4. הסר loginScreen div
login_start = content.find('<div id="loginScreen"')
if login_start != -1:
    depth = 0
    i = login_start
    while i < len(content):
        if content[i:i+4] == '<div':
            depth += 1
        elif content[i:i+6] == '</div>':
            depth -= 1
            if depth == 0:
                end = i + 6
                # skip trailing newline
                if end < len(content) and content[end] == '\n':
                    end += 1
                content = content[:login_start] + content[end:]
                break
        i += 1

# 5. הסר style="display:none" מ-app div
content = content.replace('<div id="app" style="display:none">', '<div id="app">')

# 6. החלף JSONP triggerReminderEmail ב-google.script.run
old_jsonp = f'''var GAS_URL = 'https://script.google.com/macros/s/{GAS_URL}/exec';

function triggerReminderEmail() {{
  var btn = document.getElementById('btnTriggerEmail');
  if (btn) {{ btn.disabled = true; btn.textContent = '⏳ שולח...'; }}
  var script = document.createElement('script');
  var cb = '_triggerCb' + Date.now();
  window[cb] = function(result) {{
    delete window[cb];
    try {{ document.head.removeChild(script); }} catch(e) {{}}
    if (btn) {{ btn.disabled = false; btn.textContent = '🔔 שלח תזכורת עכשיו'; }}
    if (result && result.ok) {{
      showToast('✅ מייל תזכורת נשלח לכל המשפחה!', 3000);
    }} else {{
      showToast('⚠️ שגיאה: ' + (result && result.error || 'נסה שוב'), 4000);
    }}
  }};
  setTimeout(function() {{
    if (window[cb]) {{
      delete window[cb];
      if (btn) {{ btn.disabled = false; btn.textContent = '🔔 שלח תזכורת עכשיו'; }}
      showToast('⏱️ GAS איטי — נסה שוב', 3000);
    }}
  }}, 30000);
  script.src = GAS_URL + '?action=sendTestReminder&callback=' + cb;
  document.head.appendChild(script);
}}'''

new_gas_fn = '''function triggerReminderEmail() {
  var btn = document.getElementById('btnTriggerEmail');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ שולח...'; }
  google.script.run
    .withSuccessHandler(function(result) {
      if (btn) { btn.disabled = false; btn.textContent = '🔔 שלח תזכורת עכשיו'; }
      if (result && result.ok) {
        showToast('✅ מייל תזכורת נשלח לכל המשפחה!', 3000);
      } else {
        showToast('⚠️ שגיאה: ' + (result && result.error || 'נסה שוב'), 4000);
      }
    })
    .withFailureHandler(function(e) {
      if (btn) { btn.disabled = false; btn.textContent = '🔔 שלח תזכורת עכשיו'; }
      showToast('⚠️ שגיאה: ' + (e && e.message || e), 4000);
    })
    .sendTestReminder();
}'''

if old_jsonp in content:
    content = content.replace(old_jsonp, new_gas_fn)
    print('✅ הוחלף JSONP → google.script.run')
else:
    print('⚠️  JSONP block לא נמצא — בדוק ידנית')

# בדיקות
checks = [
    ('loginScreen',              False),
    ('passwordInput',            False),
    ('gstatic.com/firebasejs',   False),
    ('Firebase Firestore polyfill', False),
    ('GAS_URL',                  False),
    ('remindersDone',            True),
    ('showReminderDetail',       True),
    ('isGas',                    True),
]
all_ok = True
for key, expected in checks:
    found = key in content
    ok = found == expected
    print(f"{'✅' if ok else '❌'} {key}")
    if not ok:
        all_ok = False

if all_ok:
    for dst in DST:
        with open(dst, 'w', encoding='utf-8') as f:
            f.write(content)
    print(f'\n✅ נכתב ל: {", ".join(DST)}')
else:
    print('\n❌ לא נכתב — יש שגיאות')
