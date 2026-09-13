import os
import sys
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..", "public", "images")
MAX_DIM = 2400
QUALITY = 82
MIN_SIZE_TO_TOUCH = 700 * 1024  # only touch files over ~700KB

def optimize(fpath):
    orig_size = os.path.getsize(fpath)
    if orig_size < MIN_SIZE_TO_TOUCH:
        return None
    with Image.open(fpath) as im:
        im = im.convert("RGB") if im.mode in ("RGBA", "P", "LA") else im
        w, h = im.size
        scale = min(1.0, MAX_DIM / max(w, h))
        if scale < 1.0:
            new_size = (round(w * scale), round(h * scale))
            im = im.resize(new_size, Image.LANCZOS)
        im.save(fpath, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    new_size = os.path.getsize(fpath)
    return orig_size, new_size, w, h, im.size if scale < 1.0 else (w, h)

def main():
    total_before = 0
    total_after = 0
    touched = 0
    for dirpath, _dirs, files in os.walk(ROOT):
        for fname in sorted(files):
            if not fname.lower().endswith((".jpg", ".jpeg")):
                continue
            fpath = os.path.join(dirpath, fname)
            result = optimize(fpath)
            if result is None:
                continue
            before, after, orig_wh, new_wh = result[0], result[1], (result[2], result[3]), result[4]
            total_before += before
            total_after += after
            touched += 1
            rel = os.path.relpath(fpath, ROOT).replace("\\", "/")
            print(f"{rel}: {before/1024/1024:.2f}MB -> {after/1024/1024:.2f}MB  {orig_wh} -> {new_wh}")
    print()
    print(f"Touched {touched} files. Total {total_before/1024/1024:.1f}MB -> {total_after/1024/1024:.1f}MB "
          f"(saved {(total_before-total_after)/1024/1024:.1f}MB)")

if __name__ == "__main__":
    main()
