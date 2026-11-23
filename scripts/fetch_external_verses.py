"""
fetch_external_verses.py
Fetches the official English and Portuguese scripture texts for all 846 external references
from ChurchofJesusChrist.org and saves them in public/data/external_verses.json.
"""

import json
import os
import re
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

BOOK_MAP = {
    # Old Testament
    "Genesis": ("ot", "gen"),
    "Exodus": ("ot", "ex"),
    "Numbers": ("ot", "num"),
    "Deuteronomy": ("ot", "deut"),
    "Joshua": ("ot", "josh"),
    "1 Samuel": ("ot", "1-sam"),
    "2 Samuel": ("ot", "2-sam"),
    "1 Chronicles": ("ot", "1-chr"),
    "2 Chronicles": ("ot", "2-chr"),
    "Esther": ("ot", "esth"),
    "Job": ("ot", "job"),
    "Psalms": ("ot", "ps"),
    "Psalm": ("ot", "ps"),
    "Proverbs": ("ot", "prov"),
    "Ecclesiastes": ("ot", "eccl"),
    "Isaiah": ("ot", "isa"),
    "Jeremiah": ("ot", "jer"),
    "Lamentations": ("ot", "lam"),
    "Ezekiel": ("ot", "ezek"),
    "Daniel": ("ot", "dan"),
    "Amos": ("ot", "amos"),
    "Micah": ("ot", "micah"),
    "Nahum": ("ot", "nahum"),
    "Zechariah": ("ot", "zech"),
    "Malachi": ("ot", "mal"),
    # New Testament
    "Matthew": ("nt", "matt"),
    "Mark": ("nt", "mark"),
    "Luke": ("nt", "luke"),
    "John": ("nt", "john"),
    "Acts": ("nt", "acts"),
    "Romans": ("nt", "rom"),
    "1 Corinthians": ("nt", "1-cor"),
    "2 Corinthians": ("nt", "2-cor"),
    "Galatians": ("nt", "gal"),
    "Ephesians": ("nt", "eph"),
    "Philippians": ("nt", "philip"),
    "Colossians": ("nt", "col"),
    "1 Timothy": ("nt", "1-tim"),
    "2 Timothy": ("nt", "2-tim"),
    "Titus": ("nt", "titus"),
    "Hebrews": ("nt", "heb"),
    "James": ("nt", "james"),
    "1 John": ("nt", "1-jn"),
    "Jude": ("nt", "jude"),
    "Revelation": ("nt", "rev"),
    # D&C
    "Doctrine and Covenants": ("dc-testament", "dc"),
    # Pearl of Great Price
    "Moses": ("pgp", "moses"),
    "Abraham": ("pgp", "abr"),
    "Joseph Smith--History": ("pgp", "js-h")
}

def clean_verse_text(html):
    text = re.sub(r'<[^>]+>', '', html).strip()
    text = re.sub(r'^\d+\s*', '', text)
    text = text.replace('\xa0', ' ')
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def fetch_chapter(testament, slug, ch, lang, max_retries=3):
    uri = f"/scriptures/{testament}/{slug}/{ch}"
    url = f"https://www.churchofjesuschrist.org/study/api/v3/language-pages/type/content?lang={lang}&uri={uri}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                body = data.get("content", {}).get("body", "")
                verses_html = re.findall(r'<p class="verse"[^>]*>([\s\S]*?)</p>', body)
                results = [clean_verse_text(v) for v in verses_html]
                return ((testament, slug, ch, lang), results)
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(1 + attempt * 0.5)
            else:
                print(f"FAILED {uri} [{lang}]: {e}")
                return ((testament, slug, ch, lang), [])

def parse_ref(ref_str):
    m = re.match(r'^([1-3]?\s?[A-Za-z\s\-]+?)\s+(\d+)(?::(\d+(?:-\d+)?))?$', ref_str.strip())
    if not m:
        return None
    book = m.group(1).strip()
    ch = int(m.group(2))
    v_part = m.group(3) or "1"
    
    start_v = 1
    end_v = 1
    if "-" in v_part:
        parts = v_part.split("-")
        start_v = int(parts[0])
        end_v = int(parts[1])
    else:
        start_v = int(v_part)
        end_v = int(v_part)
    
    return book, ch, start_v, end_v

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ext_path = os.path.join(root, "public", "data", "external_references.json")
    out_path = os.path.join(root, "public", "data", "external_verses.json")

    with open(ext_path, "r", encoding="utf-8") as f:
        ext_refs = json.load(f)

    # 1. Identify all needed chapters
    needed_chapters = set() # (testament, slug, ch)
    for r in ext_refs:
        parsed = parse_ref(r["externalRef"])
        if not parsed:
            print("Cannot parse:", r["externalRef"])
            continue
        book, ch, _, _ = parsed
        if book not in BOOK_MAP:
            print("Unknown book:", book)
            continue
        testament, slug = BOOK_MAP[book]
        needed_chapters.add((testament, slug, ch))

    print(f"Total unique chapters to fetch: {len(needed_chapters)} across both EN and PT")

    # 2. Fetch all chapters in both languages concurrently
    tasks = []
    for test, slug, ch in needed_chapters:
        tasks.append((test, slug, ch, "eng"))
        tasks.append((test, slug, ch, "por"))

    chapter_data = {} # (test, slug, ch, lang) -> list of verse texts

    start_t = time.time()
    with ThreadPoolExecutor(max_workers=15) as executor:
        futures = {executor.submit(fetch_chapter, t, s, c, l): (t, s, c, l) for t, s, c, l in tasks}
        completed_count = 0
        for f in as_completed(futures):
            key, verses = f.result()
            chapter_data[key] = verses
            completed_count += 1
            if completed_count % 50 == 0 or completed_count == len(tasks):
                print(f"Progress: {completed_count}/{len(tasks)} chapters fetched ({time.time() - start_t:.1f}s)")

    # 3. Assemble external_verses dictionary
    dataset = {}
    missing_count = 0

    for r in ext_refs:
        raw_ref = r["externalRef"].strip()
        parsed = parse_ref(raw_ref)
        if not parsed:
            continue
        book, ch, start_v, end_v = parsed
        if book not in BOOK_MAP:
            continue
        test, slug = BOOK_MAP[book]

        en_verses = chapter_data.get((test, slug, ch, "eng"), [])
        pt_verses = chapter_data.get((test, slug, ch, "por"), [])

        # Extract range
        en_selected = []
        pt_selected = []
        for vnum in range(start_v, end_v + 1):
            idx = vnum - 1
            if 0 <= idx < len(en_verses):
                en_selected.append(en_verses[idx])
            if 0 <= idx < len(pt_verses):
                pt_selected.append(pt_verses[idx])

        text_en = " ".join(en_selected) if en_selected else ""
        text_pt = " ".join(pt_selected) if pt_selected else ""

        if not text_en or not text_pt:
            missing_count += 1

        dataset[raw_ref] = {
            "ref": raw_ref,
            "textEn": text_en,
            "textPt": text_pt
        }

    print(f"Generated {len(dataset)} entries in external_verses. Missing: {missing_count}")

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    size_kb = os.path.getsize(out_path) / 1024
    print(f"Saved: {out_path} ({size_kb:.1f} KB)")

if __name__ == "__main__":
    main()
