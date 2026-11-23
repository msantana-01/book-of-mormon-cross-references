import bisect
import io
import json
import os
import re
import urllib.request
import zipfile

def build_cross_references():
    print("Loading local verses and books...")
    with open("public/data/verses_en.json", "r", encoding="utf-8") as f:
        local_verses = json.load(f)
    with open("public/data/books.json", "r", encoding="utf-8") as f:
        local_books = json.load(f)

    # Build reference lookup for local BOM verses: (book_name, chapter, verse) -> local_id (1..6604)
    ref_to_local_id = {}
    for v in local_verses:
        ref_to_local_id[(v["book"], v["ch"], v["v"])] = v["id"]

    zip_url = "https://github.com/mikaelweiss/standard-works-corpus/releases/download/data-2026-10-29-154147/scripture-json.zip"
    print(f"Downloading scripture metadata & links from {zip_url}...")
    req = urllib.request.Request(zip_url, headers={"User-Agent": "Mozilla/5.0"})
    res = urllib.request.urlopen(req)
    zip_bytes = io.BytesIO(res.read())
    print("Download complete. Reading metadata...")

    with zipfile.ZipFile(zip_bytes) as z:
        raw_books = json.loads(z.read("book.json"))
        raw_chapters = json.loads(z.read("chapter.json"))
        raw_verses = json.loads(z.read("verse.json"))
        raw_link_kinds = json.loads(z.read("link_kind.json"))
        link_kinds_map = {lk["id"]: lk["name"] for lk in raw_link_kinds}

        # Map chapter_id -> (book_id, book_name, chapter_number, work_id)
        book_map = {b["id"]: b for b in raw_books}
        chapter_map = {}
        for c in raw_chapters:
            b = book_map.get(c["book_id"])
            if b:
                chapter_map[c["id"]] = {
                    "book_id": b["id"],
                    "book_name": b["name"],
                    "chapter_number": c["number"],
                    "work_id": b["work_id"]
                }

        # Map corpus verse_id -> metadata
        # Also track which verses are Book of Mormon
        corpus_verse_map = {}
        for v in raw_verses:
            v_id = v["id"]
            ch = chapter_map.get(v["chapter_id"])
            if ch and v["number"] is not None:
                b_name = ch["book_name"]
                c_num = ch["chapter_number"]
                v_num = v["number"]
                work_id = ch["work_id"]
                
                # Check if this maps to a local BOM verse
                local_id = ref_to_local_id.get((b_name, c_num, v_num))
                corpus_verse_map[v_id] = {
                    "work_id": work_id,
                    "book_name": b_name,
                    "ch": c_num,
                    "v": v_num,
                    "ref": f"{b_name} {c_num}:{v_num}",
                    "local_bom_id": local_id # 1..6604 if BOM, None if Bible/D&C/PoGP
                }

        print(f"Corpus verses mapped: {len(corpus_verse_map)}")

        print("Streaming word.json to calculate word ranges per verse...")
        # Stream word.json to find (first_word_id, last_word_id) for each verse_id
        verse_word_starts = [] # list of (first_word_id, verse_id)
        current_verse_id = None

        with z.open("word.json") as wf:
            # We read in chunks and find "id":<int>,"verse_id":<int>
            pattern = re.compile(rb'\{"id":(\d+),"verse_id":(\d+)')
            buffer = b""
            while True:
                chunk = wf.read(1024 * 1024 * 4) # 4MB chunks
                if not chunk:
                    break
                buffer += chunk
                matches = pattern.findall(buffer)
                if matches:
                    for w_id_b, v_id_b in matches:
                        w_id = int(w_id_b)
                        v_id = int(v_id_b)
                        if v_id != current_verse_id:
                            current_verse_id = v_id
                            verse_word_starts.append((w_id, v_id))
                    # keep remainder after last match to avoid cutting a json token
                    last_pos = buffer.rfind(b'{"id":')
                    if last_pos != -1:
                        buffer = buffer[last_pos:]
                    else:
                        buffer = b""

        print(f"Word mapping indexed across {len(verse_word_starts)} verse boundaries.")
        word_start_keys = [item[0] for item in verse_word_starts]

        def get_verse_for_word(word_id):
            idx = bisect.bisect_right(word_start_keys, word_id) - 1
            if 0 <= idx < len(verse_word_starts):
                v_id = verse_word_starts[idx][1]
                return corpus_verse_map.get(v_id)
            return None

        print("Reading passage_link.json...")
        raw_links = json.loads(z.read("passage_link.json"))
        print(f"Total passage links in corpus: {len(raw_links)}")

        internal_bom_links = []
        bom_to_bible_links = []
        all_bom_links = []

        seen_pairs = set()

        for link in raw_links:
            from_v = get_verse_for_word(link["from_first_word_id"])
            to_v = get_verse_for_word(link["to_first_word_id"])
            
            if not from_v or not to_v:
                continue

            # Check if either end touches the Book of Mormon
            from_is_bom = from_v["local_bom_id"] is not None
            to_is_bom = to_v["local_bom_id"] is not None

            if not from_is_bom and not to_is_bom:
                continue

            link_kind = link_kinds_map.get(link["link_kind_id"], "Cross-reference")

            if from_is_bom and to_is_bom:
                # Internal Book of Mormon connection
                src_id = from_v["local_bom_id"]
                tgt_id = to_v["local_bom_id"]
                pair_key = (min(src_id, tgt_id), max(src_id, tgt_id))
                if pair_key in seen_pairs:
                    continue
                seen_pairs.add(pair_key)

                item = {
                    "source": src_id,
                    "target": tgt_id,
                    "sourceRef": from_v["ref"],
                    "targetRef": to_v["ref"],
                    "type": link_kind,
                    "category": "internal"
                }
                internal_bom_links.append(item)
                all_bom_links.append(item)
            else:
                # Connection between Book of Mormon and Bible (or D&C/PoGP)
                bom_v = from_v if from_is_bom else to_v
                other_v = to_v if from_is_bom else from_v
                
                item = {
                    "source": bom_v["local_bom_id"],
                    "sourceRef": bom_v["ref"],
                    "externalRef": other_v["ref"],
                    "externalWork": "Bible" if other_v["work_id"] == 1 else "Other",
                    "type": link_kind,
                    "category": "external"
                }
                bom_to_bible_links.append(item)

        print(f"\nResults:")
        print(f"  Internal BOM connections (Arc Diagram links): {len(internal_bom_links)}")
        print(f"  BOM to Bible/External connections: {len(bom_to_bible_links)}")

        # Save output JSON files
        with open("public/data/cross_references.json", "w", encoding="utf-8") as f:
            json.dump(internal_bom_links, f, indent=None)
        with open("public/data/cross_references.json", "w", encoding="utf-8") as f:
            json.dump(internal_bom_links, f, indent=None)

        with open("public/data/external_references.json", "w", encoding="utf-8") as f:
            json.dump(bom_to_bible_links, f, indent=None)
        with open("public/data/external_references.json", "w", encoding="utf-8") as f:
            json.dump(bom_to_bible_links, f, indent=None)

        # Build stats per verse: how many connections each verse has
        connection_counts = {v["id"]: 0 for v in local_verses}
        for link in internal_bom_links:
            connection_counts[link["source"]] = connection_counts.get(link["source"], 0) + 1
            connection_counts[link["target"]] = connection_counts.get(link["target"], 0) + 1

        top_connected = sorted(connection_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        print("\nTop 10 most connected verses in the Book of Mormon:")
        for v_id, count in top_connected:
            v_obj = local_verses[v_id - 1]
            print(f"  {v_obj['ref']} (ID {v_id}): {count} connections")

if __name__ == "__main__":
    build_cross_references()
