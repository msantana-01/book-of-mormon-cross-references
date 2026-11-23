import json

path_data = 'public/data/external_references.json'
path_public = 'public/data/external_references.json'
path_dist = 'dist/public/data/external_references.json'

with open(path_data, 'r', encoding='utf-8') as f:
    ext = json.load(f)

new_entries = [
    {
        'source': 4876,
        'sourceRef': 'Helaman 14:2',
        'externalRef': 'Luke 2:10-11',
        'externalWork': 'Holy Bible',
        'type': 'prophecy',
        'topics': 'jesus-christ',
        'note': "Samuel the Lamanite foretells the heavenly sign of Christ's birth—a night without darkness—harmonizing with Luke's account of the glory of the Lord shining upon the shepherds at Christ's nativity.",
        'category': 'external'
    },
    {
        'source': 4876,
        'sourceRef': 'Helaman 14:2',
        'externalRef': 'Matthew 2:2',
        'externalWork': 'Holy Bible',
        'type': 'prophecy',
        'topics': 'jesus-christ',
        'note': "Samuel prophesies of a new star arising as a divine sign of the Messiah, aligning with the star witnessed by the Magi in Matthew.",
        'category': 'external'
    },
    {
        'source': 182,
        'sourceRef': '1 Nephi 8:19',
        'externalRef': 'Psalm 119:105',
        'externalWork': 'Holy Bible',
        'type': 'typology',
        'topics': 'word-of-god',
        'note': "The iron rod representing the word of God leading along the straight and narrow path reflects the Psalmist: 'Thy word is a lamp unto my feet, and a light unto my path.'",
        'category': 'external'
    },
    {
        'source': 182,
        'sourceRef': '1 Nephi 8:19',
        'externalRef': 'Revelation 22:14',
        'externalWork': 'Holy Bible',
        'type': 'typology',
        'topics': 'eternal-life',
        'note': "Pressing forward along the rod of iron to partake of the tree of life prefigures John's vision in Revelation of the blessed partaking of the tree of life in the midst of paradise.",
        'category': 'external'
    },
    {
        'source': 1221,
        'sourceRef': '2 Nephi 26:1',
        'externalRef': 'John 10:16',
        'externalWork': 'Holy Bible',
        'type': 'prophecy',
        'topics': 'jesus-christ',
        'note': "Nephi's prophecy that the resurrected Christ will manifest Himself to His seed in the Americas fulfills Jesus' declaration: 'Other sheep I have, which are not of this fold: them also I must bring, and they shall hear my voice.'",
        'category': 'external'
    },
    {
        'source': 1221,
        'sourceRef': '2 Nephi 26:1',
        'externalRef': 'John 20:19',
        'externalWork': 'Holy Bible',
        'type': 'parallel',
        'topics': 'resurrection',
        'note': "The bodily appearance of the resurrected Lord among the Nephites mirrors Jesus appearing in the midst of His disciples in Jerusalem after His resurrection.",
        'category': 'external'
    },
    {
        'source': 5211,
        'sourceRef': '3 Nephi 11:8',
        'externalRef': 'Acts 1:11',
        'externalWork': 'Holy Bible',
        'type': 'prophecy',
        'topics': 'jesus-christ',
        'note': "Christ descending out of heaven in white robes before the multitude in Bountiful directly mirrors the angel's promise in Acts that 'this same Jesus... shall so come in like manner.'",
        'category': 'external'
    },
    {
        'source': 5211,
        'sourceRef': '3 Nephi 11:8',
        'externalRef': 'Luke 24:39',
        'externalWork': 'Holy Bible',
        'type': 'witness',
        'topics': 'resurrection',
        'note': "The multitude feeling the prints of the nails in the hands and feet of Christ fulfills the tangible reality of the resurrection declared in Luke: 'handle me, and see; for a spirit hath not flesh and bones, as ye see me have.'",
        'category': 'external'
    },
    {
        'source': 2097,
        'sourceRef': 'Mosiah 17:15',
        'externalRef': 'Acts 7:59-60',
        'externalWork': 'Holy Bible',
        'type': 'martyrdom',
        'topics': 'witness-martyrdom',
        'note': "Abinadi sealing his testimony with his life ('O God, receive my soul') directly parallels the martyrdom of Stephen in the book of Acts.",
        'category': 'external'
    },
    {
        'source': 6008,
        'sourceRef': 'Mormon 9:37',
        'externalRef': 'Jude 1:24-25',
        'externalWork': 'Holy Bible',
        'type': 'doxology',
        'topics': 'grace-salvation',
        'note': "Moroni's solemn farewell and prayer that God may remember His covenant unto the house of Israel harmonizes with Jude's apostolic benediction.",
        'category': 'external'
    }
]

existing_keys = set((e['source'], e['externalRef']) for e in ext)
added = 0
for entry in new_entries:
    key = (entry['source'], entry['externalRef'])
    if key not in existing_keys:
        ext.append(entry)
        existing_keys.add(key)
        added += 1

print(f"Added {added} new high-value external references.")

with open(path_data, 'w', encoding='utf-8') as f:
    json.dump(ext, f, indent=2, ensure_ascii=False)

with open(path_public, 'w', encoding='utf-8') as f:
    json.dump(ext, f, indent=2, ensure_ascii=False)

try:
    with open(path_dist, 'w', encoding='utf-8') as f:
        json.dump(ext, f, indent=2, ensure_ascii=False)
except Exception as e:
    print('Dist error:', e)
