import os
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..", "public", "images")

def dhash(image, hash_size=8):
    """Difference hash: resize to (hash_size+1)xhash_size grayscale, compare adjacent pixels."""
    img = image.convert("L").resize((hash_size + 1, hash_size), Image.LANCZOS)
    pixels = list(img.getdata())
    bits = []
    for row in range(hash_size):
        row_pixels = pixels[row * (hash_size + 1):(row + 1) * (hash_size + 1)]
        for col in range(hash_size):
            bits.append(1 if row_pixels[col] > row_pixels[col + 1] else 0)
    return bits

def hamming(a, b):
    return sum(x != y for x, y in zip(a, b))

def main():
    hashes = {}
    for dirpath, _dirs, files in os.walk(ROOT):
        for fname in sorted(files):
            if not fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                continue
            fpath = os.path.join(dirpath, fname)
            rel = os.path.relpath(fpath, ROOT).replace("\\", "/")
            try:
                with Image.open(fpath) as im:
                    hashes[rel] = dhash(im)
            except Exception as e:
                print(f"UNREADABLE: {rel} ({e})")

    print(f"Hashed {len(hashes)} images (dHash, 64-bit). Flagging pairs with Hamming distance <= 6...")
    items = list(hashes.items())
    found = False
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            rel1, h1 = items[i]
            rel2, h2 = items[j]
            dist = hamming(h1, h2)
            if dist <= 6:
                found = True
                print(f"  dist={dist:2d}  {rel1}  <->  {rel2}")
    if not found:
        print("  No near-duplicate pairs found (threshold 6/64 bits).")

if __name__ == "__main__":
    main()
