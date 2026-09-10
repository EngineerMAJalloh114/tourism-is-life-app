"""Download full-resolution finalist images to public/images/"""
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

BASE = Path(__file__).parent.parent
PUBLIC_IMAGES = BASE / "public" / "images"
RESEARCH = BASE / ".image-research-tmp"

UA = "TIL-image-downloader/1.0 (https://tourismislife.com; info@tourismislife.com)"

def fetch_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))

def safe_print(s):
    try:
        print(s)
    except UnicodeEncodeError:
        print(s.encode("ascii", "replace").decode("ascii"))

def download(url, dest, timeout=60):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r, open(dest, "wb") as f:
        f.write(r.read())

# Mapping: local filename -> (source_url, source_page, title, artist, license, alt_text, purpose)
# Selected from finalists.json, candidates2.json, and research results

SELECTIONS = {
    # Constants
    "beaches/tokeh-beach-hero.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/9/9d/Hodroj_Houssein-Tokey_Beach_%28IMG_2218%29.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Hodroj_Houssein-Tokey_Beach_(IMG_2218).jpg",
        "title": "Hodroj Houssein-Tokey Beach (IMG 2218)",
        "artist": "Hodroj Houssein",
        "license": "CC BY-SA 4.0",
        "alt": "Fishing and transportation boats at Tokeh Beach, one of the most beautiful beaches in Sierra Leone",
        "purpose": "hero beach"
    },
    "beaches/tokeh-beach.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/5/52/Tokeh_Beach.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Tokeh_Beach.jpg",
        "title": "Tokeh Beach",
        "artist": "Unknown",
        "license": "CC BY-SA 3.0",
        "alt": "Tokeh Beach coastline in Sierra Leone",
        "purpose": "beach destination"
    },
    "beaches/lumley-beach.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/c/cd/Lumley_Beach_Freetown.JPG",
        "page": "https://commons.wikimedia.org/wiki/File:Lumley_Beach_Freetown.JPG",
        "title": "Lumley Beach Freetown",
        "artist": "Unknown",
        "license": "CC BY-SA 3.0",
        "alt": "Lumley Beach of Freetown in Sierra Leone",
        "purpose": "peninsula beach"
    },
    "beaches/river-number-two-beach.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/9/9e/Flickr_-_stringer_bel_-_River_No._2_Village_Beach%2C_Sierra_Leone_%281%29.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Flickr_-_stringer_bel_-_River_No._2_Village_Beach,_Sierra_Leone_(1).jpg",
        "title": "River No. 2 Village Beach, Sierra Leone",
        "artist": "stringer bel",
        "license": "CC BY 2.0",
        "alt": "River Number Two beach on the Freetown Peninsula, Sierra Leone",
        "purpose": "peninsula beach"
    },
    "cities/freetown-aerial.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/f/f9/Freetown_view_-_Nov_2010_-_panoramio.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Freetown_view_-_Nov_2010_-_panoramio.jpg",
        "title": "Freetown view - Nov 2010",
        "artist": "Ghassan Mroue",
        "license": "CC BY-SA 3.0",
        "alt": "Aerial view of Freetown, Sierra Leone",
        "purpose": "city hero"
    },
    "cities/freetown-street.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/c/c0/Freetown_street_%2813992704238%29.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Freetown_street_(13992704238).jpg",
        "title": "Freetown street",
        "artist": "Unknown",
        "license": "CC BY 2.0",
        "alt": "Street scene in Freetown, Sierra Leone",
        "purpose": "city culture"
    },
    "cruise/freetown-port.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/1/1b/Porte_conteneurs_Freetown.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Porte_conteneurs_Freetown.jpg",
        "title": "Porte conteneurs Freetown",
        "artist": "Unknown",
        "license": "CC BY-SA 3.0",
        "alt": "Container ships entering the port of Freetown, Sierra Leone",
        "purpose": "cruise port"
    },
    "culture/makeni-sunset.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/8/8c/Sunset_over_Makeni%2C_Sierra_Leone_%28Unsplash%29.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Sunset_over_Makeni,_Sierra_Leone_(Unsplash).jpg",
        "title": "Sunset over Makeni, Sierra Leone",
        "artist": "Unsplash",
        "license": "Unsplash License",
        "alt": "Sunset over Makeni in northern Sierra Leone",
        "purpose": "northern town"
    },
    "culture/bo-rice-farming.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/0/0d/Inland_valley_rice_cultivation_around_Bo%2C_Sierra_Leone_-_panoramio.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Inland_valley_rice_cultivation_around_Bo,_Sierra_Leone_-_panoramio.jpg",
        "title": "Inland valley rice cultivation around Bo, Sierra Leone",
        "artist": "Unknown",
        "license": "CC BY-SA 3.0",
        "alt": "Rice cultivation in the inland valleys around Bo, Sierra Leone",
        "purpose": "southern town"
    },
    "culture/sierra-leone-big-market.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/d/de/Sierra_Leone_Big_Market.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Sierra_Leone_Big_Market.jpg",
        "title": "Sierra Leone Big Market",
        "artist": "Unknown",
        "license": "CC BY 2.0",
        "alt": "Sierra Leone Big Market in Freetown",
        "purpose": "market culture"
    },
    "culture/pepper-seller.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/c/c5/Pepper_seller_in_Sierra_Leone_village.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Pepper_seller_in_Sierra_Leone_village.jpg",
        "title": "Pepper seller in Sierra Leone village",
        "artist": "Unknown",
        "license": "CC BY 2.0",
        "alt": "Pepper seller in a Sierra Leone village",
        "purpose": "village culture"
    },
    "culture/kenema-aerial.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/4c/Sierra_Leone_-_Kenema.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Sierra_Leone_-_Kenema.jpg",
        "title": "Sierra Leone - Kenema",
        "artist": "Unknown",
        "license": "CC BY-SA 4.0",
        "alt": "Aerial view of Kenema, Sierra Leone",
        "purpose": "eastern town"
    },
    "culture/koidu-market.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/c/c5/KoiduMarket.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:KoiduMarket.jpg",
        "title": "KoiduMarket",
        "artist": "Unknown",
        "license": "CC BY-SA 3.0",
        "alt": "Koidu market in Kono District, Sierra Leone",
        "purpose": "eastern market"
    },
    "heritage/bunce-island-wall.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/9/9c/Bunce_Island_Fortress_Wall_01.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Bunce_Island_Fortress_Wall_01.jpg",
        "title": "Bunce Island Fortress Wall 01",
        "artist": "Pierre Chrzanowski",
        "license": "CC0",
        "alt": "Fortress wall at Bunce Island, Sierra Leone River",
        "purpose": "heritage site"
    },
    "heritage/bunce-island-cannon.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/a/ad/Bunce_Island_Fortress_Cannon.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Bunce_Island_Fortress_Cannon.jpg",
        "title": "Bunce Island Fortress Cannon",
        "artist": "Pierre Chrzanowski",
        "license": "CC0",
        "alt": "Historic cannon at Bunce Island fortress",
        "purpose": "heritage site"
    },
    "heritage/cotton-tree-freetown.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/2/26/Cotton_Tree_with_stump_and_Sierra_Leonean_flag.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Cotton_Tree_with_stump_and_Sierra_Leonean_flag.jpg",
        "title": "Cotton Tree with stump and Sierra Leonean flag",
        "artist": "Smoking Tyre",
        "license": "CC BY-SA 4.0",
        "alt": "The historic Cotton Tree in Freetown with Sierra Leonean flag",
        "purpose": "heritage landmark"
    },
    "islands/banana-island-sierra-leone-1905.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/a/a5/Banana_Island%2C_Sierra_Leone_%28West_Africa%29_1905_%2812312269234%29.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Banana_Island,_Sierra_Leone_(West_Africa)_1905_(12312269234).jpg",
        "title": "Banana Island, Sierra Leone (West Africa) 1905",
        "artist": "Arthur G. Peck",
        "license": "CC BY-SA 2.0",
        "alt": "Historical photograph of Banana Island, Sierra Leone from 1905",
        "purpose": "island destination"
    },
    "islands/sherbro-island.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/0/06/Sherbro_Island_-_panoramio_%281%29.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Sherbro_Island_-_panoramio_(1).jpg",
        "title": "Sherbro Island - panoramio (1)",
        "artist": "Unknown",
        "license": "CC BY-SA 3.0",
        "alt": "Sherbro Island off the coast of Sierra Leone",
        "purpose": "southern island"
    },
    "mice/atlantic-hotel.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/7/76/Atlantic_Hotel.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Atlantic_Hotel.jpg",
        "title": "Atlantic Hotel",
        "artist": "Unknown",
        "license": "CC BY-SA 3.0",
        "alt": "Atlantic Hotel in Freetown, Sierra Leone",
        "purpose": "MICE venue"
    },
    "mountains/mount-bintumani.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/d/d0/Mountain_Bintunami.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Mountain_Bintunami.jpg",
        "title": "Mountain Bintunami",
        "artist": "Unknown",
        "license": "CC BY 2.0",
        "alt": "Mount Bintumani, the highest peak in Sierra Leone and the Loma Mountains",
        "purpose": "mountain peak"
    },
    "mountains/wara-wara-mountains.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/3/37/Wara-Wara_Mountains_near_Bafodia%2C_Northern_Sierra_Leone_%28West_Africa%29_1967_%28852679997%29.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Wara-Wara_Mountains_near_Bafodia,_Northern_Sierra_Leone_(West_Africa)_1967_(852679997).jpg",
        "title": "Wara-Wara Mountains near Bafodia, Northern Sierra Leone (West Africa) 1967",
        "artist": "Unknown",
        "license": "CC BY-SA 2.0",
        "alt": "Wara Wara Mountains near Bafodia in northern Sierra Leone",
        "purpose": "northern highlands"
    },
    "mountains/outamba-mountain.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/0/0e/Outamba_Mountain_Sierra_Leone.JPG",
        "page": "https://commons.wikimedia.org/wiki/File:Outamba_Mountain_Sierra_Leone.JPG",
        "title": "Outamba Mountain Sierra Leone",
        "artist": "Unknown",
        "license": "CC BY-SA 3.0",
        "alt": "Outamba Mountain in Outamba-Kilimi National Park, Sierra Leone",
        "purpose": "savanna highland"
    },
    "mountains/loma-mountains-hike.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/c/c8/Hiking_in_Loma_Mountains_No_Hunting_Forest_Reserve.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Hiking_in_Loma_Mountains_No_Hunting_Forest_Reserve.jpg",
        "title": "Hiking in Loma Mountains No Hunting Forest Reserve",
        "artist": "Unknown",
        "license": "CC BY-SA 2.0",
        "alt": "Hiking trail in the Loma Mountains Forest Reserve, Sierra Leone",
        "purpose": "mountain trekking"
    },
    "rainforest/tiwai-island.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Tiwai_Island_-_flickr_%28banner%29.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Tiwai_Island_-_flickr_(banner).jpg",
        "title": "Tiwai Island - flickr (banner)",
        "artist": "Dorothy Voorhees",
        "license": "CC BY-SA 2.0",
        "alt": "Tiwai Island wildlife sanctuary in the Moa River, Sierra Leone",
        "purpose": "forest island"
    },
    "rainforest/gola-rainforest-landscape.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/8/8d/Western_Forest_(Sierra_Leone).jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Western_Forest_(Sierra_Leone).jpg",
        "title": "Western Forest (Sierra Leone)",
        "artist": "Christian Trede",
        "license": "CC BY 4.0",
        "alt": "Tropical rainforest in the Western Area of Sierra Leone — representative of Gola Rainforest lowland forest",
        "purpose": "rainforest landscape"
    },
    "waterfalls/bumbuna-hills.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/f/f9/Hills_near_Bumban%2C_Sierra_Leone_%28West_Africa%29_%282103931925%29.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Hills_near_Bumban,_Sierra_Leone_(West_Africa)_(2103931925).jpg",
        "title": "Hills near Bumban, Sierra Leone (West Africa)",
        "artist": "Unknown",
        "license": "CC BY-SA 2.0",
        "alt": "Hills near Bumban in northern Sierra Leone, the Bumbuna Falls region",
        "purpose": "northern highland"
    },
    "wildlife/tacugama-chimpanzee.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/a/a3/Chimpas_at_Tacugama_Sanctuary%2C_near_Freetown.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Chimpas_at_Tacugama_Sanctuary,_near_Freetown.jpg",
        "title": "Chimpas at Tacugama Sanctuary, near Freetown",
        "artist": "Jeremy Weate",
        "license": "CC BY 2.0",
        "alt": "Chimpanzees at Tacugama Chimpanzee Sanctuary near Freetown, Sierra Leone",
        "purpose": "wildlife sanctuary"
    },
    "wildlife/west-african-chimpanzee.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/9/9d/West_African_Chimpanzee.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:West_African_Chimpanzee.jpg",
        "title": "West African Chimpanzee",
        "artist": "BigMikeSndTech",
        "license": "CC BY 2.0",
        "alt": "Common chimpanzee in West Africa",
        "purpose": "wildlife"
    },
    "wildlife/outamba-hippos.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/c/c2/Outamba_Kilimi_Hippos_Sierra_Leone.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Outamba_Kilimi_Hippos_Sierra_Leone.jpg",
        "title": "Outamba Kilimi Hippos Sierra Leone",
        "artist": "Leasmhar",
        "license": "CC BY-SA 3.0",
        "alt": "Pygmy hippos in Outamba-Kilimi National Park, Sierra Leone",
        "purpose": "wildlife"
    },
    "general/freetown-harbour.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/4c/SierraLeone068.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:SierraLeone068.jpg",
        "title": "SierraLeone068",
        "artist": "Sjoerd Hofstra",
        "license": "Public domain",
        "alt": "Crowd near the port in Freetown, Sierra Leone, 1935",
        "purpose": "harbour history"
    },
    "team/placeholder.jpg": None,  # No team portraits
}

# Additional selections not in the main dict
EXTRA = {
    "islands/banana-island-1905.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/a/a5/Banana_Island%2C_Sierra_Leone_%28West_Africa%29_1905_%2812312269234%29.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Banana_Island,_Sierra_Leone_(West_Africa)_1905_(12312269234).jpg",
        "title": "Banana Island, Sierra Leone (West Africa) 1905",
        "artist": "Arthur G. Peck",
        "license": "CC BY-SA 2.0",
        "alt": "Historical photograph of Banana Island, Sierra Leone from 1905",
        "purpose": "island destination"
    },
    "culture/kabala-village.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/4c/Kamamodia%2C_Sierra_Leone_%28West_Africa%29_%282116141848%29.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Kamamodia,_Sierra_Leone_(West_Africa)_(2116141848).jpg",
        "title": "Kamamodia, Sierra Leone (West Africa)",
        "artist": "John Atherton",
        "license": "CC BY-SA 2.0",
        "alt": "Village scene in Kamamodia, Sierra Leone",
        "purpose": "village culture"
    },
    "general/outamba-canoe.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/1/19/Outamba_Kilimi_Park_Canoe_Trip.JPG",
        "page": "https://commons.wikimedia.org/wiki/File:Outamba_Kilimi_Park_Canoe_Trip.JPG",
        "title": "Outamba Kilimi Park Canoe Trip",
        "artist": "Leasmhar",
        "license": "CC BY-SA 3.0",
        "alt": "Canoe trip on the Kaba River in Outamba-Kilimi National Park",
        "purpose": "activity"
    },
    "general/karangia-trail.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/3/35/Karangia_Trail_Outamba-Kilimi_Park_Sierra_Leone.JPG",
        "page": "https://commons.wikimedia.org/wiki/File:Karangia_Trail_Outamba-Kilimi_Park_Sierra_Leone.JPG",
        "title": "Karangia Trail Outamba-Kilimi Park Sierra Leone",
        "artist": "Leasmhar",
        "license": "CC BY-SA 3.0",
        "alt": "The Karangia Trail in Outamba-Kilimi National Park, Sierra Leone",
        "purpose": "trail"
    },
    "cities/aberdeen-beach-road.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/d/d6/Aberdeen_beach_road.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Aberdeen_beach_road.jpg",
        "title": "Aberdeen beach road",
        "artist": "Victor turay",
        "license": "CC BY-SA 4.0",
        "alt": "Aberdeen beach road in Freetown, Sierra Leone",
        "purpose": "freetown street"
    },
    "rainforest/hofstra-landscape-004.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/c/c3/SierraLeone_Hofstra_004.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:SierraLeone_Hofstra_004.jpg",
        "title": "SierraLeone Hofstra 004",
        "artist": "Sjoerd Hofstra",
        "license": "CC BY-SA 4.0",
        "alt": "Landscape view of Sierra Leone from the 1930s",
        "purpose": "historical landscape"
    },
    "rainforest/hofstra-trees-hills-299.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/ef/SierraLeone_Hofstra_299.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:SierraLeone_Hofstra_299.jpg",
        "title": "SierraLeone Hofstra 299",
        "artist": "Sjoerd Hofstra",
        "license": "CC BY-SA 4.0",
        "alt": "Trees with hills in background in Sierra Leone",
        "purpose": "forest landscape"
    },
    "rainforest/gola-rainforest-landscape.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/8/8d/Western_Forest_(Sierra_Leone).jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Western_Forest_(Sierra_Leone).jpg",
        "title": "Western Forest (Sierra Leone)",
        "artist": "Christian Trede",
        "license": "CC BY 4.0",
        "alt": "Tropical rainforest in the Western Area of Sierra Leone — representative of Gola Rainforest lowland forest",
        "purpose": "rainforest landscape"
    },
    "heritage/bunce-tasso-national-parks.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/5/51/Bunce_Island_Fortress_Wall_02.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Bunce_Island_Fortress_Wall_02.jpg",
        "title": "Bunce Island Fortress Wall 02",
        "artist": "Pierre Chrzanowski",
        "license": "CC0",
        "alt": "Fortress wall at Bunce Island on the Sierra Leone River",
        "purpose": "heritage site"
    },
    "rainforest/picket-hill-national-parks.jpg": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/c/c8/Hiking_in_Loma_Mountains_No_Hunting_Forest_Reserve.jpg",
        "page": "https://commons.wikimedia.org/wiki/File:Hiking_in_Loma_Mountains_No_Hunting_Forest_Reserve.jpg",
        "title": "Hiking in Loma Mountains No Hunting Forest Reserve",
        "artist": "Rokaso",
        "license": "CC BY-SA 4.0",
        "alt": "Hiking trail in the Loma Mountains Forest Reserve, Sierra Leone — representative of Picket Hill forest trail",
        "purpose": "forest trail"
    },
}

ALL = {**SELECTIONS, **EXTRA}

manifest = []
ok = 0
fail = 0

for rel, meta in ALL.items():
    if meta is None:
        continue
    dest = PUBLIC_IMAGES / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    url = meta["url"]
    safe_print(f"Downloading {rel} ...")
    try:
        download(url, dest)
        size = dest.stat().st_size
        if size < 5000:
            safe_print(f"  WARN: small file ({size} bytes)")
        safe_print(f"  OK ({size:,} bytes)")
        manifest.append({
            "filename": f"/images/{rel}",
            "page": meta.get("page", ""),
            "section": meta.get("purpose", ""),
            "subject": meta.get("title", ""),
            "location": "Sierra Leone",
            "source": meta.get("page", ""),
            "sourceUrl": meta.get("url", ""),
            "license": meta.get("license", "license_verification_required"),
            "alt": meta.get("alt", ""),
            "purpose": meta.get("purpose", ""),
            "author": meta.get("artist", ""),
        })
        ok += 1
    except Exception as e:
        safe_print(f"  FAIL: {e}")
        fail += 1
    time.sleep(0.2)

manifest_path = PUBLIC_IMAGES / "image-sources.json"
manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
safe_print(f"\nDone. OK={ok} FAIL={fail}")
safe_print(f"Manifest written to {manifest_path}")
