import base64
from PIL import Image
import io

def get_base64(path):
    img = Image.open(path)
    img = img.resize((800, 450)) # Resize to reduce size
    buffer = io.BytesIO()
    img.save(buffer, format="WebP", quality=50) # Heavy compression for fast load
    return "data:image/webp;base64," + base64.b64encode(buffer.getvalue()).decode('utf-8')

castle_b64 = get_base64('/Users/arielshish/.gemini/antigravity/brain/902608d0-de97-4426-9332-d9e65827bb13/anime_prague_castle_1782675252675.jpg')
square_b64 = get_base64('/Users/arielshish/.gemini/antigravity/brain/902608d0-de97-4426-9332-d9e65827bb13/anime_prague_town_square_1782675261724.jpg')

with open('gas_project/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace dashboard images
html = html.replace("url('https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Prague_Old_Town_Square.jpg/800px-Prague_Old_Town_Square.jpg')", f"url('{square_b64}')")
html = html.replace("url('https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Prague_Castle_from_Charles_Bridge.jpg/800px-Prague_Castle_from_Charles_Bridge.jpg')", f"url('{castle_b64}')")

with open('gas_project/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Images injected successfully!")
