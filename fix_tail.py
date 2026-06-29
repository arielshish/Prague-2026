with open('gas_project/Code.gs', 'r', encoding='utf-8') as f:
    code = f.read()

import re
# Keep everything up to the end of moveAttraction function
code = re.sub(r'(function moveAttraction.*?\}\n\}\n).*', r'\1', code, flags=re.DOTALL)

with open('gas_project/Code.gs', 'w', encoding='utf-8') as f:
    f.write(code)
