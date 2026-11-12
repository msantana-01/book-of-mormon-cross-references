import json

books = json.load(open('data/books.json', encoding='utf-8'))
cross = json.load(open('data/cross_references.json', encoding='utf-8'))
ext = json.load(open('data/external_references.json', encoding='utf-8'))

for b in books:
    b_id = b['id']
    s, e = b['startVerseId'], b['endVerseId']
    c_intra = [c for c in cross if s <= c['source'] <= e and s <= c['target'] <= e]
    c_inter = [c for c in cross if (s <= c['source'] <= e or s <= c['target'] <= e) and not (s <= c['source'] <= e and s <= c['target'] <= e)]
    e_links = [l for l in ext if s <= l['source'] <= e]
    total = len(c_intra) + len(c_inter) + len(e_links)
    print(f"{b['name']:16} | Intra: {len(c_intra):2} | Inter: {len(c_inter):2} | Biblical: {len(e_links):3} | Total: {total:3}")
