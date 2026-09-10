import re, sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
path = Path('src/data/catalog.ts')
text = path.read_text(encoding='utf-8')

# 1. Replace IMG object URLs with local paths
replacements = {
    '"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80"': '"/images/beaches/tokeh-beach-hero.jpg"',
    '"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80"': '"/images/rainforest/hofstra-trees-hills-299.jpg"',
    '"https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80"': '"/images/mountains/mount-bintumani.jpg"',
    '"https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1600&q=80"': '"/images/waterfalls/bumbuna-hills.jpg"',
    '"https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=1600&q=80"': '"/images/islands/sherbro-island.jpg"',
    '"https://images.unsplash.com/photo-1535083783855-76ae62b2914e?auto=format&fit=crop&w=1600&q=80"': '"/images/wildlife/tacugama-chimpanzee.jpg"',
    '"https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=1600&q=80"': '"/images/culture/makeni-sunset.jpg"',
    '"https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=80"': '"/images/heritage/bunce-island-wall.jpg"',
    '"https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80"': '"/images/rainforest/tiwai-island.jpg"',
    '"https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1600&q=80"': '"/images/mountains/outamba-mountain.jpg"',
    '"https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?auto=format&fit=crop&w=1600&q=80"': '"/images/cities/freetown-aerial.jpg"',
    '"https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=1600&q=80"': '"/images/cruise/freetown-port.jpg"',
    '"https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80"': '"/images/mice/atlantic-hotel.jpg"',
}

for old, new in replacements.items():
    text = text.replace(old, new)

# 2. Update specific destination images
text = text.replace(
    '{ slug: "banana-island", name: "Banana Island", circuit: "western-circuit", country: "sierra-leone", summary: "Three islands off Yawri Bay: Dublin (beaches), Ricketts (forest), and uninhabited Mes-Meheux — settled by freed slaves in the late 18th and 19th centuries.", image: IMG.island, imageAlt: "Island coastline — editorial stand-in" }',
    '{ slug: "banana-island", name: "Banana Island", circuit: "western-circuit", country: "sierra-leone", summary: "Three islands off Yawri Bay: Dublin (beaches), Ricketts (forest), and uninhabited Mes-Meheux — settled by freed slaves in the late 18th and 19th centuries.", image: "/images/islands/banana-island-sierra-leone-1905.jpg", imageAlt: "Historical photograph of Banana Island, Sierra Leone from 1905" }'
)

text = text.replace(
    '{ slug: "turtle-islands", name: "Turtle Islands", circuit: "southern-circuit", country: "sierra-leone", summary: "A remote archipelago of beaches, fishing communities, and turtle nesting shores.", image: IMG.island, imageAlt: "Remote island beach — editorial stand-in" }',
    '{ slug: "turtle-islands", name: "Turtle Islands", circuit: "southern-circuit", country: "sierra-leone", summary: "A remote archipelago of beaches, fishing communities, and turtle nesting shores.", image: "/images/beaches/tokeh-beach.jpg", imageAlt: "Remote Sierra Leone beach — representative of the Turtle Islands coastline" }'
)

text = text.replace(
    '{ slug: "kono", name: "Kono", circuit: "eastern-circuit", country: "sierra-leone", summary: "Kono District — diamond country and a window on eastern Sierra Leone.", image: IMG.savanna, imageAlt: "Open landscape — editorial stand-in" }',
    '{ slug: "kono", name: "Kono", circuit: "eastern-circuit", country: "sierra-leone", summary: "Kono District — diamond country and a window on eastern Sierra Leone.", image: "/images/culture/koidu-market.jpg", imageAlt: "Koidu market in Kono District, Sierra Leone" }'
)

# 3. Update specific tour images and galleries
text = text.replace(
    'image: IMG.city,\n    imageAlt: "Freetown city atmosphere — editorial stand-in",\n    gallery: [{ src: IMG.city, alt: "City streets" }, { src: IMG.people, alt: "Local life" }],',
    'image: "/images/cities/freetown-aerial.jpg",\n    imageAlt: "Aerial view of Freetown, Sierra Leone",\n    gallery: [{ src: "/images/cities/freetown-aerial.jpg", alt: "Freetown cityscape" }, { src: "/images/culture/sierra-leone-big-market.jpg", alt: "Local life" }],'
)

text = text.replace(
    'image: IMG.wildlife,\n    imageAlt: "Chimpanzee in forest habitat — licensed stock, not a Tacugama publicity still",\n    gallery: [{ src: IMG.wildlife, alt: "Wildlife" }, { src: IMG.forestPath, alt: "Forest path" }],',
    'image: "/images/wildlife/tacugama-chimpanzee.jpg",\n    imageAlt: "Chimpanzees at Tacugama Chimpanzee Sanctuary near Freetown, Sierra Leone",\n    gallery: [{ src: "/images/wildlife/tacugama-chimpanzee.jpg", alt: "Tacugama chimpanzees" }, { src: "/images/rainforest/tiwai-island.jpg", alt: "Forest path" }],'
)

text = text.replace(
    'image: IMG.beach,\n    imageAlt: "Peninsula beach — editorial stand-in",\n    gallery: [{ src: IMG.beach, alt: "Beach" }, { src: IMG.boat, alt: "Coast" }],',
    'image: "/images/beaches/river-number-two-beach.jpg",\n    imageAlt: "River Number Two beach on the Freetown Peninsula, Sierra Leone",\n    gallery: [{ src: "/images/beaches/river-number-two-beach.jpg", alt: "Peninsula beach" }, { src: "/images/beaches/tokeh-beach-hero.jpg", alt: "Coast" }],'
)

text = text.replace(
    'image: IMG.island,\n    imageAlt: "Island from the water — editorial stand-in",\n    gallery: [{ src: IMG.island, alt: "Island" }, { src: IMG.boat, alt: "Boat crossing" }],',
    'image: "/images/islands/banana-island-sierra-leone-1905.jpg",\n    imageAlt: "Historical photograph of Banana Island, Sierra Leone from 1905",\n    gallery: [{ src: "/images/islands/banana-island-sierra-leone-1905.jpg", alt: "Banana Island" }, { src: "/images/islands/sherbro-island.jpg", alt: "Boat crossing" }],'
)

text = text.replace(
    'image: IMG.forestPath,\n    imageAlt: "Hill forest trail — editorial stand-in",\n    gallery: [{ src: IMG.forestPath, alt: "Trail" }, { src: IMG.mountain, alt: "Ridge" }],',
    'image: "/images/rainforest/tiwai-island.jpg",\n    imageAlt: "Forest trail above the Western Area peninsula, Sierra Leone",\n    gallery: [{ src: "/images/rainforest/tiwai-island.jpg", alt: "Trail" }, { src: "/images/mountains/mount-bintumani.jpg", alt: "Ridge" }],'
)

text = text.replace(
    'image: IMG.boat,\n    imageAlt: "River boat — editorial stand-in",\n    gallery: [{ src: IMG.boat, alt: "River" }, { src: IMG.village, alt: "Island shore" }],',
    'image: "/images/heritage/bunce-island-wall.jpg",\n    imageAlt: "Fortress wall at Bunce Island, Sierra Leone River",\n    gallery: [{ src: "/images/heritage/bunce-island-wall.jpg", alt: "River" }, { src: "/images/islands/sherbro-island.jpg", alt: "Island shore" }],'
)

text = text.replace(
    'image: IMG.waterfall,\n    imageAlt: "Waterfall — editorial stand-in",\n    gallery: [{ src: IMG.waterfall, alt: "Falls" }, { src: IMG.savanna, alt: "Inland road" }],',
    'image: "/images/waterfalls/bumbuna-hills.jpg",\n    imageAlt: "Hills near Bumbuna in northern Sierra Leone, the Bumbuna Falls region",\n    gallery: [{ src: "/images/waterfalls/bumbuna-hills.jpg", alt: "Falls" }, { src: "/images/mountains/outamba-mountain.jpg", alt: "Inland road" }],'
)

text = text.replace(
    'image: IMG.mountain,\n    imageAlt: "Highland trek — editorial stand-in",\n    gallery: [{ src: IMG.mountain, alt: "Mountains" }, { src: IMG.village, alt: "Highland village" }],',
    'image: "/images/mountains/wara-wara-mountains.jpg",\n    imageAlt: "Wara Wara Mountains near Bafodia in northern Sierra Leone",\n    gallery: [{ src: "/images/mountains/wara-wara-mountains.jpg", alt: "Mountains" }, { src: "/images/culture/makeni-sunset.jpg", alt: "Highland village" }],'
)

text = text.replace(
    'image: IMG.village,\n    imageAlt: "Northern town — editorial stand-in",\n    gallery: [{ src: IMG.village, alt: "Town" }, { src: IMG.savanna, alt: "Countryside" }],',
    'image: "/images/culture/makeni-sunset.jpg",\n    imageAlt: "Sunset over Makeni in northern Sierra Leone",\n    gallery: [{ src: "/images/culture/makeni-sunset.jpg", alt: "Town" }, { src: "/images/mountains/outamba-mountain.jpg", alt: "Countryside" }],'
)

text = text.replace(
    'image: IMG.mountain,\n    imageAlt: "High peak — editorial stand-in",\n    gallery: [{ src: IMG.mountain, alt: "Peak" }, { src: IMG.forestPath, alt: "Approach trail" }],',
    'image: "/images/mountains/mount-bintumani.jpg",\n    imageAlt: "Mount Bintumani, the highest peak in Sierra Leone and the Loma Mountains",\n    gallery: [{ src: "/images/mountains/mount-bintumani.jpg", alt: "Peak" }, { src: "/images/rainforest/tiwai-island.jpg", alt: "Approach trail" }],'
)

text = text.replace(
    'image: IMG.village,\n    imageAlt: "Southern city — editorial stand-in",\n    gallery: [{ src: IMG.village, alt: "Bo" }, { src: IMG.people, alt: "Markets" }],',
    'image: "/images/culture/bo-rice-farming.jpg",\n    imageAlt: "Rice cultivation in the inland valleys around Bo, Sierra Leone",\n    gallery: [{ src: "/images/culture/bo-rice-farming.jpg", alt: "Bo" }, { src: "/images/culture/sierra-leone-big-market.jpg", alt: "Markets" }],'
)

text = text.replace(
    'image: IMG.forestPath,\n    imageAlt: "Forest sanctuary — editorial stand-in",\n    gallery: [{ src: IMG.forestPath, alt: "Forest" }, { src: IMG.wildlife, alt: "Wildlife habitat" }],',
    'image: "/images/rainforest/tiwai-island.jpg",\n    imageAlt: "Tiwai Island wildlife sanctuary in the Moa River, Sierra Leone",\n    gallery: [{ src: "/images/rainforest/tiwai-island.jpg", alt: "Forest" }, { src: "/images/wildlife/tacugama-chimpanzee.jpg", alt: "Wildlife habitat" }],'
)

text = text.replace(
    'image: IMG.island,\n    imageAlt: "Remote islands — editorial stand-in",\n    gallery: [{ src: IMG.island, alt: "Islands" }, { src: IMG.beach, alt: "Beach" }],',
    'image: "/images/beaches/tokeh-beach.jpg",\n    imageAlt: "Tokeh Beach coastline in Sierra Leone — representative of remote island beaches",\n    gallery: [{ src: "/images/beaches/tokeh-beach.jpg", alt: "Islands" }, { src: "/images/islands/sherbro-island.jpg", alt: "Beach" }],'
)

text = text.replace(
    'image: IMG.rainforest,\n    imageAlt: "Gola rainforest — editorial stand-in",\n    gallery: [{ src: IMG.rainforest, alt: "Rainforest" }, { src: IMG.wildlife, alt: "Forest wildlife" }],',
    'image: "/images/rainforest/hofstra-trees-hills-299.jpg",\n    imageAlt: "Trees with hills in background — Sierra Leone forest landscape near Gola",\n    gallery: [{ src: "/images/rainforest/hofstra-trees-hills-299.jpg", alt: "Rainforest" }, { src: "/images/wildlife/tacugama-chimpanzee.jpg", alt: "Forest wildlife" }],'
)

text = text.replace(
    'image: IMG.village,\n    imageAlt: "Eastern town — editorial stand-in",\n    gallery: [{ src: IMG.village, alt: "Town" }, { src: IMG.rainforest, alt: "East forest edge" }],',
    'image: "/images/culture/kenema-aerial.jpg",\n    imageAlt: "Aerial view of Kenema, Sierra Leone",\n    gallery: [{ src: "/images/culture/kenema-aerial.jpg", alt: "Town" }, { src: "/images/rainforest/hofstra-trees-hills-299.jpg", alt: "East forest edge" }],'
)

text = text.replace(
    'image: IMG.savanna,\n    imageAlt: "Eastern landscape — editorial stand-in",\n    gallery: [{ src: IMG.savanna, alt: "Landscape" }, { src: IMG.people, alt: "Community" }],',
    'image: "/images/mountains/outamba-mountain.jpg",\n    imageAlt: "Outamba Mountain in the northern highlands of Sierra Leone",\n    gallery: [{ src: "/images/mountains/outamba-mountain.jpg", alt: "Landscape" }, { src: "/images/culture/sierra-leone-big-market.jpg", alt: "Community" }],'
)

# 4. Update article images
text = text.replace(
    'image: IMG.wildlife,\n    imageAlt: "Forest sanctuary — editorial stand-in",',
    'image: "/images/wildlife/tacugama-chimpanzee.jpg",\n    imageAlt: "Chimpanzees at Tacugama Chimpanzee Sanctuary near Freetown, Sierra Leone",'
)

text = text.replace(
    'image: IMG.savanna,\n    imageAlt: "Overland landscape — editorial stand-in",',
    'image: "/images/mountains/outamba-mountain.jpg",\n    imageAlt: "Overland landscape in Sierra Leone",'
)

text = text.replace(
    'image: IMG.mountain,\n    imageAlt: "Adventure terrain — editorial stand-in",',
    'image: "/images/mountains/mount-bintumani.jpg",\n    imageAlt: "Mount Bintumani, Sierra Leone highest peak",'
)

text = text.replace(
    'image: IMG.boat,\n    imageAlt: "River approach — editorial stand-in",',
    'image: "/images/heritage/bunce-island-wall.jpg",\n    imageAlt: "Fortress wall at Bunce Island, Sierra Leone River",'
)

# 5. Update export constants at the bottom
text = text.replace(
    'export const IMG_CRUISE = IMG.cruise;\nexport const IMG_MICE = IMG.meeting;\nexport const IMG_HERO = IMG.beach;\nexport const IMG_FOREST = IMG.rainforest;\nexport const IMG_WILDLIFE = IMG.wildlife;\nexport const IMG_MOUNTAIN = IMG.mountain;',
    'export const IMG_CRUISE = "/images/cruise/freetown-port.jpg";\nexport const IMG_MICE = "/images/mice/atlantic-hotel.jpg";\nexport const IMG_HERO = "/images/beaches/tokeh-beach-hero.jpg";\nexport const IMG_FOREST = "/images/rainforest/hofstra-trees-hills-299.jpg";\nexport const IMG_WILDLIFE = "/images/wildlife/tacugama-chimpanzee.jpg";\nexport const IMG_MOUNTAIN = "/images/mountains/mount-bintumani.jpg";'
)

path.write_text(text, encoding='utf-8')
print("catalog.ts updated")
