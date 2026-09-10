import json, sys, time, urllib.parse, urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
UA = "TIL-image-downloader/1.0 (https://tourismislife.com; info@tourismislife.com)"

DOWNLOADS = [
    ("islands/banana-island-sierra-leone-1905.jpg", "https://upload.wikimedia.org/wikipedia/commons/f/fb/Banana_Island%2C_Sierra_Leone_%28West_Africa%29_1905_%2812312269234%29.jpg"),
    ("cities/aberdeen-beach-road.jpg", "https://upload.wikimedia.org/wikipedia/commons/9/95/Aberdeen_beach_road.jpg"),
    ("rainforest/hofstra-landscape-004.jpg", "https://upload.wikimedia.org/wikipedia/commons/c/c3/SierraLeone_Hofstra_004.jpg"),
    ("rainforest/hofstra-trees-hills-299.jpg", "https://upload.wikimedia.org/wikipedia/commons/e/ef/SierraLeone_Hofstra_299.jpg"),
]

BASE = Path(__file__).parent.parent.parent
PUBLIC_IMAGES = BASE / "public" / "images"

for rel, url in DOWNLOADS:
    dest = PUBLIC_IMAGES / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading {rel} ...")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
            f.write(r.read())
        size = dest.stat().st_size
        print(f"  OK ({size:,} bytes)")
    except Exception as e:
        print(f"  FAIL: {e}")
    time.sleep(2)
