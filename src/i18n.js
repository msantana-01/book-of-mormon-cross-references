export const translations = {
  en: {
    title: "Book of Mormon Cross-References",
    subtitle: "Explore connections, fulfillments, quotations, and biblical parallels across 6,604 verses.",
    searchPlaceholder: "Search verse (e.g. Alma 32:21, 1 Ne 3:7) or keyword...",
    filterAll: "All Connections",
    filterInternal: "Internal Arcs (BOM ↔ BOM)",
    filterExternal: "Bible Parallels (BOM ↔ OT/NT)",
    selectBook: "Select Book",
    allBooks: "Whole Book of Mormon",
    legendTitle: "Color Legend & Canon Proportion",
    statsBooks: "15 Books",
    statsChapters: "239 Chapters",
    statsVerses: "6,604 Verses",
    drawerTitle: "Verse Inspector",
    drawerEmpty: "Hover or click on any point along the scripture axis to inspect verses and connected arcs.",
    connectionsCount: "{n} Connections",
    noConnections: "No direct cross-references recorded for this specific verse.",
    readOnOfficial: "Read chapter on ChurchofJesusChrist.org ↗",
    typeQuotation: "Quotation",
    typeParallel: "Parallel",
    typeFulfillment: "Prophecy Fulfillment",
    typeTypology: "Typology / Symbol",
    typeCrossref: "Cross-Reference",
    typeProphecy: "Prophecy",
    categoryInternal: "Internal Book of Mormon",
    categoryExternal: "Bible Connection",
    jumpTo: "Jump to",
    doctrineNote: "Doctrinal Insight",
    aboutCredits: "Data based on public domain records (scriptures.nephi.org / LDS Documentation Project, bomdb, and open scripture research).",
    langToggle: "Português",
    featuredTitle: "Featured Key Connections:",
    prevBtn: "Previous",
    nextBtn: "Next",
    randomBtn: "Random",
    connectionCounter: "Connection {current} of {total}",
    allTopics: "All Doctrinal Themes",
    topicProphecy: "Prophecies & Fulfillments",
    topicChrist: "Christ's Ministry & Visit",
    topicFaith: "Faith & Repentance",
    topicIsaiah: "Isaiah Quotations",
    // View modes
    viewModeLabel: "Diagram Style:",
    viewDual: "Bridge (Bible ↔ BOM)",
    viewRadial: "Sacred Ring",
    viewClassic: "Classic Arcs",
    bibleTopTitle: "The Holy Bible (Old & New Testament)",
    bomBottomTitle: "The Book of Mormon (15 Books)"
  },
  pt: {
    title: "Referências Cruzadas do Livro de Mórmon",
    subtitle: "Explore conexões, cumprimentos, citações e paralelos bíblicos através de 6.604 versículos.",
    searchPlaceholder: "Buscar versículo (ex: Alma 32:21, 1 Néfi 3:7) ou palavra...",
    filterAll: "Todas as Conexões",
    filterInternal: "Arcos Internos (Livro de Mórmon)",
    filterExternal: "Paralelos Bíblicos (LM ↔ AT/NT)",
    selectBook: "Selecionar Livro",
    allBooks: "Todo o Livro de Mórmon",
    legendTitle: "Legenda de Cores & Proporção Canônica",
    statsBooks: "15 Livros",
    statsChapters: "239 Capítulos",
    statsVerses: "6.604 Versículos",
    drawerTitle: "Inspetor de Escrituras",
    drawerEmpty: "Passe o mouse ou clique em qualquer ponto do eixo para inspecionar versículos e arcos conectados.",
    connectionsCount: "{n} Conexões",
    noConnections: "Nenhuma referência cruzada direta registrada para este versículo.",
    readOnOfficial: "Ler capítulo em ChurchofJesusChrist.org ↗",
    typeQuotation: "Citação",
    typeParallel: "Paralelo",
    typeFulfillment: "Cumprimento de Profecia",
    typeTypology: "Tipologia / Símbolo",
    typeCrossref: "Referência Cruzada",
    typeProphecy: "Profecia",
    categoryInternal: "Interno (Livro de Mórmon)",
    categoryExternal: "Conexão com a Bíblia",
    jumpTo: "Ir para",
    doctrineNote: "Nota Doutrinária",
    aboutCredits: "Dados baseados em registros de domínio público (scriptures.nephi.org / LDS Documentation Project, bomdb e pesquisa de escrituras abertas).",
    langToggle: "English",
    featuredTitle: "Conexões em Destaque:",
    prevBtn: "Anterior",
    nextBtn: "Próxima",
    randomBtn: "Aleatória",
    connectionCounter: "Conexão {current} de {total}",
    allTopics: "Todos os Temas",
    topicProphecy: "Profecias & Cumprimentos",
    topicChrist: "Ministério & Visita de Cristo",
    topicFaith: "Fé & Arrependimento",
    topicIsaiah: "Citações de Isaías",
    // View modes
    viewModeLabel: "Estilo do Gráfico:",
    viewDual: "Ponte (Bíblia ↔ LM)",
    viewRadial: "Anel Sagrado",
    viewClassic: "Arcos Clássicos",
    bibleTopTitle: "A Bíblia Sagrada (Antigo & Novo Testamento)",
    bomBottomTitle: "O Livro de Mórmon (15 Livros)"
  }
};

let currentLang = "en";

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (translations[lang]) {
    currentLang = lang;
  }
}

export function t(key, params = {}) {
  let str = translations[currentLang][key] || translations["en"][key] || key;
  for (const [k, v] of Object.entries(params)) {
    str = str.replace(`{${k}}`, v);
  }
  return str;
}
