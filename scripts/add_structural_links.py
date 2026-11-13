import json

with open('data/verses_en.json', 'r', encoding='utf-8') as f:
    verses = json.load(f)

vmap = {v['ref']: v['id'] for v in verses}

with open('data/cross_references.json', 'r', encoding='utf-8') as f:
    cross = json.load(f)

# Track existing pairs
existing_pairs = set((c['source'], c['target']) for c in cross)

new_links = [
  # Alma 36 Chiasmus
  {"source": vmap["Alma 36:1"], "target": vmap["Alma 36:30"], "sourceRef": "Alma 36:1", "targetRef": "Alma 36:30", "type": "chiasmus", "note": "Quiasmo de Alma 36 (Nível A ↔ A'): Guardar mandamentos e prosperar na terra.", "category": "internal"},
  {"source": vmap["Alma 36:2"], "target": vmap["Alma 36:29"], "sourceRef": "Alma 36:2", "targetRef": "Alma 36:29", "type": "chiasmus", "note": "Quiasmo de Alma 36 (Nível B ↔ B'): Lembrança do cativeiro e libertação divina.", "category": "internal"},
  {"source": vmap["Alma 36:3"], "target": vmap["Alma 36:27"], "sourceRef": "Alma 36:3", "targetRef": "Alma 36:27", "type": "chiasmus", "note": "Quiasmo de Alma 36 (Nível C ↔ C'): Confiança em Deus nas tribulações e aflições.", "category": "internal"},
  {"source": vmap["Alma 36:12"], "target": vmap["Alma 36:20"], "sourceRef": "Alma 36:12", "targetRef": "Alma 36:20", "type": "chiasmus", "note": "Quiasmo de Alma 36 (Nível D ↔ D'): Dores do inferno superadas pela luz e alegria indizível.", "category": "internal"},
  {"source": vmap["Alma 36:17"], "target": vmap["Alma 36:18"], "sourceRef": "Alma 36:17", "targetRef": "Alma 36:18", "type": "chiasmus", "note": "Quiasmo de Alma 36 (Nível E ↔ ÁPICE): Lembrança de Cristo conduz ao clamor de salvação.", "category": "internal"},
  {"source": vmap["Alma 36:18"], "target": vmap["Alma 36:19"], "sourceRef": "Alma 36:18", "targetRef": "Alma 36:19", "type": "chiasmus", "note": "Quiasmo de Alma 36 (ÁPICE ↔ E'): O clamor a Jesus Cristo dissipa instantaneamente a dor da culpa.", "category": "internal"},
  # Mosiah 3 Chiasmus
  {"source": vmap["Mosiah 3:18"], "target": vmap["Mosiah 3:19"], "sourceRef": "Mosiah 3:18", "targetRef": "Mosiah 3:19", "type": "chiasmus", "note": "Quiasmo do Homem Natural: O sangue expiatório de Cristo transforma a natureza caída.", "category": "internal"},
  # Alma 41 Chiasmus
  {"source": vmap["Alma 41:13"], "target": vmap["Alma 41:15"], "sourceRef": "Alma 41:13", "targetRef": "Alma 41:15", "type": "chiasmus", "note": "Quiasmo da Restauração: Simetria eterna entre bem restaurado ao bem e mal ao mal.", "category": "internal"},
  # Prophetic Formula: And thus we see
  {"source": vmap["Helaman 12:1"], "target": vmap["Alma 30:60"], "sourceRef": "Helaman 12:1", "targetRef": "Alma 30:60", "type": "prophetic-formula", "note": "Fórmula Editorial de Mórmon ('E assim vemos'): Reflexão teológica sobre justiça e misericórdia.", "category": "internal"},
  {"source": vmap["Helaman 12:1"], "target": vmap["Alma 24:19"], "sourceRef": "Helaman 12:1", "targetRef": "Alma 24:19", "type": "prophetic-formula", "note": "Fórmula Editorial de Mórmon ('E assim vemos'): Firmeza dos convertidos até a morte.", "category": "internal"},
  {"source": vmap["Helaman 12:1"], "target": vmap["Helaman 3:27"], "sourceRef": "Helaman 12:1", "targetRef": "Helaman 3:27", "type": "prophetic-formula", "note": "Fórmula Editorial de Mórmon ('E assim vemos'): O Senhor é misericordioso com todos os sinceros.", "category": "internal"},
  {"source": vmap["Helaman 12:1"], "target": vmap["3 Nephi 5:8"], "sourceRef": "Helaman 12:1", "targetRef": "3 Nephi 5:8", "type": "prophetic-formula", "note": "Fórmula Editorial de Mórmon ('E assim vemos'): O Senhor livra Seu povo da aliança.", "category": "internal"},
  # Covenant Formula
  {"source": vmap["1 Nephi 2:20"], "target": vmap["2 Nephi 1:20"], "sourceRef": "1 Nephi 2:20", "targetRef": "2 Nephi 1:20", "type": "covenant-formula", "note": "Fórmula da Aliança Semítica: 'Se guardardes os meus mandamentos, prosperareis na terra'.", "category": "internal"},
  {"source": vmap["1 Nephi 2:20"], "target": vmap["Alma 36:1"], "sourceRef": "1 Nephi 2:20", "targetRef": "Alma 36:1", "type": "covenant-formula", "note": "Fórmula da Aliança Semítica: Transmissão patriarcal da promessa da terra.", "category": "internal"},
  {"source": vmap["1 Nephi 2:20"], "target": vmap["Helaman 3:20"], "sourceRef": "1 Nephi 2:20", "targetRef": "Helaman 3:20", "type": "covenant-formula", "note": "Fórmula da Aliança Semítica: Prosperidade e paz contínuas sob a lei de Deus.", "category": "internal"},
  # Hebraisms & Construct state
  {"source": vmap["1 Nephi 1:1"], "target": vmap["1 Nephi 3:15"], "sourceRef": "1 Nephi 1:1", "targetRef": "1 Nephi 3:15", "type": "hebraism", "note": "Hebraísmos Semíticos: Colofão autobiográfico e juramento bíblico 'Vive o Senhor'.", "category": "internal"},
  {"source": vmap["1 Nephi 3:3"], "target": vmap["1 Nephi 8:19"], "sourceRef": "1 Nephi 3:3", "targetRef": "1 Nephi 8:19", "type": "hebraism", "note": "Estado Construto Hebraico: Cadeias nominais semíticas ('placas de latão' e 'barra de ferro').", "category": "internal"}
]

added_count = 0
for link in new_links:
    pair = (link['source'], link['target'])
    inv_pair = (link['target'], link['source'])
    if pair not in existing_pairs and inv_pair not in existing_pairs:
        cross.append(link)
        existing_pairs.add(pair)
        added_count += 1

with open('data/cross_references.json', 'w', encoding='utf-8') as f:
    json.dump(cross, f, ensure_ascii=False, indent=2)

print(f'Successfully added {added_count} ancient structural links to cross_references.json!')
