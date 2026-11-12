import csv
import io
import json
import os
import urllib.request

# Book palette colors matching biblical & scriptural arc themes (gradient hue mapping)
BOOK_COLORS = {
    "1 Nephi": "#4F46E5",        # Indigo
    "2 Nephi": "#6366F1",        # Soft Indigo
    "Jacob": "#8B5CF6",           # Violet
    "Enos": "#A855F7",            # Purple
    "Jarom": "#D946EF",           # Fuchsia
    "Omni": "#EC4899",            # Pink
    "Words of Mormon": "#F43F5E", # Rose
    "Mosiah": "#EF4444",          # Red
    "Alma": "#F97316",            # Orange
    "Helaman": "#F59E0B",         # Amber
    "3 Nephi": "#10B981",         # Emerald (Christ's visit)
    "4 Nephi": "#14B8A6",         # Teal
    "Mormon": "#06B6D4",          # Cyan
    "Ether": "#0EA5E9",           # Sky Blue
    "Moroni": "#3B82F6",          # Royal Blue
}

def download_and_process():
    url = "https://raw.githubusercontent.com/beandog/lds-scriptures/master/csv/lds-scriptures.csv"
    print(f"Downloading LDS Scriptures CSV from: {url}")
    
    req = urllib.request.Request(url, headers={"User-Agent": "MormonBookArcVisualizer/1.0"})
    response = urllib.request.urlopen(req)
    content = io.TextIOWrapper(response, encoding="utf-8")
    reader = csv.DictReader(content)

    print("Filtering Book of Mormon verses...")
    bom_raw_verses = []
    for row in reader:
        if row["volume_title"] == "Book of Mormon":
            bom_raw_verses.append(row)

    print(f"Total raw Book of Mormon verses found: {len(bom_raw_verses)}")

    books_dict = {}
    verses_list = []
    
    current_verse_id = 1
    current_book_id = 0
    current_book_name = None

    for r in bom_raw_verses:
        book_title = r["book_title"].strip()
        book_short = r["book_short_title"].strip()
        chapter_num = int(r["chapter_number"])
        verse_num = int(r["verse_number"])
        text = r["scripture_text"].strip()
        
        if book_title != current_book_name:
            current_book_name = book_title
            current_book_id += 1
            books_dict[book_title] = {
                "id": current_book_id,
                "name": book_title,
                "shortName": book_short,
                "chaptersCount": 0,
                "versesCount": 0,
                "startVerseId": current_verse_id,
                "endVerseId": current_verse_id,
                "color": BOOK_COLORS.get(book_title, "#64748B"),
                "chapters": {}
            }
        
        b = books_dict[book_title]
        b["versesCount"] += 1
        b["endVerseId"] = current_verse_id
        
        if chapter_num not in b["chapters"]:
            b["chapters"][chapter_num] = {
                "chapter": chapter_num,
                "startVerseId": current_verse_id,
                "endVerseId": current_verse_id,
                "versesCount": 0
            }
        
        c = b["chapters"][chapter_num]
        c["versesCount"] += 1
        c["endVerseId"] = current_verse_id
        
        verses_list.append({
            "id": current_verse_id,
            "bookId": current_book_id,
            "book": book_title,
            "shortBook": book_short,
            "ch": chapter_num,
            "v": verse_num,
            "ref": f"{book_title} {chapter_num}:{verse_num}",
            "text": text
        })
        
        current_verse_id += 1

    # Format books for final JSON
    books_list = []
    for b_title, b_data in books_dict.items():
        b_data["chaptersCount"] = len(b_data["chapters"])
        b_data["chaptersList"] = list(b_data["chapters"].values())
        del b_data["chapters"]
        books_list.append(b_data)

    os.makedirs("data", exist_ok=True)
    os.makedirs("public/data", exist_ok=True)

    with open("data/books.json", "w", encoding="utf-8") as f:
        json.dump(books_list, f, indent=2, ensure_ascii=False)
    with open("public/data/books.json", "w", encoding="utf-8") as f:
        json.dump(books_list, f, indent=2, ensure_ascii=False)

    with open("data/verses_en.json", "w", encoding="utf-8") as f:
        json.dump(verses_list, f, indent=None, ensure_ascii=False)
    with open("public/data/verses_en.json", "w", encoding="utf-8") as f:
        json.dump(verses_list, f, indent=None, ensure_ascii=False)

    print(f"Successfully generated:")
    print(f"  - data/books.json ({len(books_list)} books)")
    print(f"  - data/verses_en.json ({len(verses_list)} verses)")

    # Print summary of books
    for b in books_list:
        print(f"    {b['id']}. {b['name']} ({b['chaptersCount']} ch, {b['versesCount']} v, IDs: {b['startVerseId']}..{b['endVerseId']})")

if __name__ == "__main__":
    download_and_process()
