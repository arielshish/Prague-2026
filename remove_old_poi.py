with open('gas_project/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

import re
old_open_poi = re.search(r'    function openPoi\(stopName\) \{\n      const poi = POIS\[stopName\];\n      if \(!poi\) return;\n      \n      id\(\'poiTitle\'\)\.textContent = stopName;\n      id\(\'poiDesc\'\)\.textContent = poi\.desc;\n      id\(\'poiTip\'\)\.textContent = poi\.tip;\n      id\(\'poiImage\'\)\.style\.backgroundImage = `url\(\'\$\{poi\.img\}\'\)`;\n      id\(\'poiMapBtn\'\)\.href = \'https://www\.google\.com/maps/search/\' \+ encodeURIComponent\(stopName \+ \' Prague\'\);\n      \n      id\(\'poiModal\'\)\.classList\.add\(\'show\'\);\n    \}', html)

if old_open_poi:
    html = html.replace(old_open_poi.group(0), '')
    with open('gas_project/index.html', 'w', encoding='utf-8') as f:
        f.write(html)
        print("Removed duplicate")
else:
    print("Could not find duplicate")
