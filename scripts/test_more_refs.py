import json

verses = json.load(open('public/data/verses_en.json', encoding='utf-8'))
cross = json.load(open('public/data/cross_references.json', encoding='utf-8'))
ext = json.load(open('public/data/external_references.json', encoding='utf-8'))

ref_map = {v['ref']: v for v in verses}

conns_map = {v['id']: {'internal': [], 'external': []} for v in verses}
for c in cross:
    conns_map[c['source']]['internal'].append(c)
    conns_map[c['target']]['internal'].append(c)
for e in ext:
    conns_map[e['source']]['external'].append(e)

featured_tests = ['Helaman 14:2', '1 Nephi 8:19', '2 Nephi 26:1']

for ref in featured_tests:
    v = ref_map[ref]
    vid = v['id']
    conns = conns_map[vid]
    print(f"=== {ref} (ID: {vid}) ===")
    print(f"Text snippet: {v['text'][:70]}...")
    print(f"Internal count: {len(conns['internal'])}")
    for i, c in enumerate(conns['internal'], 1):
        other = c['targetRef'] if c['source'] == vid else c['sourceRef']
        print(f"  [{i}] Internal -> {other} ({c.get('type')}): {c.get('note', '')[:60]}...")
    print(f"External count: {len(conns['external'])}")
    for i, e in enumerate(conns['external'], 1):
        print(f"  [{i}] External -> {e['externalRef']} ({e.get('type')}): {e.get('note', '')[:60]}...")
    print()
