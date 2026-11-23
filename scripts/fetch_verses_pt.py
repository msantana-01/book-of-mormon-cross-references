"""
fetch_verses_pt.py
Fetches all 6,604 verses of the Book of Mormon in Portuguese from the official Church API
and generates public/data/verses_pt.json matching the canonical schema.
"""

import json
import os
import re
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

CHURCH_BOOK_SLUGS = {
    "1 Nephi": "1-ne",
    "2 Nephi": "2-ne",
    "Jacob": "jacob",
    "Enos": "enos",
    "Jarom": "jarom",
    "Omni": "omni",
    "Words of Mormon": "w-of-m",
    "Mosiah": "mosiah",
    "Alma": "alma",
    "Helaman": "hel",
    "3 Nephi": "3-ne",
    "4 Nephi": "4-ne",
    "Mormon": "morm",
    "Ether": "ether",
    "Moroni": "moro"
}

BOOK_NAMES_PT = {
    "1 Nephi": "1 Néfi",
    "2 Nephi": "2 Néfi",
    "Jacob": "Jacó",
    "Enos": "Enos",
    "Jarom": "Jarom",
    "Omni": "Ômni",
    "Words of Mormon": "Palavras de Mórmon",
    "Mosiah": "Mosias",
    "Alma": "Alma",
    "Helaman": "Helamã",
    "3 Nephi": "3 Néfi",
    "4 Nephi": "4 Néfi",
    "Mormon": "Mórmon",
    "Ether": "Éter",
    "Moroni": "Morôni"
}

BOOK_SHORT_PT = {
    "1 Nephi": "1 Né.",
    "2 Nephi": "2 Né.",
    "Jacob": "Jacó",
    "Enos": "Enos",
    "Jarom": "Jarom",
    "Omni": "Ômni",
    "Words of Mormon": "Pal. Mór.",
    "Mosiah": "Mos.",
    "Alma": "Alma",
    "Helaman": "Hel.",
    "3 Nephi": "3 Né.",
    "4 Nephi": "4 Né.",
    "Mormon": "Mór.",
    "Ether": "Éter",
    "Moroni": "Morô."
}

def clean_verse_text(html):
    # Strip HTML tags
    text = re.sub(r'<[^>]+>', '', html).strip()
    # Strip leading verse number e.g. "1 Eu, Néfi..." -> "Eu, Néfi..."
    text = re.sub(r'^\d+\s*', '', text)
    # Normalize non-breaking spaces and whitespace
    text = text.replace('\xa0', ' ')
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def fetch_chapter(slug, ch, max_retries=3):
    url = f"https://www.churchofjesuschrist.org/study/api/v3/language-pages/type/content?lang=por&uri=/scriptures/bofm/{slug}/{ch}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    
    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                body = data.get("content", {}).get("body", "")
                verses_html = re.findall(r'<p class="verse"[^>]*>([\s\S]*?)</p>', body)
                results = [clean_verse_text(v) for v in verses_html]
                return (slug, ch, results)
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(1 + attempt)
            else:
                print(f"FAILED {slug} {ch}: {e}")
                return (slug, ch, [])

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    books_path = os.path.join(root, "public", "data", "books.json")
    verses_en_path = os.path.join(root, "public", "data", "verses_en.json")
    out_path = os.path.join(root, "public", "data", "verses_pt.json")

    with open(books_path, "r", encoding="utf-8") as f:
        books = json.load(f)

    with open(verses_en_path, "r", encoding="utf-8") as f:
        verses_en = json.load(f)

    # Build work list of chapters
    tasks = []
    for b in books:
        slug = CHURCH_BOOK_SLUGS[b["name"]]
        for ch_info in b["chaptersList"]:
            tasks.append((slug, ch_info["chapter"], b["name"], ch_info["versesCount"]))

    print(f"Fetching {len(tasks)} chapters concurrently...")
    results_map = {} # (slug, ch) -> list of verses
    
    start_t = time.time()
    with ThreadPoolExecutor(max_workers=10) as executor:
        future_to_task = {
            executor.submit(fetch_chapter, slug, ch): (slug, ch, book_name, expected_count)
            for slug, ch, book_name, expected_count in tasks
        }
        done_count = 0
        for future in as_completed(future_to_task):
            slug, ch, book_name, expected = future_to_task[future]
            _, _, v_list = future.result()
            results_map[(slug, ch)] = v_list
            done_count += 1
            if len(v_list) != expected:
                print(f"⚠️ Mismatch in {book_name} {ch}: got {len(v_list)}, expected {expected}")
            if done_count % 30 == 0 or done_count == len(tasks):
                print(f"Progress: {done_count}/{len(tasks)} chapters ({time.time() - start_t:.1f}s)")

    # Build verses_pt.json matching verses_en.json 1:1
    verses_pt = []
    mismatches = 0
    for v_en in verses_en:
        book_name_en = v_en["book"]
        slug = CHURCH_BOOK_SLUGS[book_name_en]
        ch = v_en["ch"]
        v_num = v_en["v"]
        
        ch_verses = results_map.get((slug, ch), [])
        if v_num <= len(ch_verses):
            pt_text = ch_verses[v_num - 1]
        else:
            pt_text = v_en["text"] # fallback
            mismatches += 1

        book_pt = BOOK_NAMES_PT.get(book_name_en, book_name_en)
        short_pt = BOOK_SHORT_PT.get(book_name_en, v_en["shortBook"])

        verses_pt.append({
            "id": v_en["id"],
            "bookId": v_en["bookId"],
            "book": book_pt,
            "shortBook": short_pt,
            "ch": ch,
            "v": v_num,
            "ref": f"{book_pt} {ch}:{v_num}",
            "text": pt_text
        })

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(verses_pt, f, ensure_ascii=False)

    print(f"\n✅ Created {out_path}")
    print(f"Total verses: {len(verses_pt)} (Mismatches: {mismatches})")
    print(f"Elapsed time: {time.time() - start_t:.1f}s")

if __name__ == "__main__":
    main()
