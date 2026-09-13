import os
import sys
import json
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..", "public", "images")

def main():
    rows = []
    for dirpath, _dirs, files in os.walk(ROOT):
        for fname in sorted(files):
            if not fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                continue
            fpath = os.path.join(dirpath, fname)
            rel = os.path.relpath(fpath, ROOT).replace("\\", "/")
            size = os.path.getsize(fpath)
            try:
                with Image.open(fpath) as im:
                    w, h = im.size
                    fmt = im.format
            except Exception as e:
                w = h = None
                fmt = f"ERROR: {e}"
            rows.append({
                "path": f"/images/{rel}",
                "size_bytes": size,
                "size_mb": round(size / 1024 / 1024, 2),
                "width": w,
                "height": h,
                "format": fmt,
            })
    rows.sort(key=lambda r: -r["size_bytes"])
    total = sum(r["size_bytes"] for r in rows)
    print(f"TOTAL: {len(rows)} images, {round(total/1024/1024,1)} MB")
    print()
    for r in rows:
        print(f"{r['size_mb']:>6} MB  {r['width']}x{r['height']}  {r['path']}")
    with open(os.path.join(os.path.dirname(__file__), "..", "image_audit.json"), "w") as f:
        json.dump(rows, f, indent=2)

if __name__ == "__main__":
    main()
