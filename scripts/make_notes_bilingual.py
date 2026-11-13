import json

def update_bilingual_notes(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    bilingual_map = {
        ("Alma 36:1", "Alma 36:30"): {
            "notePt": "Quiasmo de Alma 36 (Nível A ↔ A'): Guardar mandamentos e prosperar na terra.",
            "noteEn": "Alma 36 Chiasmus (Level A ↔ A'): Keep commandments and prosper in the land."
        },
        ("Alma 36:2", "Alma 36:29"): {
            "notePt": "Quiasmo de Alma 36 (Nível B ↔ B'): Lembrança do cativeiro e libertação divina.",
            "noteEn": "Alma 36 Chiasmus (Level B ↔ B'): Remember captivity and divine deliverance."
        },
        ("Alma 36:3", "Alma 36:27"): {
            "notePt": "Quiasmo de Alma 36 (Nível C ↔ C'): Confiança em Deus nas tribulações e aflições.",
            "noteEn": "Alma 36 Chiasmus (Level C ↔ C'): Trust in God through trials and afflictions."
        },
        ("Alma 36:12", "Alma 36:20"): {
            "notePt": "Quiasmo de Alma 36 (Nível D ↔ D'): Dores do inferno superadas pela luz e alegria indizível.",
            "noteEn": "Alma 36 Chiasmus (Level D ↔ D'): Pains of hell transformed into marvelous light and joy."
        },
        ("Alma 36:17", "Alma 36:18"): {
            "notePt": "Quiasmo de Alma 36 (Nível E ↔ ÁPICE): Lembrança de Cristo conduz ao clamor de salvação.",
            "noteEn": "Alma 36 Chiasmus (Level E ↔ APEX): Memory of Jesus Christ leads to cry for mercy."
        },
        ("Alma 36:18", "Alma 36:19"): {
            "notePt": "Quiasmo de Alma 36 (ÁPICE ↔ E'): O clamor a Jesus Cristo dissipa instantaneamente a dor da culpa.",
            "noteEn": "Alma 36 Chiasmus (APEX ↔ E'): Calling upon Christ immediately removes the bitter pain of guilt."
        },
        ("Mosiah 3:18", "Mosiah 3:19"): {
            "notePt": "Quiasmo do Homem Natural: O sangue expiatório de Cristo transforma a natureza caída.",
            "noteEn": "Chiasmus of the Natural Man: The atoning blood of Christ transforms fallen mortal nature."
        },
        ("Alma 41:13", "Alma 41:15"): {
            "notePt": "Quiasmo da Restauração: Simetria eterna entre bem restaurado ao bem e mal ao mal.",
            "noteEn": "Chiasmus of Restoration: Eternal symmetry where good is restored to good and evil to evil."
        },
        ("Helaman 12:1", "Alma 30:60"): {
            "notePt": "Fórmula Editorial de Mórmon ('E assim vemos'): Reflexão teológica sobre justiça e misericórdia.",
            "noteEn": "Mormon's Prophetic Editorial Formula ('And thus we see'): The adversary does not support his followers."
        },
        ("Helaman 12:1", "Alma 24:19"): {
            "notePt": "Fórmula Editorial de Mórmon ('E assim vemos'): Firmeza dos convertidos até a morte.",
            "noteEn": "Mormon's Prophetic Editorial Formula ('And thus we see'): Steadfast faith and love of converts."
        },
        ("Helaman 12:1", "Helaman 3:27"): {
            "notePt": "Fórmula Editorial de Mórmon ('E assim vemos'): O Senhor é misericordioso com todos os sinceros.",
            "noteEn": "Mormon's Prophetic Editorial Formula ('And thus we see'): The Lord is merciful unto all sincere hearts."
        },
        ("Helaman 12:1", "3 Nephi 5:8"): {
            "notePt": "Fórmula Editorial de Mórmon ('E assim vemos'): O Senhor livra Seu povo da aliança.",
            "noteEn": "Mormon's Prophetic Editorial Formula ('And thus we see'): The Lord delivers His covenant people."
        },
        ("1 Nephi 2:20", "2 Nephi 1:20"): {
            "notePt": "Fórmula da Aliança Semítica: 'Se guardardes os meus mandamentos, prosperareis na terra'.",
            "noteEn": "Semitic Covenant Formula: 'Inasmuch as ye shall keep my commandments, ye shall prosper in the land'."
        },
        ("1 Nephi 2:20", "Alma 36:1"): {
            "notePt": "Fórmula da Aliança Semítica: Transmissão patriarcal da promessa da terra.",
            "noteEn": "Semitic Covenant Formula: Patriarchal transmission of the covenant of the land."
        },
        ("1 Nephi 2:20", "Helaman 3:20"): {
            "notePt": "Fórmula da Aliança Semítica: Prosperidade e paz contínuas sob a lei de Deus.",
            "noteEn": "Semitic Covenant Formula: Continual prosperity and peace under the law of God."
        },
        ("1 Nephi 1:1", "1 Nephi 3:15"): {
            "notePt": "Hebraísmos Semíticos: Colofão autobiográfico e juramento bíblico 'Vive o Senhor'.",
            "noteEn": "Semitic Hebraisms: Autobiographical colophon and ancient biblical life-oath 'As the Lord liveth'."
        },
        ("1 Nephi 3:3", "1 Nephi 8:19"): {
            "notePt": "Estado Construto Hebraico: Cadeias nominais semíticas ('placas de latão' e 'barra de ferro').",
            "noteEn": "Hebrew Construct State: Semitic noun-phrase construct chains ('plates of brass' and 'rod of iron')."
        }
    }

    updated = 0
    for link in data:
        key = (link.get('sourceRef'), link.get('targetRef'))
        inv_key = (link.get('targetRef'), link.get('sourceRef'))
        info = bilingual_map.get(key) or bilingual_map.get(inv_key)
        if info:
            link['notePt'] = info['notePt']
            link['noteEn'] = info['noteEn']
            # Default note to English so default fallback is always English
            link['note'] = info['noteEn']
            updated += 1

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Updated {updated} links in {filepath}")

update_bilingual_notes('data/cross_references.json')
update_bilingual_notes('public/data/cross_references.json')
