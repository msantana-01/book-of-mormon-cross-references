import fs from "fs";
import path from "path";
import assert from "assert";

const DATA_DIR = path.resolve("public/data");

console.log("🔍 Running Book of Mormon Cross-References Data Integrity Test...");

// 1. Check Books
const booksPath = path.join(DATA_DIR, "books.json");
assert.ok(fs.existsSync(booksPath), "books.json must exist in public/data");
const books = JSON.parse(fs.readFileSync(booksPath, "utf-8"));
assert.strictEqual(books.length, 15, "There must be exactly 15 books");

let totalBookVerses = 0;
let prevEndVerse = 0;
books.forEach((b, idx) => {
  assert.ok(b.id, `Book #${idx} must have an id`);
  assert.ok(b.name, `Book #${idx} must have a name`);
  assert.ok(b.chaptersCount > 0, `Book ${b.name} must have chapters > 0`);
  assert.ok(b.versesCount > 0, `Book ${b.name} must have verses > 0`);
  assert.strictEqual(b.startVerseId, prevEndVerse + 1, `Book ${b.name} startVerseId must follow previous book end`);
  assert.strictEqual(b.endVerseId, b.startVerseId + b.versesCount - 1, `Book ${b.name} endVerseId must match verse count`);
  totalBookVerses += b.versesCount;
  prevEndVerse = b.endVerseId;
});
assert.strictEqual(totalBookVerses, 6604, "Total verses in books.json must equal 6,604");
console.log(`✓ books.json: 15 books, ${totalBookVerses} total verses validated`);

// 2. Check Verses
const versesPath = path.join(DATA_DIR, "verses_en.json");
assert.ok(fs.existsSync(versesPath), "verses_en.json must exist");
const verses = JSON.parse(fs.readFileSync(versesPath, "utf-8"));
assert.strictEqual(verses.length, 6604, "verses_en.json must contain exactly 6,604 verses");

verses.forEach((v, idx) => {
  const expectedId = idx + 1;
  assert.strictEqual(v.id, expectedId, `Verse at index ${idx} must have id ${expectedId}`);
  assert.ok(v.ref, `Verse #${expectedId} must have a ref`);
  assert.ok(v.book, `Verse #${expectedId} must have a book`);
  assert.ok(typeof v.ch === "number" && v.ch >= 1, `Verse #${expectedId} must have ch >= 1`);
  assert.ok(typeof v.v === "number" && v.v >= 1, `Verse #${expectedId} must have v >= 1`);
  assert.ok(v.text && v.text.length > 0, `Verse #${expectedId} must have non-empty text`);
});
console.log(`✓ verses_en.json: 6,604 verses sequentially validated`);

// 2b. Check Portuguese Verses
const versesPtPath = path.join(DATA_DIR, "verses_pt.json");
assert.ok(fs.existsSync(versesPtPath), "verses_pt.json must exist");
const versesPt = JSON.parse(fs.readFileSync(versesPtPath, "utf-8"));
assert.strictEqual(versesPt.length, 6604, "verses_pt.json must contain exactly 6,604 verses");

versesPt.forEach((v, idx) => {
  const expectedId = idx + 1;
  assert.strictEqual(v.id, expectedId, `Verse PT at index ${idx} must have id ${expectedId}`);
  assert.ok(v.ref, `Verse PT #${expectedId} must have a ref`);
  assert.ok(v.book, `Verse PT #${expectedId} must have a book`);
  assert.ok(typeof v.ch === "number" && v.ch >= 1, `Verse PT #${expectedId} must have ch >= 1`);
  assert.ok(typeof v.v === "number" && v.v >= 1, `Verse PT #${expectedId} must have v >= 1`);
  assert.ok(v.text && v.text.length > 0, `Verse PT #${expectedId} must have non-empty text`);
});
console.log(`✓ verses_pt.json: 6,604 verses sequentially validated`);

// 3. Check Internal Cross-References
const crossPath = path.join(DATA_DIR, "cross_references.json");
assert.ok(fs.existsSync(crossPath), "cross_references.json must exist");
const crossRefs = JSON.parse(fs.readFileSync(crossPath, "utf-8"));
assert.ok(crossRefs.length > 0, "cross_references.json must contain links");

crossRefs.forEach((l, idx) => {
  assert.ok(l.source >= 1 && l.source <= 6604, `Internal link #${idx} source ${l.source} out of bounds`);
  assert.ok(l.target >= 1 && l.target <= 6604, `Internal link #${idx} target ${l.target} out of bounds`);
  if (l.note) {
    assert.ok(l.notePt && l.notePt.length > 0, `Internal link #${idx} must have non-empty notePt`);
  }
});
console.log(`✓ cross_references.json: ${crossRefs.length} internal links validated (all within 1..6604, all notes localized)`);

// 4. Check External Biblical References
const extPath = path.join(DATA_DIR, "external_references.json");
assert.ok(fs.existsSync(extPath), "external_references.json must exist");
const extRefs = JSON.parse(fs.readFileSync(extPath, "utf-8"));
assert.ok(extRefs.length > 0, "external_references.json must contain links");

extRefs.forEach((l, idx) => {
  assert.ok(l.source >= 1 && l.source <= 6604, `External link #${idx} source ${l.source} out of bounds`);
  assert.ok(l.externalRef && l.externalRef.length > 0, `External link #${idx} must have externalRef`);
  if (l.note) {
    assert.ok(l.notePt && l.notePt.length > 0, `External link #${idx} must have non-empty notePt`);
  }
});
console.log(`✓ external_references.json: ${extRefs.length} external links validated (all notes localized)`);

// 5. Check Literary Structures
const structPath = path.join(DATA_DIR, "literary_structures.json");
assert.ok(fs.existsSync(structPath), "literary_structures.json must exist");
const structures = JSON.parse(fs.readFileSync(structPath, "utf-8"));
assert.ok(structures.length > 0, "literary_structures.json must contain structures");

structures.forEach((s, idx) => {
  assert.ok(s.id, `Structure #${idx} must have id`);
  assert.ok(s.type, `Structure #${idx} must have type`);
  assert.ok(Array.isArray(s.verseIds) && s.verseIds.length > 0, `Structure ${s.id} must have verseIds`);
  s.verseIds.forEach(vid => {
    assert.ok(vid >= 1 && vid <= 6604, `Structure ${s.id} verseId ${vid} out of bounds`);
  });
});
console.log(`✓ literary_structures.json: ${structures.length} structures validated`);

console.log("\n✅ All data integrity checks PASSED successfully!");
