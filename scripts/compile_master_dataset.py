import ast
import json
import os
import urllib.request

def compile_dataset():
    print("1. Loading Book of Mormon verses...")
    with open("public/data/verses_en.json", "r", encoding="utf-8") as f:
        verses = json.load(f)
    with open("public/data/books.json", "r", encoding="utf-8") as f:
        books = json.load(f)

    # Reference lookup: (book, chapter, verse) -> verse_id (1..6604)
    ref_to_id = {}
    ch_range = {} # (book, chapter) -> (min_id, max_id)
    for v in verses:
        b = v["book"]
        ch = v["ch"]
        num = v["v"]
        vid = v["id"]
        ref_to_id[(b, ch, num)] = vid
        
        if (b, ch) not in ch_range:
            ch_range[(b, ch)] = [vid, vid]
        else:
            ch_range[(b, ch)][1] = vid

    internal_links = []
    external_links = []
    seen_internal = set()
    seen_external = set()

    # ----------------------------------------------------
    # A. Ingest from bomdb (wordtreefoundation) refs.json
    # ----------------------------------------------------
    print("2. Ingesting from bomdb refs.json...")
    bomdb_url = "https://raw.githubusercontent.com/wordtreefoundation/bomdb/master/public/data/refs.json"
    req = urllib.request.Request(bomdb_url, headers={"User-Agent": "Mozilla/5.0"})
    bomdb_data = json.loads(urllib.request.urlopen(req).read().decode("utf-8"))

    for section, ref_list in bomdb_data.items():
        for item in ref_list:
            b_book = item.get("book")
            b_ch = item.get("chapter")
            b_v = item.get("verse")
            src_id = ref_to_id.get((b_book, b_ch, b_v))
            if not src_id:
                continue

            ref_book = item.get("ref_book")
            ref_ch = item.get("ref_chapter")
            ref_v = item.get("ref_verse")
            target_ref = f"{ref_book} {ref_ch}:{ref_v}"
            
            # Is target inside BOM?
            tgt_id = ref_to_id.get((ref_book, ref_ch, ref_v))
            kind = "quotation" if item.get("is_quotation") else ("parallel" if item.get("is_parallel") else "cross-reference")

            if tgt_id:
                pair = (min(src_id, tgt_id), max(src_id, tgt_id))
                if pair not in seen_internal:
                    seen_internal.add(pair)
                    internal_links.append({
                        "source": pair[0],
                        "target": pair[1],
                        "sourceRef": verses[pair[0] - 1]["ref"],
                        "targetRef": verses[pair[1] - 1]["ref"],
                        "type": kind,
                        "category": "internal"
                    })
            else:
                ext_key = (src_id, target_ref)
                if ext_key not in seen_external:
                    seen_external.add(ext_key)
                    external_links.append({
                        "source": src_id,
                        "sourceRef": verses[src_id - 1]["ref"],
                        "externalRef": target_ref,
                        "externalWork": "Bible-OT" if "OT" in section else "Bible-NT",
                        "type": kind,
                        "category": "external"
                    })

    print(f"   bomdb added: {len(internal_links)} internal, {len(external_links)} external")

    # ----------------------------------------------------
    # B. Ingest from kz6fittycent/Desktop-Scriptures
    # ----------------------------------------------------
    print("3. Ingesting from Desktop-Scriptures build_cross_references.py...")
    ds_url = "https://raw.githubusercontent.com/kz6fittycent/Desktop-Scriptures/master/scripts/build_cross_references.py"
    ds_code = urllib.request.urlopen(ds_url).read().decode("utf-8")
    entries_str = ds_code[ds_code.find("ENTRIES = ["):]
    tree = ast.parse(entries_str)
    ds_entries = [n for n in tree.body[0].value.elts]

    for entry in ds_entries:
        vals = []
        for elt in entry.elts:
            if isinstance(elt, ast.Constant):
                vals.append(elt.value)
            elif isinstance(elt, ast.Str):
                vals.append(elt.s)
            elif isinstance(elt, ast.Num):
                vals.append(elt.n)
            else:
                vals.append(None)

        if len(vals) < 12:
            continue

        b_name, vol, ch, v_s, v_e, rel_b, rel_vol, rel_ch, rel_v_s, rel_v_e, rel_kind, topics = vals[:12]
        note = vals[12] if len(vals) > 12 else ""

        # Normalize volume names
        is_bom_1 = (vol == "The Book of Mormon" or (b_name, ch) in ch_range)
        is_bom_2 = (rel_vol == "The Book of Mormon" or (rel_b, rel_ch) in ch_range)

        if not is_bom_1 and not is_bom_2:
            continue

        # Helper to get verse ID range
        def resolve_range(b, c, s, e):
            if not s and not e:
                # whole chapter
                return ch_range.get((b, c))
            v1 = ref_to_id.get((b, c, s or 1))
            v2 = ref_to_id.get((b, c, e or s or 1))
            if v1 and v2:
                return [min(v1, v2), max(v1, v2)]
            return None

        if is_bom_1 and is_bom_2:
            # Internal connection!
            r1 = resolve_range(b_name, ch, v_s, v_e)
            r2 = resolve_range(rel_b, rel_ch, rel_v_s, rel_v_e)
            if r1 and r2:
                src_id = r1[0]
                tgt_id = r2[0]
                if src_id != tgt_id:
                    pair = (min(src_id, tgt_id), max(src_id, tgt_id))
                    if pair not in seen_internal:
                        seen_internal.add(pair)
                        internal_links.append({
                            "source": pair[0],
                            "target": pair[1],
                            "sourceRef": verses[pair[0] - 1]["ref"],
                            "targetRef": verses[pair[1] - 1]["ref"],
                            "type": rel_kind or "parallel",
                            "topics": topics or "",
                            "note": note or "",
                            "category": "internal"
                        })
        else:
            # BOM to Bible/External
            bom_info = (b_name, ch, v_s, v_e) if is_bom_1 else (rel_b, rel_ch, rel_v_s, rel_v_e)
            ext_info = (rel_b, rel_ch, rel_v_s, rel_v_e, rel_vol) if is_bom_1 else (b_name, ch, v_s, v_e, vol)
            
            r_bom = resolve_range(*bom_info)
            if r_bom:
                src_id = r_bom[0]
                ext_ref = f"{ext_info[0]} {ext_info[1]}" + (f":{ext_info[2]}" if ext_info[2] else "")
                ext_key = (src_id, ext_ref)
                if ext_key not in seen_external:
                    seen_external.add(ext_key)
                    external_links.append({
                        "source": src_id,
                        "sourceRef": verses[src_id - 1]["ref"],
                        "externalRef": ext_ref,
                        "externalWork": ext_info[4] or "Bible",
                        "type": rel_kind or "parallel",
                        "topics": topics or "",
                        "note": note or "",
                        "category": "external"
                    })

    # ----------------------------------------------------
    # C. Classical Key Internal BOM Connections
    # ----------------------------------------------------
    # Well-established internal prophetic fulfillments and cross-textual links
    CLASSIC_INTERNAL = [
        # Lehi's Dream & Nephi's Vision
        ("1 Nephi 8:2", "1 Nephi 11:1", "prophecy-vision", "Nephi desires to behold and understand the vision seen by his father Lehi."),
        ("1 Nephi 8:19", "1 Nephi 11:25", "typology", "The iron rod which Lehi saw is interpreted as the word of God leading to the tree of life."),
        ("1 Nephi 8:30", "1 Nephi 15:24", "fulfillment", "Holding fast to the rod of iron protects against the fiery darts of the adversary."),
        # Brass Plates & Isaiah citations
        ("1 Nephi 5:14", "1 Nephi 19:21", "quotation", "Nephi traces his genealogy and explains the record kept on the plates of brass."),
        ("1 Nephi 22:1", "2 Nephi 25:1", "parallel", "Nephi expounds the words of Isaiah to his brethren."),
        # Abinadi & Alma
        ("Mosiah 14:1", "Mosiah 15:1", "prophecy", "Abinadi quotes Isaiah 53 and expounds how God himself shall redeem his people."),
        ("Mosiah 17:2", "Mosiah 18:1", "fulfillment", "Alma repents at the words of Abinadi and secretly begins preaching the gospel at the Waters of Mormon."),
        ("Mosiah 17:15", "Mosiah 19:20", "fulfillment", "Abinadi's prophecy on King Noah's death by fire is fulfilled."),
        # Alma's Conversion & Retelling
        ("Mosiah 27:24", "Alma 36:18", "parallel", "Alma the Younger recounts his three-day experience of repentance through remembering Jesus Christ."),
        ("Mosiah 27:28", "Alma 38:8", "parallel", "Alma testifies to his son Shiblon of his miraculous conversion."),
        # Samuel the Lamanite & Signs of Christ
        ("Helaman 14:2", "3 Nephi 1:15", "fulfillment", "Samuel the Lamanite's prophecy of a night with no darkness at the birth of Christ is fulfilled."),
        ("Helaman 14:20", "3 Nephi 8:5", "fulfillment", "Samuel's prophecy of three days of darkness and tempest at Christ's crucifixion is fulfilled."),
        ("Helaman 14:25", "3 Nephi 23:9", "fulfillment", "Jesus commands the Nephite record keepers to record that many saints arose from the dead, as prophesied by Samuel."),
        # Christ's Appearance
        ("2 Nephi 26:1", "3 Nephi 11:8", "fulfillment", "Nephi foretells that Christ will appear unto his seed after His resurrection."),
        ("Mosiah 3:5", "3 Nephi 11:10", "fulfillment", "King Benjamin's angelic prophecy of Christ descending among men is realized."),
        ("3 Nephi 11:27", "3 Nephi 28:10", "doctrine", "The doctrine of Christ: the Father, Son, and Holy Ghost are one."),
        # Moroni & The Plates
        ("Mormon 8:1", "Moroni 1:1", "narrative", "Moroni takes up the record after the destruction of the Nephite nation at Cumorah."),
        ("Mormon 9:37", "Moroni 10:3", "exhortation", "Moroni's concluding farewell and final exhortation to remember God's mercy throughout all generations.")
    ]

    for src_ref, tgt_ref, k_type, k_note in CLASSIC_INTERNAL:
        p1 = src_ref.split(":")
        b_c1 = p1[0].rsplit(" ", 1)
        v1_id = ref_to_id.get((b_c1[0], int(b_c1[1]), int(p1[1])))

        p2 = tgt_ref.split(":")
        b_c2 = p2[0].rsplit(" ", 1)
        v2_id = ref_to_id.get((b_c2[0], int(b_c2[1]), int(p2[1])))

        if v1_id and v2_id:
            pair = (min(v1_id, v2_id), max(v1_id, v2_id))
            if pair not in seen_internal:
                seen_internal.add(pair)
                internal_links.append({
                    "source": pair[0],
                    "target": pair[1],
                    "sourceRef": src_ref,
                    "targetRef": tgt_ref,
                    "type": k_type,
                    "note": k_note,
                    "category": "internal"
                })

    print(f"\nFinal compilation totals:")
    print(f"  Total internal Book of Mormon arcs: {len(internal_links)}")
    print(f"  Total external Bible references: {len(external_links)}")

    # Sort internal links by source id
    internal_links.sort(key=lambda x: (x["source"], x["target"]))
    external_links.sort(key=lambda x: x["source"])

    # Save to data and public/data
    with open("public/data/cross_references.json", "w", encoding="utf-8") as f:
        json.dump(internal_links, f, indent=2, ensure_ascii=False)
    with open("public/data/cross_references.json", "w", encoding="utf-8") as f:
        json.dump(internal_links, f, indent=None, ensure_ascii=False)

    with open("public/data/external_references.json", "w", encoding="utf-8") as f:
        json.dump(external_links, f, indent=2, ensure_ascii=False)
    with open("public/data/external_references.json", "w", encoding="utf-8") as f:
        json.dump(external_links, f, indent=None, ensure_ascii=False)

    print("Master datasets compiled successfully.")

if __name__ == "__main__":
    compile_dataset()
