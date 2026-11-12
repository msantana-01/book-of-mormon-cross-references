import json

with open("data/verses_en.json", "r", encoding="utf-8") as f:
    verses = json.load(f)
ref_map = {v["ref"]: v["id"] for v in verses}

with open("data/external_references.json", "r", encoding="utf-8") as f:
    external = json.load(f)

for r in ["Alma 32:21", "Ether 12:6", "Mosiah 14:1", "1 Nephi 3:7"]:
    v_id = ref_map.get(r)
    ext = [l for l in external if l["source"] == v_id]
    print(f"{r} (ID {v_id}): {len(ext)} external links")
    for e in ext:
        print(f"  -> {e['externalRef']}")
