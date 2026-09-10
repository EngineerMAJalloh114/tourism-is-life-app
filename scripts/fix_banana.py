import urllib.request, time
from pathlib import Path

UA = "Mozilla/5.0 (compatible; TIL-downloader/1.0)"
url = "https://upload.wikimedia.org/wikipedia/commons/f/fb/Banana_Island%2C_Sierra_Leone_%28West_Africa%29_1905_%2812312269234%29.jpg"
dest = Path.cwd() / "public" / "images" / "islands" / "banana-island-sierra-leone-1905.jpg"
dest.parent.mkdir(parents=True, exist_ok=True)
print(f"Saving to: {dest}")
req = urllib.request.Request(url, headers={"User-Agent": UA})
with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
    f.write(r.read())
print(f"Done: {dest.stat().st_size:,} bytes")
