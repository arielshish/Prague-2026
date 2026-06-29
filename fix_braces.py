import re
with open('gas_project/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# I will find the exact string and remove the extra braces.
bad_str = """      syncAppData();
      renderChecklist();
    }
    

    }
    

    

    }"""

good_str = """      syncAppData();
      renderChecklist();
    }"""

html = html.replace(bad_str, good_str)

with open('gas_project/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
