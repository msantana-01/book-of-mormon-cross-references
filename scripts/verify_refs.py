import json

with open("public/data/verses_en.json", "r", encoding="utf-8") as f:
    verses = json.load(f)

ref_map = {v["ref"]: v["id"] for v in verses}

refs_to_check = [
    "Helaman 14:2",
    "1 Nephi 8:19",
    "Mosiah 27:24",
    "Alma 36:18",
    "Mosiah 17:15",
    "Mosiah 19:20",
    "2 Nephi 26:1",
    "3 Nephi 11:8",
    "3 Nephi 12:3",
    "Mormon 9:37",
    "Moroni 10:3"
]

print("Correct Verse IDs:")
for r in refs_to_check:
    print(f"  '{r}': {ref_map.get(r)}")
