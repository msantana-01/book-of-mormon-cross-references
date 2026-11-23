import json

with open("public/data/verses_en.json", "r", encoding="utf-8") as f:
    verses = json.load(f)

for v in verses:
    if v["ref"] in ["Helaman 14:2", "1 Nephi 8:19", "2 Nephi 26:1", "3 Nephi 1:15", "1 Nephi 11:25", "3 Nephi 11:8"]:
        print(f"{v['ref']}: ID = {v['id']}")

with open("public/data/cross_references.json", "r", encoding="utf-8") as f:
    cross = json.load(f)

print("\nChecking cross_references.json entries:")
for link in cross:
    for k in ["Helaman 14", "1 Nephi 8", "2 Nephi 26", "3 Nephi 1", "3 Nephi 11"]:
        if k in str(link):
            print(link)
