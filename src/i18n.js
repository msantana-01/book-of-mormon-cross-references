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
    langToggle: "Português"
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
    langToggle: "English"
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
