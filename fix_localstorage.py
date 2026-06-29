import re
with open('gas_project/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

safe_storage = """
    // Safe LocalStorage Wrapper
    const safeStorage = {
      getItem: function(key) {
        try { return localStorage.getItem(key); } catch(e) { return null; }
      },
      setItem: function(key, val) {
        try { localStorage.setItem(key, val); } catch(e) {}
      }
    };
"""

# Insert safe_storage right after "var currentPoiId = null;"
html = html.replace('var currentPoiId = null; // For moving attractions', 'var currentPoiId = null; // For moving attractions\n' + safe_storage)

# Replace all localStorage occurrences
html = html.replace('localStorage.getItem', 'safeStorage.getItem')
html = html.replace('localStorage.setItem', 'safeStorage.setItem')

with open('gas_project/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
