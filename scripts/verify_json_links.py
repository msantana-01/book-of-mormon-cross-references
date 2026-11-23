import json

with open("public/data/verses_en.json", "r", encoding="utf-8") as f:
    verses = json.load(f)
ref_map = {v["ref"]: v["id"] for v in verses}

with open("public/data/cross_references.json", "r", encoding="utf-8") as f:
    internal = json.load(f)

with open("public/data/external_references.json", "r", encoding="utf-8") as f:
    external = json.load(f)

# Test each featured item
featured_tests = [
    ("Helaman 14:2", "3 Nephi 1:15"),
    ("1 Nephi 8:19", "1 Nephi 11:25"),
    ("Mosiah 27:24", "Alma 36:18"),
    ("Mosiah 17:15", "Mosiah 19:20"),
    ("2 Nephi 26:1", "3 Nephi 11:8"),
    ("3 Nephi 12:3", "Matthew 5:3"),
    ("Mormon 9:37", "Moroni 10:3")
]

print("--- Testing Internal and External Link Matches ---")
for src, tgt in featured_tests:
    s_id = ref_map.get(src)
    t_id = ref_map.get(tgt)
    print(f"\n{src} (ID {s_id}) -> {tgt} (ID {t_id}):")
    
    # Check internal
    found_internal = [l for l in internal if l["source"] == s_id or l["target"] == s_id]
    print(f"  Internal links found: {len(found_internal)}")
    for fi in found_internal:
        print(f"    - {fi.get('sourceRef')} <-> {fi.get('targetRef')}: {fi.get('note', fi.get('type'))}")
        
    # Check external
    found_external = [l for l in external if l["source"] == s_id]
    print(f"  External links found: {len(found_external)}")
    for fe in found_external:
        print(f"    - {fe.get('sourceRef')} -> {fe.get('externalRef')}: {fe.get('note', fe.get('type'))}")
