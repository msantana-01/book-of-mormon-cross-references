import json

with open('data/verses_en.json', 'r', encoding='utf-8') as f:
    verses = json.load(f)

vmap = {v['ref']: v['id'] for v in verses}

structures = [
  {
    "id": "chiasmus-alma-36",
    "type": "chiasmus",
    "titleEn": "The Great Chiasmus of Alma 36 (Center on Christ)",
    "titlePt": "O Grande Quiasmo de Alma 36 (Ápice em Cristo)",
    "passage": "Alma 36:1-30",
    "descriptionEn": "Considered one of the finest and most complete examples of ancient Semitic chiasmus in world literature. The entire 30 verses revolve symmetrically around verse 18: Alma turning his whole soul to Jesus Christ for redemption.",
    "descriptionPt": "Considerado um dos mais refinados quiasmos da literatura antiga mundial. Todos os 30 versículos giram simetricamente em torno de um único ápice no versículo 18: o clamor desesperado de Alma por Jesus Cristo.",
    "centerVerseId": vmap["Alma 36:18"],
    "verseIds": [
      vmap["Alma 36:1"], vmap["Alma 36:2"], vmap["Alma 36:3"],
      vmap["Alma 36:12"], vmap["Alma 36:14"], vmap["Alma 36:17"],
      vmap["Alma 36:18"], vmap["Alma 36:19"], vmap["Alma 36:20"],
      vmap["Alma 36:22"], vmap["Alma 36:27"], vmap["Alma 36:29"],
      vmap["Alma 36:30"]
    ],
    "chiasticTree": [
      {"level": "A", "verseId": vmap["Alma 36:1"], "ref": "Alma 36:1", "textEn": "Keep commandments and prosper in the land", "textPt": "Guardar os mandamentos e prosperar na terra"},
      {"level": "B", "verseId": vmap["Alma 36:2"], "ref": "Alma 36:2", "textEn": "Remember the captivity of our fathers", "textPt": "Lembrar o cativeiro de nossos pais"},
      {"level": "C", "verseId": vmap["Alma 36:3"], "ref": "Alma 36:3", "textEn": "Trust in God and be supported in trials", "textPt": "Confiança em Deus para apoio nas aflições"},
      {"level": "D", "verseId": vmap["Alma 36:12"], "ref": "Alma 36:12", "textEn": "Tormented with pains of hell for iniquities", "textPt": "Atormentado pelas dores do inferno por pecados"},
      {"level": "E", "verseId": vmap["Alma 36:17"], "ref": "Alma 36:17", "textEn": "Remembered prophesying of one Jesus Christ", "textPt": "Lembrou-se da profecia de Jesus Cristo"},
      {"level": "⭐ ÁPICE", "verseId": vmap["Alma 36:18"], "ref": "Alma 36:18", "isCenter": True, "textEn": "O Jesus, thou Son of God, have mercy on me!", "textPt": "Ó Jesus, tu que és Filho de Deus, tem misericórdia de mim!"},
      {"level": "E'", "verseId": vmap["Alma 36:19"], "ref": "Alma 36:19", "textEn": "Could remember my pains no more", "textPt": "Não mais me lembrei de minhas dores"},
      {"level": "D'", "verseId": vmap["Alma 36:20"], "ref": "Alma 36:20", "textEn": "Soul filled with marvelous light and joy", "textPt": "Alma cheia de luz maravilhosa e alegria"},
      {"level": "C'", "verseId": vmap["Alma 36:27"], "ref": "Alma 36:27", "textEn": "Trust in Him and delivered from trials", "textPt": "Confiança Nele e livramento das tribulações"},
      {"level": "B'", "verseId": vmap["Alma 36:29"], "ref": "Alma 36:29", "textEn": "Remember the deliverance from bondage", "textPt": "Lembrar a libertação da servidão"},
      {"level": "A'", "verseId": vmap["Alma 36:30"], "ref": "Alma 36:30", "textEn": "Keep his commandments and prosper", "textPt": "Guardar seus mandamentos e prosperar"}
    ]
  },
  {
    "id": "chiasmus-mosiah-3",
    "type": "chiasmus",
    "titleEn": "Chiasmus of the Natural Man & Christ (Mosiah 3:18-19)",
    "titlePt": "Quiasmo do Homem Natural & Cristo (Mosias 3:18-19)",
    "passage": "Mosiah 3:18-19",
    "descriptionEn": "King Benjamin employs a strict ancient chiastic structure contrasting natural man fallen in Adam against divine spiritual rebirth through the atoning blood of Christ.",
    "descriptionPt": "O Rei Benjamim emprega uma estrita estrutura quiástica semítica contrastando o homem natural caído com o renascimento espiritual pelo sangue expiatório de Cristo.",
    "centerVerseId": vmap["Mosiah 3:19"],
    "verseIds": [vmap["Mosiah 3:18"], vmap["Mosiah 3:19"]],
    "chiasticTree": [
      {"level": "A", "verseId": vmap["Mosiah 3:18"], "ref": "Mosiah 3:18", "textEn": "Salvation through the atoning blood of Christ the Lord", "textPt": "Salvação pelo sangue expiatório de Cristo o Senhor"},
      {"level": "B", "verseId": vmap["Mosiah 3:18"], "ref": "Mosiah 3:18", "textEn": "Men drink damnation unless they humble themselves", "textPt": "Homens bebem condenação a menos que se humilhem"},
      {"level": "C", "verseId": vmap["Mosiah 3:19"], "ref": "Mosiah 3:19", "textEn": "The natural man is an enemy to God", "textPt": "O homem natural é inimigo de Deus"},
      {"level": "⭐ ÁPICE", "verseId": vmap["Mosiah 3:19"], "ref": "Mosiah 3:19", "isCenter": True, "textEn": "Has been from the fall of Adam, and will be forever", "textPt": "Tem sido desde a queda de Adão e será para sempre"},
      {"level": "C'", "verseId": vmap["Mosiah 3:19"], "ref": "Mosiah 3:19", "textEn": "Unless he yields to the enticings of the Holy Spirit", "textPt": "A não ser que ceda aos influxos do Santo Espírito"},
      {"level": "B'", "verseId": vmap["Mosiah 3:19"], "ref": "Mosiah 3:19", "textEn": "Putteth off the natural man and becometh as a child", "textPt": "Despoje-se do homem natural e torne-se como criança"},
      {"level": "A'", "verseId": vmap["Mosiah 3:19"], "ref": "Mosiah 3:19", "textEn": "Submissive, meek, through the atonement of Christ", "textPt": "Submisso e manso, pela expiação de Cristo o Senhor"}
    ]
  },
  {
    "id": "chiasmus-alma-41",
    "type": "chiasmus",
    "titleEn": "The Law of Restoration Chiasmus (Alma 41:13-15)",
    "titlePt": "Quiasmo da Lei da Restauração (Alma 41:13-15)",
    "passage": "Alma 41:13-15",
    "descriptionEn": "Alma explains the profound metaphysical symmetry of divine justice: what a soul sends forth in mortality is returned unto it in the resurrection.",
    "descriptionPt": "Alma ensina a simetria metafísica da justiça divina: aquilo que a alma emite na mortalidade é exatamente o que retorna para ela na ressurreição.",
    "centerVerseId": vmap["Alma 41:14"],
    "verseIds": [vmap["Alma 41:13"], vmap["Alma 41:14"], vmap["Alma 41:15"]],
    "chiasticTree": [
      {"level": "A", "verseId": vmap["Alma 41:13"], "ref": "Alma 41:13", "textEn": "Good for good, righteous for righteous", "textPt": "Bom restaurado ao bom, justo ao justo"},
      {"level": "B", "verseId": vmap["Alma 41:14"], "ref": "Alma 41:14", "textEn": "Judge righteously and do good continually", "textPt": "Julgar com retidão e fazer o bem continuamente"},
      {"level": "⭐ ÁPICE", "verseId": vmap["Alma 41:14"], "ref": "Alma 41:14", "isCenter": True, "textEn": "That which ye do send out shall return unto you again", "textPt": "Aquilo que enviares retornará novamente a ti"},
      {"level": "B'", "verseId": vmap["Alma 41:14"], "ref": "Alma 41:14", "textEn": "Mercy and justice rewarded again unto thee", "textPt": "Misericórdia e justiça recompensadas a ti"},
      {"level": "A'", "verseId": vmap["Alma 41:15"], "ref": "Alma 41:15", "textEn": "Evil restored for evil, carnal for carnal", "textPt": "O mal devolvido ao mal, o carnal ao carnal"}
    ]
  },
  {
    "id": "formula-thus-we-see",
    "type": "prophetic-formula",
    "titleEn": "Prophetic Editorial Formula: \"And thus we see...\"",
    "titlePt": "Fórmula Editorial de Mórmon: \"E assim vemos...\"",
    "passage": "Mormon's Signature Formula",
    "descriptionEn": "A distinctive ancient Hebrew editorial signature used specifically by the prophet-historian Mormon to pause historical narrative and instruct future readers in eternal divine principles.",
    "descriptionPt": "Uma assinatura editorial e profética semítica utilizada por Mórmon para interromper o relato histórico e instruir o leitor com uma verdade moral e teológica imutável.",
    "verseIds": [
      vmap["Helaman 12:1"], vmap["Alma 30:60"], vmap["Alma 24:19"],
      vmap["Alma 28:13"], vmap["Helaman 3:27"], vmap["3 Nephi 5:8"]
    ],
    "examples": [
      {"ref": "Helaman 12:1", "verseId": vmap["Helaman 12:1"], "tagEn": "Patience of God vs human unsteadiness", "tagPt": "Paciência de Deus vs inconstância humana"},
      {"ref": "Alma 30:60", "verseId": vmap["Alma 30:60"], "tagEn": "Devil will not support his children", "tagPt": "O diabo não apoia seus seguidores no fim"},
      {"ref": "Alma 24:19", "verseId": vmap["Alma 24:19"], "tagEn": "Love stronger than the fear of death", "tagPt": "Amor mais forte que o medo da morte"},
      {"ref": "Alma 28:13", "verseId": vmap["Alma 28:13"], "tagEn": "Inequality caused by human transgression", "tagPt": "Desigualdade causada pela transgressão humana"},
      {"ref": "Helaman 3:27", "verseId": vmap["Helaman 3:27"], "tagEn": "The Lord is merciful to all sincere hearts", "tagPt": "O Senhor é misericordioso com corações sinceros"},
      {"ref": "3 Nephi 5:8", "verseId": vmap["3 Nephi 5:8"], "tagEn": "The Lord delivers His covenant people", "tagPt": "O Senhor livra Seu povo da aliança"}
    ]
  },
  {
    "id": "formula-covenant-land",
    "type": "prophetic-formula",
    "titleEn": "Covenant Formula of the Promised Land (\"Prosper in the Land\")",
    "titlePt": "Fórmula da Aliança da Terra da Promissão (\"Prosperar na Terra\")",
    "passage": "Mosaic Covenant Model",
    "descriptionEn": "The recurring conditional covenant of the Book of Mormon, rooted in ancient Deuteronomy and Leviticus: obedience guarantees prosperity and divine guidance; iniquity leads to separation from God.",
    "descriptionPt": "A aliança condicional hebraica que atravessa todo o Livro de Mórmon, enraizada no modelo de Deuteronômio: guardar mandamentos traz prosperidade e direção; iniquidade afasta a presença do Senhor.",
    "verseIds": [
      vmap["1 Nephi 2:20"], vmap["1 Nephi 4:14"], vmap["2 Nephi 1:20"],
      vmap["2 Nephi 4:4"], vmap["Alma 9:13"], vmap["Alma 36:1"]
    ],
    "examples": [
      {"ref": "1 Nephi 2:20", "verseId": vmap["1 Nephi 2:20"], "tagEn": "Initial covenant given to Nephi", "tagPt": "Aliança inaugural revelada a Néfi"},
      {"ref": "1 Nephi 4:14", "verseId": vmap["1 Nephi 4:14"], "tagEn": "Reminded to Nephi during Brass Plates quest", "tagPt": "Lembrada a Néfi ao buscar as Placas"},
      {"ref": "2 Nephi 1:20", "verseId": vmap["2 Nephi 1:20"], "tagEn": "Lehi confirms the covenant to his posterity", "tagPt": "Leí confirma a aliança à sua posteridade"},
      {"ref": "2 Nephi 4:4", "verseId": vmap["2 Nephi 4:4"], "tagEn": "Lehi to the sons of Laman and Lemuel", "tagPt": "Leí exorta os filhos de Lamã e Lemuel"},
      {"ref": "Alma 9:13", "verseId": vmap["Alma 9:13"], "tagEn": "Alma warns the apostates of Ammonihah", "tagPt": "Alma adverte os apóstatas de Amonia"},
      {"ref": "Alma 36:1", "verseId": vmap["Alma 36:1"], "tagEn": "Alma opens his chiastic testament to Helaman", "tagPt": "Alma abre seu testamento quiástico a Helamã"}
    ]
  },
  {
    "id": "hebraism-construct-and-oaths",
    "type": "hebraism",
    "titleEn": "Semitic Construct State & Solemn Oath Formulas",
    "titlePt": "Estado Construto Hebraico & Fórmulas de Juramento",
    "passage": "Ancient Near Eastern Syntax",
    "descriptionEn": "Strict grammatical survivals of ancient Hebrew: construct chain nouns ('plates of brass', 'rod of iron', 'altar of stones'), biographical colophons, and biblical life-oaths ('As the Lord liveth').",
    "descriptionPt": "Sobrevivências gramaticais do hebraico antigo: cadeias de estado construto ('placas de latão', 'barra de ferro', 'altar de pedras'), colofões biográficos e juramentos sagrados ('Vive o Senhor').",
    "verseIds": [
      vmap["1 Nephi 1:1"], vmap["1 Nephi 3:15"], vmap["1 Nephi 8:19"],
      vmap["1 Nephi 3:3"], vmap["1 Nephi 2:7"], vmap["1 Nephi 4:32"]
    ],
    "examples": [
      {"ref": "1 Nephi 1:1", "verseId": vmap["1 Nephi 1:1"], "tagEn": "Ancient Colophon: \"I, Nephi, born of goodly parents...\"", "tagPt": "Colofão Autobiográfico: \"Eu, Néfi, tendo nascido...\""},
      {"ref": "1 Nephi 3:15", "verseId": vmap["1 Nephi 3:15"], "tagEn": "Solemn Hebrew Oath: \"As the Lord liveth, and as we live...\"", "tagPt": "Juramento Hebraico: \"Vive o Senhor e vivemos nós...\""},
      {"ref": "1 Nephi 8:19", "verseId": vmap["1 Nephi 8:19"], "tagEn": "Construct State: \"Rod of iron\" (instead of iron rod)", "tagPt": "Estado Construto: \"Barra de ferro\""},
      {"ref": "1 Nephi 3:3", "verseId": vmap["1 Nephi 3:3"], "tagEn": "Construct State: \"Plates of brass\" (instead of brass plates)", "tagPt": "Estado Construto: \"Placas de latão\""},
      {"ref": "1 Nephi 2:7", "verseId": vmap["1 Nephi 2:7"], "tagEn": "Construct State: \"Altar of stones\"", "tagPt": "Estado Construto: \"Altar de pedras\""},
      {"ref": "1 Nephi 4:32", "verseId": vmap["1 Nephi 4:32"], "tagEn": "Ancient Pact: Nephi swears an inviolable oath unto Zoram", "tagPt": "Pacto Solene: Néfi faz juramento sagrado a Zorã"}
    ]
  }
]

with open('data/literary_structures.json', 'w', encoding='utf-8') as f:
    json.dump(structures, f, ensure_ascii=False, indent=2)

print('Created data/literary_structures.json successfully with', len(structures), 'structures!')
