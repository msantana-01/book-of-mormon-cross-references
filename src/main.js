import { t, getLang, setLang, getBookDisplayName, getBookShortDisplayName, getBibleBookDisplayName, getExternalRefDisplayName, getExternalWorkDisplayName, getConnectionTypeDisplayName } from "./i18n.js";
import { icons } from "./icons.js";
import { generateVerseCard } from "./shareCard.js";

// State
let books = [];
let versesEn = [];
let versesPt = [];
let verses = [];
let internalLinks = [];
let externalLinks = [];
let externalVerses = {};
let currentTourIndex = 0;
let verseConnectionsMap = new Map(); // verseId -> { internal: [], external: [] }
let connectedVerseIdsList = []; // sorted array of IDs that have >= 1 connection
let literaryStructures = [];
let verseStructuresMap = new Map(); // verseId -> array of structure objects

let currentViewMode = "dual"; // "dual" | "radial" | "threads"
let selectedVerseId = 1; // Default to 1 Nephi 1:1 (First verse of the Book of Mormon)
let hoveredVerseId = null;
let hoveredBookId = null;
let currentFilter = "all"; // "all" | "internal" | "external"
let activeBookFilter = "all";
let activeTopicFilter = "all";
let currentColorMode = "book"; // "book" | "theme"

const DOCTRINAL_THEMES = {
  christ: {
    color: "#f59e0b", // Gold / amber
    labelKey: "themeChrist",
    dot: "🟡"
  },
  faith: {
    color: "#38bdf8", // Sky blue
    labelKey: "themeFaith",
    dot: "🔵"
  },
  prophecy: {
    color: "#c084fc", // Purple / violet
    labelKey: "themeProphecy",
    dot: "🟣"
  },
  isaiah: {
    color: "#f43f5e", // Rose / crimson
    labelKey: "themeIsaiah",
    dot: "🌸"
  },
  chiasmus: {
    color: "#2dd4bf", // Teal
    labelKey: "themeChiasmus",
    dot: "🔷"
  },
  formulas: {
    color: "#10b981", // Emerald
    labelKey: "themeFormulas",
    dot: "🟢"
  },
  hebraisms: {
    color: "#fbbf24", // Golden yellow
    labelKey: "themeHebraisms",
    dot: "⭐"
  },
  general: {
    color: "#94a3b8", // Slate
    labelKey: "themeGeneral",
    dot: "⚪"
  }
};

function getLinkThemeKey(link) {
  if (!link._topics || link._topics.size === 0) return "general";
  if (link._topics.has("christ")) return "christ";
  if (link._topics.has("chiasmus")) return "chiasmus";
  if (link._topics.has("formulas")) return "formulas";
  if (link._topics.has("hebraisms")) return "hebraisms";
  if (link._topics.has("prophecy")) return "prophecy";
  if (link._topics.has("faith")) return "faith";
  if (link._topics.has("isaiah")) return "isaiah";
  return "general";
}

function getLinkThemeColor(link) {
  const key = getLinkThemeKey(link);
  return DOCTRINAL_THEMES[key]?.color || "#94a3b8";
}

// Threads View State (Inspired by trekhleb/bible-cross-references)
let threadsCurrentBookId = 1; // 1 Nephi default
let threadsCurrentChapter = 1;
let threadsHoveredSpineBook = null;
let threadsHoveredVerseId = null;
let threadsSpineSegments = [];

// Curated Key Connections for 1-Click Exploration (Dynamic verseId lookup via srcRef)
const FEATURED_CONNECTIONS = [
  {
    id: "samuel-prophecy",
    titleEn: "Samuel's Sign → 3 Nephi Fulfilled",
    titlePt: "Sinal de Samuel → 3 Néfi Cumprido",
    tagEn: "Prophecy",
    tagPt: "Profecia",
    srcRef: "Helaman 14:2",
    tgtRef: "3 Nephi 1:15"
  },
  {
    id: "iron-rod",
    titleEn: "The Iron Rod & Tree of Life",
    titlePt: "A Barra de Ferro & Árvore da Vida",
    tagEn: "Typology",
    tagPt: "Tipologia",
    srcRef: "1 Nephi 8:19",
    tgtRef: "1 Nephi 11:25"
  },
  {
    id: "alma-conversion",
    titleEn: "Alma's Repentance & Grace",
    titlePt: "Conversão & Graça de Alma",
    tagEn: "Parallel",
    tagPt: "Paralelo",
    srcRef: "Mosiah 27:24",
    tgtRef: "Alma 36:18"
  },
  {
    id: "abinadi-noah",
    titleEn: "Abinadi's Prophecy on King Noah",
    titlePt: "Profecia de Abinádi sobre o Rei Noé",
    tagEn: "Fulfillment",
    tagPt: "Cumprimento",
    srcRef: "Mosiah 17:15",
    tgtRef: "Mosiah 19:20"
  },
  {
    id: "christ-appearance",
    titleEn: "Christ Appears in the Americas",
    titlePt: "Aparição de Cristo nas Américas",
    tagEn: "Prophecy",
    tagPt: "Profecia",
    srcRef: "2 Nephi 26:1",
    tgtRef: "3 Nephi 11:8"
  },
  {
    id: "sermon-mount",
    titleEn: "Sermon on the Mount in 3 Nephi",
    titlePt: "Sermão da Montanha em 3 Néfi",
    tagEn: "Bible Quoted",
    tagPt: "Citação Bíblica",
    srcRef: "3 Nephi 12:3",
    tgtRef: null
  },
  {
    id: "abinadi-isaiah",
    titleEn: "Isaiah 53 Expounded by Abinadi",
    titlePt: "Isaías 53 Explicado por Abinádi",
    tagEn: "Isaiah Quote",
    tagPt: "Citação de Isaías",
    srcRef: "Mosiah 14:1",
    tgtRef: null
  },
  {
    id: "alma-faith",
    titleEn: "Alma's Definition of Faith",
    titlePt: "A Definição de Fé de Alma",
    tagEn: "Faith & Bible",
    tagPt: "Fé & Bíblia",
    srcRef: "Alma 32:21",
    tgtRef: null
  },
  {
    id: "moroni-farewell",
    titleEn: "Moroni's Final Exhortation",
    titlePt: "Exortação Final de Morôni",
    tagEn: "Doctrine",
    tagPt: "Doutrina",
    srcRef: "Mormon 9:37",
    tgtRef: "Moroni 10:3"
  }
];

// Bible Books Layout for Dual View (Top Rail)
const BIBLE_BOOKS = [
  { name: "Genesis", short: "Gen", color: "#f59e0b", pos: 0.04 },
  { name: "Exodus", short: "Exo", color: "#f59e0b", pos: 0.10 },
  { name: "Numbers", short: "Num", color: "#f59e0b", pos: 0.15 },
  { name: "Deuteronomy", short: "Deut", color: "#f59e0b", pos: 0.20 },
  { name: "Psalms", short: "Ps", color: "#d97706", pos: 0.26 },
  { name: "Proverbs", short: "Prov", color: "#d97706", pos: 0.31 },
  { name: "Isaiah", short: "Isa", refCount: 525, color: "#fbbf24", pos: 0.40, weight: 2.5 },
  { name: "Jeremiah", short: "Jer", color: "#d97706", pos: 0.48 },
  { name: "Ezekiel", short: "Ezek", color: "#d97706", pos: 0.52 },
  { name: "Micah", short: "Mic", color: "#d97706", pos: 0.56 },
  { name: "Malachi", short: "Mal", color: "#f59e0b", pos: 0.60 },
  // New Testament
  { name: "Matthew", short: "Matt", refCount: 113, color: "#10b981", pos: 0.68, weight: 2.0 },
  { name: "Mark", short: "Mark", color: "#10b981", pos: 0.74 },
  { name: "Luke", short: "Luke", color: "#10b981", pos: 0.78 },
  { name: "John", short: "John", color: "#10b981", pos: 0.82 },
  { name: "Acts", short: "Acts", color: "#059669", pos: 0.86 },
  { name: "Romans", short: "Rom", color: "#059669", pos: 0.89 },
  { name: "1 Corinthians", short: "1 Cor", color: "#059669", pos: 0.92 },
  { name: "Hebrews", short: "Heb", color: "#059669", pos: 0.95 },
  { name: "Revelation", short: "Rev", color: "#047857", pos: 0.98 }
];

function getBibleBookX(refStr, width, paddingX) {
  const usable = width - paddingX * 2;
  for (const b of BIBLE_BOOKS) {
    if (refStr.startsWith(b.name) || refStr.startsWith(b.short)) {
      return paddingX + b.pos * usable;
    }
  }
  return paddingX + 0.5 * usable;
}

// Scripture Spine Bible canon segments for Threads view
const SPINE_BIBLE_BOOKS = [
  // Old Testament
  { name: "Genesis", short: "Gen", color: "#f59e0b", weight: 1.0 },
  { name: "Exodus", short: "Exo", color: "#f59e0b", weight: 1.1 },
  { name: "Numbers", short: "Num", color: "#f59e0b", weight: 0.9 },
  { name: "Psalms", short: "Ps", color: "#d97706", weight: 1.1 },
  { name: "Proverbs", short: "Prov", color: "#d97706", weight: 0.9 },
  { name: "Isaiah", short: "Isa", color: "#fbbf24", weight: 2.2 },
  { name: "Jeremiah", short: "Jer", color: "#d97706", weight: 1.0 },
  { name: "Ezekiel", short: "Ezek", color: "#d97706", weight: 0.9 },
  { name: "Micah", short: "Mic", color: "#d97706", weight: 0.9 },
  { name: "Malachi", short: "Mal", color: "#f59e0b", weight: 1.1 },
  // New Testament
  { name: "Matthew", short: "Matt", color: "#10b981", weight: 1.8 },
  { name: "Mark", short: "Mark", color: "#10b981", weight: 0.9 },
  { name: "Luke", short: "Luke", color: "#10b981", weight: 1.2 },
  { name: "John", short: "John", color: "#10b981", weight: 1.3 },
  { name: "Acts", short: "Acts", color: "#059669", weight: 1.1 },
  { name: "Romans", short: "Rom", color: "#059669", weight: 0.9 },
  { name: "1 Corinthians", short: "1 Cor", color: "#059669", weight: 0.9 },
  { name: "Hebrews", short: "Heb", color: "#059669", weight: 1.0 },
  { name: "Revelation", short: "Rev", color: "#047857", weight: 0.9 }
];

function parseBibleBookName(refStr) {
  if (!refStr) return null;
  const trimmed = refStr.trim();
  for (const b of SPINE_BIBLE_BOOKS) {
    if (trimmed.startsWith(b.name) || trimmed.startsWith(b.short)) {
      return b.name;
    }
  }
  return null;
}

// Canonical Church URL slugs
const CHURCH_BOOK_SLUGS_BY_ID = {
  1: "1-ne",
  2: "2-ne",
  3: "jacob",
  4: "enos",
  5: "jarom",
  6: "omni",
  7: "w-of-m",
  8: "mosiah",
  9: "alma",
  10: "hel",
  11: "3-ne",
  12: "4-ne",
  13: "morm",
  14: "ether",
  15: "moro"
};

const CHURCH_BOOK_SLUGS = {
  "1 Nephi": "1-ne",
  "1 Néfi": "1-ne",
  "2 Nephi": "2-ne",
  "2 Néfi": "2-ne",
  "Jacob": "jacob",
  "Jacó": "jacob",
  "Enos": "enos",
  "Jarom": "jarom",
  "Omni": "omni",
  "Ômni": "omni",
  "Words of Mormon": "w-of-m",
  "Palavras de Mórmon": "w-of-m",
  "Mosiah": "mosiah",
  "Mosias": "mosiah",
  "Alma": "alma",
  "Helaman": "hel",
  "Helamã": "hel",
  "3 Nephi": "3-ne",
  "3 Néfi": "3-ne",
  "4 Nephi": "4-ne",
  "4 Néfi": "4-ne",
  "Mormon": "morm",
  "Mórmon": "morm",
  "Ether": "ether",
  "Éter": "ether",
  "Moroni": "moro",
  "Morôni": "moro"
};

function getChurchStudyUrl(verseObj) {
  if (!verseObj) return null;
  const slug = (verseObj.bookId && CHURCH_BOOK_SLUGS_BY_ID[verseObj.bookId]) || CHURCH_BOOK_SLUGS[verseObj.book];
  if (!slug) return null;
  const langParam = getLang() === "pt" ? "por" : "eng";
  return `https://www.churchofjesuschrist.org/study/scriptures/bofm/${slug}/${verseObj.ch}?lang=${langParam}#${verseObj.v}`;
}

// Canonical Church Bible & other scripture slugs
const BIBLE_CHURCH_SLUGS = {
  // Old Testament
  "Genesis": { testament: "ot", slug: "gen" },
  "Exodus": { testament: "ot", slug: "ex" },
  "Numbers": { testament: "ot", slug: "num" },
  "Deuteronomy": { testament: "ot", slug: "deut" },
  "Joshua": { testament: "ot", slug: "josh" },
  "1 Samuel": { testament: "ot", slug: "1-sam" },
  "2 Samuel": { testament: "ot", slug: "2-sam" },
  "1 Chronicles": { testament: "ot", slug: "1-chron" },
  "2 Chronicles": { testament: "ot", slug: "2-chron" },
  "Esther": { testament: "ot", slug: "esth" },
  "Job": { testament: "ot", slug: "job" },
  "Psalm": { testament: "ot", slug: "ps" },
  "Psalms": { testament: "ot", slug: "ps" },
  "Proverbs": { testament: "ot", slug: "prov" },
  "Ecclesiastes": { testament: "ot", slug: "eccl" },
  "Isaiah": { testament: "ot", slug: "isa" },
  "Jeremiah": { testament: "ot", slug: "jer" },
  "Lamentations": { testament: "ot", slug: "lam" },
  "Ezekiel": { testament: "ot", slug: "ezek" },
  "Daniel": { testament: "ot", slug: "dan" },
  "Amos": { testament: "ot", slug: "amos" },
  "Micah": { testament: "ot", slug: "micah" },
  "Nahum": { testament: "ot", slug: "nahum" },
  "Zechariah": { testament: "ot", slug: "zech" },
  "Malachi": { testament: "ot", slug: "mal" },

  // New Testament
  "Matthew": { testament: "nt", slug: "matt" },
  "Mark": { testament: "nt", slug: "mark" },
  "Luke": { testament: "nt", slug: "luke" },
  "John": { testament: "nt", slug: "john" },
  "Acts": { testament: "nt", slug: "acts" },
  "Romans": { testament: "nt", slug: "rom" },
  "1 Corinthians": { testament: "nt", slug: "1-cor" },
  "2 Corinthians": { testament: "nt", slug: "2-cor" },
  "Galatians": { testament: "nt", slug: "gal" },
  "Ephesians": { testament: "nt", slug: "eph" },
  "Philippians": { testament: "nt", slug: "phil" },
  "Colossians": { testament: "nt", slug: "col" },
  "1 Timothy": { testament: "nt", slug: "1-tim" },
  "2 Timothy": { testament: "nt", slug: "2-tim" },
  "Titus": { testament: "nt", slug: "titus" },
  "Hebrews": { testament: "nt", slug: "heb" },
  "James": { testament: "nt", slug: "james" },
  "1 John": { testament: "nt", slug: "1-jn" },
  "Jude": { testament: "nt", slug: "jude" },
  "Revelation": { testament: "nt", slug: "rev" },

  // Pearl of Great Price & D&C
  "Moses": { testament: "pgp", slug: "moses" },
  "Abraham": { testament: "pgp", slug: "abr" },
  "Joseph Smith--History": { testament: "pgp", slug: "js-h" },
  "Doctrine and Covenants": { testament: "dc-testament", slug: "dc" }
};

function getBibleStudyUrl(externalRefStr) {
  if (!externalRefStr) return null;
  const m = externalRefStr.trim().match(/^([1-3]?\s?[A-Za-z\s\-]+?)\s+(\d+)(?::(\d+)(?:-\d+)?)?$/);
  if (!m) return null;
  const bookName = m[1].trim();
  const ch = m[2];
  const v = m[3];
  const info = BIBLE_CHURCH_SLUGS[bookName];
  if (!info) return null;
  const langParam = getLang() === "pt" ? "por" : "eng";
  let url = `https://www.churchofjesuschrist.org/study/scriptures/${info.testament}/${info.slug}/${ch}?lang=${langParam}`;
  if (v) {
    url += `#${v}`;
  }
  return url;
}

// DOM Elements
const canvasWrapper = document.querySelector(".canvas-wrapper");
const canvas = document.getElementById("arcCanvas");
const ctx = canvas.getContext("2d");
const tooltip = document.getElementById("tooltip");
const axisContainer = document.getElementById("axisContainer");
const axisBar = document.getElementById("axisBar");
const bookLabelsRow = document.getElementById("bookLabelsRow");
const bookSelect = document.getElementById("bookSelect");
const topicSelect = document.getElementById("topicSelect");
const searchInput = document.getElementById("searchInput");
const filterBtns = document.querySelectorAll(".filter-btn");
const viewBtns = document.querySelectorAll(".view-btn");
const langToggleBtn = document.getElementById("langToggleBtn");
const langText = document.getElementById("langText");

// Threads View DOM Elements
const threadsContainer = document.getElementById("threadsContainer");
const threadsPrevChBtn = document.getElementById("threadsPrevChBtn");
const threadsNextChBtn = document.getElementById("threadsNextChBtn");
const threadsBookSelect = document.getElementById("threadsBookSelect");
const threadsChapterSelect = document.getElementById("threadsChapterSelect");
const threadsStatsBadge = document.getElementById("threadsStatsBadge");
const threadsReadingPane = document.getElementById("threadsReadingPane");
const threadsChapterHeaderTitle = document.getElementById("threadsChapterHeaderTitle");
const threadsChapterHeaderSub = document.getElementById("threadsChapterHeaderSub");
const threadsVersesList = document.getElementById("threadsVersesList");
const threadsCanvasBox = document.getElementById("threadsCanvasBox");
const threadsCanvas = document.getElementById("threadsCanvas");
const threadsCtx = threadsCanvas ? threadsCanvas.getContext("2d") : null;
const threadsSpineTooltip = document.getElementById("threadsSpineTooltip");
const threadsSpineHeaderTitle = document.getElementById("threadsSpineHeaderTitle");
const threadsHoverHintText = document.getElementById("threadsHoverHintText");
const labelViewThreads = document.getElementById("labelViewThreads");
const threadsPrevText = document.getElementById("threadsPrevText");
const threadsNextText = document.getElementById("threadsNextText");

const dualTopLabelRow = document.getElementById("dualTopLabelRow");
const dualBottomLabelRow = document.getElementById("dualBottomLabelRow");
const bomBottomTitle = document.getElementById("bomBottomTitle");
const zoomResetBtn = document.getElementById("zoomResetBtn");
const zoomResetText = document.getElementById("zoomResetText");
const featuredPillsRow = document.getElementById("featuredPillsRow");
const prevConnBtn = document.getElementById("prevConnBtn");
const nextConnBtn = document.getElementById("nextConnBtn");
const randomConnBtn = document.getElementById("randomConnBtn");
const connCounterBadge = document.getElementById("connCounterBadge");

const selectedVerseRef = document.getElementById("selectedVerseRef");
const selectedVerseBadge = document.getElementById("selectedVerseBadge");
const connectionsCountBadge = document.getElementById("connectionsCountBadge");
const verseTextBox = document.getElementById("verseTextBox");
const connectionsList = document.getElementById("connectionsList");
const officialLinkContainer = document.getElementById("officialLinkContainer");
const officialLink = document.getElementById("officialLink");
const studyPanel = document.getElementById("studyPanel");
const shareCardBtn = document.getElementById("shareCardBtn");
const shareCardText = document.getElementById("shareCardText");
const copyLinkBtn = document.getElementById("copyLinkBtn");
const copyLinkText = document.getElementById("copyLinkText");
const searchClearBtn = document.getElementById("searchClearBtn");
const searchResultsDropdown = document.getElementById("searchResultsDropdown");
const backToDiagramBtn = document.getElementById("backToDiagramBtn");
const backToDiagramText = document.getElementById("backToDiagramText");

// Side-by-Side Scripture Comparison Modal Elements
const comparisonModal = document.getElementById("comparisonModal");
const comparisonCloseBtn = document.getElementById("comparisonCloseBtn");
const comparisonModalTitle = document.getElementById("comparisonModalTitle");
const comparisonModalSubtitle = document.getElementById("comparisonModalSubtitle");
const comparisonBomTag = document.getElementById("comparisonBomTag");
const comparisonBomRef = document.getElementById("comparisonBomRef");
const comparisonBomText = document.getElementById("comparisonBomText");
const comparisonBomChurchLink = document.getElementById("comparisonBomChurchLink");
const comparisonBomChurchText = document.getElementById("comparisonBomChurchText");
const comparisonTypeBadge = document.getElementById("comparisonTypeBadge");
const comparisonNoteTitle = document.getElementById("comparisonNoteTitle");
const comparisonNoteText = document.getElementById("comparisonNoteText");
const comparisonBibleTag = document.getElementById("comparisonBibleTag");
const comparisonBibleRef = document.getElementById("comparisonBibleRef");
const comparisonBibleText = document.getElementById("comparisonBibleText");
const comparisonBibleChurchLink = document.getElementById("comparisonBibleChurchLink");
const comparisonBibleChurchText = document.getElementById("comparisonBibleChurchText");

// Bookmarks DOM Elements
const bookmarksBtn = document.getElementById("bookmarksBtn");
const bookmarksBtnText = document.getElementById("bookmarksBtnText");
const bookmarksCountBadge = document.getElementById("bookmarksCountBadge");
const bookmarkVerseBtn = document.getElementById("bookmarkVerseBtn");
const bookmarksModal = document.getElementById("bookmarksModal");
const bookmarksCloseBtn = document.getElementById("bookmarksCloseBtn");
const bookmarksModalTitle = document.getElementById("bookmarksModalTitle");
const bookmarksModalSubtitle = document.getElementById("bookmarksModalSubtitle");
const bookmarksBody = document.getElementById("bookmarksBody");
const bookmarksTotalCount = document.getElementById("bookmarksTotalCount");
const clearBookmarksBtn = document.getElementById("clearBookmarksBtn");
const clearBookmarksText = document.getElementById("clearBookmarksText");

// Ancient Semitic Literary Structures DOM Elements
const literaryStructureBox = document.getElementById("literaryStructureBox");
const structureTypeBadge = document.getElementById("structureTypeBadge");
const structureScopeBadge = document.getElementById("structureScopeBadge");
const structureTitle = document.getElementById("structureTitle");
const structureDesc = document.getElementById("structureDesc");
const chiasticTreeContainer = document.getElementById("chiasticTreeContainer");
const chiasticTreeHeaderTitle = document.getElementById("chiasticTreeHeaderTitle");
const chiasticTreeHint = document.getElementById("chiasticTreeHint");
const chiasticTreeList = document.getElementById("chiasticTreeList");
const structureOccurrencesContainer = document.getElementById("structureOccurrencesContainer");
const structureOccurrencesHeaderTitle = document.getElementById("structureOccurrencesHeaderTitle");
const structureOccurrencesHint = document.getElementById("structureOccurrencesHint");
const structurePillsList = document.getElementById("structurePillsList");

// Arc Color Mode DOM Elements & Handlers
const btnColorBooks = document.getElementById("btnColorBooks");
const btnColorThemes = document.getElementById("btnColorThemes");
const labelColorBooks = document.getElementById("labelColorBooks");
const labelColorThemes = document.getElementById("labelColorThemes");
const themeLegendBar = document.getElementById("themeLegendBar");
const themeLegendTitle = document.getElementById("themeLegendTitle");
const themeLegendChips = document.getElementById("themeLegendChips");

function setColorMode(mode) {
  if (mode !== "book" && mode !== "theme") mode = "book";
  currentColorMode = mode;

  if (btnColorBooks && btnColorThemes) {
    btnColorBooks.classList.toggle("active", mode === "book");
    btnColorThemes.classList.toggle("active", mode === "theme");
  }

  if (themeLegendBar) {
    themeLegendBar.style.display = (mode === "theme") ? "flex" : "none";
    if (mode === "theme") {
      renderThemeLegendChips();
    }
  }

  syncURLParams();
  if (currentViewMode === "threads") {
    drawThreadsCanvas();
  } else {
    draw();
  }
}

function renderThemeLegendChips() {
  if (!themeLegendChips) return;
  themeLegendChips.innerHTML = "";

  const themeCounts = {
    christ: 0,
    faith: 0,
    prophecy: 0,
    isaiah: 0,
    chiasmus: 0,
    formulas: 0,
    hebraisms: 0,
    general: 0
  };

  const allVisibleLinks = [...(internalLinks || []), ...(externalLinks || [])];
  allVisibleLinks.forEach(l => {
    const key = getLinkThemeKey(l);
    if (themeCounts[key] !== undefined) {
      themeCounts[key]++;
    } else {
      themeCounts.general++;
    }
  });

  const themeOrder = ["christ", "faith", "prophecy", "isaiah", "chiasmus", "formulas", "hebraisms", "general"];

  themeOrder.forEach(key => {
    const th = DOCTRINAL_THEMES[key];
    if (!th || themeCounts[key] === 0) return;

    const chip = document.createElement("button");
    const isActive = (activeTopicFilter === key);
    chip.className = `theme-chip ${isActive ? "active" : ""}`;
    chip.style.borderColor = isActive ? th.color : "rgba(255, 255, 255, 0.15)";
    chip.setAttribute("data-theme-key", key);

    const label = t(th.labelKey);
    chip.innerHTML = `
      <span class="theme-chip-dot" style="background-color: ${th.color}; box-shadow: 0 0 6px ${th.color};"></span>
      <span>${label}</span>
      <span class="theme-chip-count">(${themeCounts[key]})</span>
    `;

    chip.addEventListener("click", () => {
      if (activeTopicFilter === key) {
        activeTopicFilter = "all";
        if (topicSelect) topicSelect.value = "all";
      } else {
        activeTopicFilter = key;
        if (topicSelect) {
          if (topicSelect.querySelector(`option[value="${key}"]`)) {
            topicSelect.value = key;
          }
        }
      }
      renderThemeLegendChips();
      if (currentViewMode === "threads") {
        drawThreadsCanvas();
      } else {
        draw();
      }
    });

    themeLegendChips.appendChild(chip);
  });
}

// How to Use Tutorial Modal Elements
const howToUseBtn = document.getElementById("howToUseBtn");
const howToUseText = document.getElementById("howToUseText");
const tutorialModal = document.getElementById("tutorialModal");
const tutorialCloseBtn = document.getElementById("tutorialCloseBtn");
const tutorialDoneBtn = document.getElementById("tutorialDoneBtn");
const tutorialTabs = document.querySelectorAll(".tutorial-tab");
const tutorialPanes = document.querySelectorAll(".tutorial-pane");
const tutorialPrevBtn = document.getElementById("tutorialPrevBtn");
const tutorialNextBtn = document.getElementById("tutorialNextBtn");
const tutorialStepIndicator = document.getElementById("tutorialStepIndicator");

const TUTORIAL_TAB_IDS = ["diagrams", "navigation", "chiasmus", "cards"];
let currentTutorialTabIndex = 0;

function setTutorialTab(index) {
  if (index < 0 || index >= TUTORIAL_TAB_IDS.length) return;
  currentTutorialTabIndex = index;
  const tabId = TUTORIAL_TAB_IDS[index];

  tutorialTabs.forEach((tab, i) => {
    tab.classList.toggle("active", i === index);
  });

  tutorialPanes.forEach(pane => {
    pane.style.display = pane.id === `pane${tabId.charAt(0).toUpperCase() + tabId.slice(1)}` ? "block" : "none";
  });

  if (tutorialPrevBtn) tutorialPrevBtn.disabled = (index === 0);
  if (tutorialNextBtn) {
    if (index === TUTORIAL_TAB_IDS.length - 1) {
      tutorialNextBtn.style.display = "none";
    } else {
      tutorialNextBtn.style.display = "inline-flex";
    }
  }
  if (tutorialStepIndicator) {
    tutorialStepIndicator.textContent = `${index + 1} / ${TUTORIAL_TAB_IDS.length}`;
  }
}

function openTutorialModal() {
  if (tutorialModal) {
    tutorialModal.style.display = "flex";
    setTutorialTab(0);
    document.body.style.overflow = "hidden";
  }
}

function closeTutorialModal() {
  if (tutorialModal) {
    tutorialModal.style.display = "none";
    document.body.style.overflow = "";
  }
}

function openComparisonModal(bomVerse, link) {
  if (!comparisonModal || !bomVerse || !link) return;
  const isPt = getLang() === "pt";
  const displayExtRef = getExternalRefDisplayName(link.externalRef);
  const displayExtWork = getExternalWorkDisplayName(link.externalWork);

  const extVerseObj = externalVerses[link.externalRef];
  const bibleVerseText = extVerseObj
    ? (isPt ? (extVerseObj.textPt || extVerseObj.textEn) : (extVerseObj.textEn || extVerseObj.textPt))
    : "";

  if (comparisonBomRef) comparisonBomRef.textContent = bomVerse.ref;
  if (comparisonBomText) comparisonBomText.textContent = `"${bomVerse.text}"`;
  const bomChurchUrl = getChurchStudyUrl(bomVerse);
  if (comparisonBomChurchLink) {
    if (bomChurchUrl) {
      comparisonBomChurchLink.href = bomChurchUrl;
      comparisonBomChurchLink.style.display = "inline-flex";
    } else {
      comparisonBomChurchLink.style.display = "none";
    }
  }

  const extNoteText = isPt ? (link.notePt || link.note) : (link.noteEn || link.note);
  if (comparisonNoteText) comparisonNoteText.textContent = extNoteText || "";
  if (comparisonNoteTitle) comparisonNoteTitle.style.marginBottom = extNoteText ? "" : "0";
  if (comparisonTypeBadge) comparisonTypeBadge.textContent = getConnectionTypeDisplayName(link.type);

  if (comparisonBibleTag) comparisonBibleTag.textContent = displayExtWork;
  if (comparisonBibleRef) comparisonBibleRef.textContent = displayExtRef;
  if (comparisonBibleText) {
    comparisonBibleText.textContent = bibleVerseText
      ? `"${bibleVerseText}"`
      : (isPt ? "(Texto bíblico disponível no link da Igreja)" : "(Biblical text available on Church link)");
  }

  const bibleChurchUrl = getBibleStudyUrl(link.externalRef);
  if (comparisonBibleChurchLink) {
    if (bibleChurchUrl) {
      comparisonBibleChurchLink.href = bibleChurchUrl;
      comparisonBibleChurchLink.style.display = "inline-flex";
    } else {
      comparisonBibleChurchLink.style.display = "none";
    }
  }

  comparisonModal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeComparisonModal() {
  if (!comparisonModal) return;
  comparisonModal.style.display = "none";
  document.body.style.overflow = "";
}

// --- Scripture Bookmarks (localStorage) ---
const BOOKMARKS_STORAGE_KEY = "app_bookmarks";

function getSavedBookmarks() {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(id => typeof id === "number" && id >= 1 && id <= 6604) : [];
  } catch (e) {
    return [];
  }
}

function saveBookmarks(ids) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(ids));
  } catch (e) {}
}

function toggleBookmarkVerse(verseId) {
  if (!verseId) return;
  let bookmarks = getSavedBookmarks();
  if (bookmarks.includes(verseId)) {
    bookmarks = bookmarks.filter(id => id !== verseId);
  } else {
    bookmarks.push(verseId);
  }
  saveBookmarks(bookmarks);
  updateBookmarksUI();
  if (bookmarksModal && bookmarksModal.style.display !== "none") {
    renderBookmarksList();
  }
}

function removeBookmark(verseId) {
  let bookmarks = getSavedBookmarks().filter(id => id !== verseId);
  saveBookmarks(bookmarks);
  updateBookmarksUI();
  if (bookmarksModal && bookmarksModal.style.display !== "none") {
    renderBookmarksList();
  }
}

function clearAllBookmarks() {
  if (confirm(t("bookmarksConfirmClear"))) {
    saveBookmarks([]);
    updateBookmarksUI();
    if (bookmarksModal && bookmarksModal.style.display !== "none") {
      renderBookmarksList();
    }
  }
}

function updateBookmarksUI() {
  const bookmarks = getSavedBookmarks();
  const count = bookmarks.length;

  if (bookmarksCountBadge) {
    bookmarksCountBadge.textContent = String(count);
    bookmarksCountBadge.style.display = count > 0 ? "inline-flex" : "none";
  }

  if (bookmarkVerseBtn && selectedVerseId) {
    const isBookmarked = bookmarks.includes(selectedVerseId);
    bookmarkVerseBtn.classList.toggle("bookmarked", isBookmarked);
    const titleText = isBookmarked ? t("bookmarkRemove") : t("bookmarkAdd");
    bookmarkVerseBtn.title = titleText;
    bookmarkVerseBtn.setAttribute("aria-label", titleText);
  }
}

function renderBookmarksList() {
  if (!bookmarksBody) return;
  const bookmarks = getSavedBookmarks();

  if (bookmarks.length === 0) {
    bookmarksBody.innerHTML = `
      <div class="bookmarks-empty-state">
        <p>${t("bookmarksEmpty")}</p>
      </div>
    `;
    if (clearBookmarksBtn) clearBookmarksBtn.style.display = "none";
    if (bookmarksTotalCount) bookmarksTotalCount.textContent = t("bookmarksCount", { n: 0 });
    return;
  }

  if (clearBookmarksBtn) clearBookmarksBtn.style.display = "inline-flex";
  if (bookmarksTotalCount) bookmarksTotalCount.textContent = t("bookmarksCount", { n: bookmarks.length });

  bookmarksBody.innerHTML = bookmarks.map(id => {
    const v = verses[id - 1];
    if (!v) return "";
    const book = getBookForVerse(id);
    const bookColor = book ? book.color : "#d4af37";
    const conns = verseConnectionsMap.get(id) || { internal: [], external: [] };
    const totalConns = conns.internal.length + conns.external.length;

    let snippet = v.text || "";
    if (snippet.length > 140) snippet = snippet.substring(0, 140) + "...";

    return `
      <div class="bookmark-card" data-verse-id="${id}">
        <div class="bookmark-card-top">
          <div class="bookmark-ref-group">
            <span class="search-result-ref-dot" style="background-color: ${bookColor}"></span>
            <span class="bookmark-ref-title">${escapeHtml(v.ref)}</span>
            ${totalConns > 0 ? `<span class="badge badge-gold" style="font-size:0.68rem; padding: 0.1rem 0.4rem;">🔗 ${totalConns}</span>` : ""}
          </div>
          <div class="bookmark-actions">
            <button type="button" class="bookmark-delete-btn" data-delete-id="${id}" title="${t('bookmarkRemove')}" aria-label="${t('bookmarkRemove')}">
              <svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
        <div class="bookmark-snippet">"${escapeHtml(snippet)}"</div>
      </div>
    `;
  }).join("");

  bookmarksBody.querySelectorAll(".bookmark-card").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".bookmark-delete-btn")) return;
      const vId = parseInt(card.dataset.verseId, 10);
      if (vId) {
        selectVerse(vId, true);
        closeBookmarksModal();
      }
    });
  });

  bookmarksBody.querySelectorAll(".bookmark-delete-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const delId = parseInt(btn.dataset.deleteId, 10);
      if (delId) {
        removeBookmark(delId);
      }
    });
  });
}

function openBookmarksModal() {
  if (!bookmarksModal) return;
  renderBookmarksList();
  bookmarksModal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeBookmarksModal() {
  if (!bookmarksModal) return;
  bookmarksModal.style.display = "none";
  document.body.style.overflow = "";
}

function scrollToStudyPanel() {
  if (studyPanel) {
    studyPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// Layout constants
const PADDING_X = 26;
let usableWidth = 0;
let canvasHeight = 0;

function getActiveBook() {
  if (activeBookFilter === "all") return null;
  const bId = parseInt(activeBookFilter, 10);
  return books.find(b => b.id === bId) || null;
}

function adjustColorBrightness(hex, percent) {
  let num = parseInt(hex.replace("#", ""), 16);
  let amt = Math.round(2.55 * percent);
  let R = (num >> 16) + amt;
  let G = (num >> 8 & 0x00FF) + amt;
  let B = (num & 0x0000FF) + amt;
  return "#" + (
    0x1000000 +
    (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 0 ? 0 : B) : 255)
  ).toString(16).slice(1);
}

function setupCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  usableWidth = rect.width - PADDING_X * 2;
  canvasHeight = rect.height;
  draw();
}

function verseToX(verseId) {
  const activeBook = getActiveBook();
  if (activeBook) {
    if (verseId >= activeBook.startVerseId && verseId <= activeBook.endVerseId) {
      const span = Math.max(1, activeBook.endVerseId - activeBook.startVerseId);
      const ratio = (verseId - activeBook.startVerseId) / span;
      return PADDING_X + ratio * usableWidth;
    }
    if (verseId < activeBook.startVerseId) {
      return PADDING_X - 16;
    }
    return PADDING_X + usableWidth + 16;
  }
  return PADDING_X + ((verseId - 1) / 6603) * usableWidth;
}

function xToVerse(x) {
  const activeBook = getActiveBook();
  const clampedX = Math.max(PADDING_X, Math.min(PADDING_X + usableWidth, x));
  const ratio = (clampedX - PADDING_X) / usableWidth;

  if (activeBook) {
    const span = activeBook.endVerseId - activeBook.startVerseId;
    return Math.max(activeBook.startVerseId, Math.min(activeBook.endVerseId, Math.round(activeBook.startVerseId + ratio * span)));
  }
  return Math.max(1, Math.min(6604, Math.round(ratio * 6603) + 1));
}

// Snapping for horizontal axes (zoomed book aware, with binary search and caching)
function findNearestConnectedVerse(mouseX, pixelTolerance = 25) {
  const activeBook = getActiveBook();
  const relevantVerseIds = activeBook
    ? (activeBook._connectedIds || (activeBook._connectedIds = connectedVerseIdsList.filter(vid => vid >= activeBook.startVerseId && vid <= activeBook.endVerseId)))
    : connectedVerseIdsList;

  if (relevantVerseIds.length === 0) return xToVerse(mouseX);

  // Binary search for closest element
  let low = 0;
  let high = relevantVerseIds.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const vx = verseToX(relevantVerseIds[mid]);
    if (vx < mouseX) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  // Check neighborhood around insertion point
  let bestId = null;
  let minDiff = Infinity;
  const startIdx = Math.max(0, low - 2);
  const endIdx = Math.min(relevantVerseIds.length - 1, low + 2);

  for (let i = startIdx; i <= endIdx; i++) {
    const vid = relevantVerseIds[i];
    const vx = verseToX(vid);
    const diff = Math.abs(vx - mouseX);
    if (diff < minDiff && diff <= pixelTolerance) {
      minDiff = diff;
      bestId = vid;
    }
  }

  return bestId !== null ? bestId : xToVerse(mouseX);
}

// Snapping for radial circular mode (zoomed book aware)
function radialToVerse(angleRad) {
  let norm = angleRad + Math.PI / 2;
  while (norm < 0) norm += Math.PI * 2;
  while (norm >= Math.PI * 2) norm -= Math.PI * 2;

  const ratio = norm / (Math.PI * 2);
  const activeBook = getActiveBook();

  if (activeBook) {
    const span = activeBook.endVerseId - activeBook.startVerseId;
    const vId = Math.max(activeBook.startVerseId, Math.min(activeBook.endVerseId, Math.round(activeBook.startVerseId + ratio * span)));

    const bookConnected = connectedVerseIdsList.filter(v => v >= activeBook.startVerseId && v <= activeBook.endVerseId);
    let best = vId;
    let minDiff = 30;
    for (const cv of bookConnected) {
      const d = Math.abs(cv - vId);
      if (d < minDiff) {
        minDiff = d;
        best = cv;
      }
    }
    return best;
  }

  const vId = Math.max(1, Math.min(6604, Math.round(ratio * 6603) + 1));
  let best = vId;
  let minDiff = 60;
  for (const cv of connectedVerseIdsList) {
    const d = Math.abs(cv - vId);
    if (d < minDiff) {
      minDiff = d;
      best = cv;
    }
  }
  return best;
}

// Main Draw Dispatcher
function draw() {
  if (currentViewMode === "threads") {
    drawThreadsCanvas();
    return;
  }
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  if (books.length === 0) return;

  if (currentViewMode === "dual") {
    drawDualView();
  } else {
    drawRadialView();
  }
}

// -------------------------------------------------------------
// VIEW 1: DUAL VIEW (Bridge of Testaments: Bible Top, BOM Bottom)
// -------------------------------------------------------------
function drawDualView() {
  const rect = canvas.getBoundingClientRect();
  const topY = 48;
  const bottomY = canvasHeight - 28;

  const activeVerse = hoveredVerseId || selectedVerseId;
  const activeVerseConnections = verseConnectionsMap.get(activeVerse) || { internal: [], external: [] };
  const connectedVerseIds = new Set();
  activeVerseConnections.internal.forEach(l => {
    connectedVerseIds.add(l.source);
    connectedVerseIds.add(l.target);
  });

  // A. Top Rail (Holy Bible)
  ctx.strokeStyle = "rgba(245, 158, 11, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING_X, topY);
  ctx.lineTo(PADDING_X + usableWidth, topY);
  ctx.stroke();

  // Draw Bible book nodes on top rail
  const isMobileCanvas = usableWidth < 550;
  BIBLE_BOOKS.forEach(b => {
    const bx = PADDING_X + b.pos * usableWidth;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(bx, topY, b.weight ? 3.5 : 2.5, 0, Math.PI * 2);
    ctx.fill();

    const isMilestone = b.weight || ["Gen", "Ps", "John", "Rev"].includes(b.short);
    if (!isMobileCanvas || isMilestone) {
      let label = getBookShortDisplayName(b.name, b.short);
      if (!isMobileCanvas && b.refCount) {
        label = `${label} (${b.refCount} refs)`;
      }
      ctx.fillStyle = b.color;
      ctx.font = b.weight ? "bold 10px Inter, sans-serif" : "9px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, bx, topY - 12);
    }
  });

  // B. Bottom Rail (Book of Mormon)
  const activeBook = getActiveBook();
  ctx.strokeStyle = activeBook ? activeBook.color : "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = activeBook ? 2 : 1;
  ctx.beginPath();
  ctx.moveTo(PADDING_X, bottomY);
  ctx.lineTo(PADDING_X + usableWidth, bottomY);
  ctx.stroke();

  if (activeBook) {
    // Zoomed Book: Draw Chapter boundaries and Chapter labels
    activeBook.chaptersList.forEach(ch => {
      const x = verseToX(ch.startVerseId);
      ctx.strokeStyle = activeBook.color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, bottomY - 5);
      ctx.lineTo(x, bottomY + 5);
      ctx.stroke();

      const shouldShowLabel = activeBook.chaptersCount <= 16
        ? true
        : (ch.chapter === 1 || ch.chapter === activeBook.chaptersCount || ch.chapter % 5 === 0);

      if (shouldShowLabel) {
        ctx.fillStyle = "#94a3b8";
        ctx.font = "9px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Ch ${ch.chapter}`, x, bottomY + 16);
      }
    });

    // Draw Hotspots only in active book
    connectedVerseIdsList.forEach(vid => {
      if (vid >= activeBook.startVerseId && vid <= activeBook.endVerseId) {
        const hx = verseToX(vid);
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(hx, bottomY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  } else {
    // Whole Book of Mormon: Book boundary tick marks
    books.forEach(b => {
      const x = verseToX(b.startVerseId);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, bottomY - 4);
      ctx.lineTo(x, bottomY + 6);
      ctx.stroke();
    });

    // Draw Hotspot Glow Dots
    connectedVerseIdsList.forEach(vid => {
      const hx = verseToX(vid);
      ctx.fillStyle = "rgba(99, 102, 241, 0.75)";
      ctx.beginPath();
      ctx.arc(hx, bottomY, 1.8, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // C. Cross-Testament Bridging Beams (BOM <-> Bible)
  if (currentFilter !== "internal") {
    externalLinks.forEach(link => {
      // In zoomed mode, only show links from active book
      if (activeBook && (link.source < activeBook.startVerseId || link.source > activeBook.endVerseId)) {
        return;
      }
      if (activeTopicFilter !== "all" && !isLinkMatchingTopic(link, activeTopicFilter)) {
        return;
      }

      const isConnectedToActive = (link.source === activeVerse);
      const xBom = verseToX(link.source);
      const xBible = getBibleBookX(link.externalRef, rect.width, PADDING_X);

      ctx.beginPath();
      ctx.moveTo(xBom, bottomY);
      const midY = (topY + bottomY) / 2;
      ctx.bezierCurveTo(xBom, midY + 40, xBible, midY - 40, xBible, topY);

      if (isConnectedToActive) {
        const strokeCol = (currentColorMode === "theme") ? getLinkThemeColor(link) : "#fbbf24";
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 3.2;
        ctx.shadowColor = (currentColorMode === "theme") ? strokeCol : "rgba(245, 158, 11, 0.9)";
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = strokeCol;
        ctx.beginPath();
        ctx.arc(xBible, topY, 5.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (activeVerse) {
        const strokeCol = (currentColorMode === "theme") ? getLinkThemeColor(link) : "#10b981";
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = activeBook ? 1.0 : 0.6;
        ctx.globalAlpha = activeBook ? 0.20 : 0.05;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      } else {
        const strokeCol = (currentColorMode === "theme") ? getLinkThemeColor(link) : "rgba(16, 185, 129, 0.35)";
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = activeBook ? 1.2 : 0.9;
        ctx.globalAlpha = (currentColorMode === "theme") ? 0.55 : 1.0;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    });
  }

  // D. Internal BOM Arcs
  if (currentFilter !== "external") {
    internalLinks.forEach(link => {
      const sourceInBook = activeBook ? (link.source >= activeBook.startVerseId && link.source <= activeBook.endVerseId) : true;
      const targetInBook = activeBook ? (link.target >= activeBook.startVerseId && link.target <= activeBook.endVerseId) : true;

      // In zoomed mode, link must involve the activeBook
      if (activeBook && !sourceInBook && !targetInBook) {
        return;
      }
      if (activeTopicFilter !== "all" && !isLinkMatchingTopic(link, activeTopicFilter)) {
        return;
      }

      const isConnectedToActive = (link.source === activeVerse || link.target === activeVerse);

      let x1 = verseToX(link.source);
      let x2 = verseToX(link.target);

      if (activeBook) {
        if (!sourceInBook) {
          x1 = link.source < activeBook.startVerseId ? PADDING_X - 12 : PADDING_X + usableWidth + 12;
        }
        if (!targetInBook) {
          x2 = link.target < activeBook.startVerseId ? PADDING_X - 12 : PADDING_X + usableWidth + 12;
        }
      }

      const dist = Math.abs(x2 - x1);
      const maxH = (bottomY - topY) * 0.45;
      const arcHeight = Math.min(maxH, Math.max(20, Math.pow(dist / usableWidth, 0.75) * maxH));
      const cx = (x1 + x2) / 2;
      const cy = bottomY - arcHeight;

      const sourceBook = getBookForVerse(link.source);
      const baseColor = (currentColorMode === "theme")
        ? getLinkThemeColor(link)
        : (sourceBook ? sourceBook.color : "#6366f1");

      ctx.beginPath();
      ctx.moveTo(x1, bottomY);
      ctx.quadraticCurveTo(cx, cy, x2, bottomY);

      if (isConnectedToActive) {
        const strokeCol = (currentColorMode === "theme") ? getLinkThemeColor(link) : "#38bdf8";
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 2.8;
        ctx.shadowColor = (currentColorMode === "theme") ? strokeCol : "rgba(56, 189, 248, 0.85)";
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (activeTopicFilter === "chiasmus") {
        ctx.strokeStyle = "#c084fc";
        ctx.lineWidth = 2.4;
        ctx.shadowColor = "rgba(192, 132, 252, 0.7)";
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (activeTopicFilter === "formulas") {
        ctx.strokeStyle = "#34d399";
        ctx.lineWidth = 2.4;
        ctx.shadowColor = "rgba(52, 211, 153, 0.7)";
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (activeTopicFilter === "hebraisms") {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2.4;
        ctx.shadowColor = "rgba(56, 189, 248, 0.7)";
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (activeVerse) {
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 0.7;
        ctx.globalAlpha = 0.06;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      } else {
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 1.1;
        ctx.globalAlpha = (currentColorMode === "theme") ? 0.65 : 0.4;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    });
  }

  // Active BOM Verse Dot
  if (activeVerse) {
    const activeX = verseToX(activeVerse);
    const activeBookObj = getBookForVerse(activeVerse);
    const pinColor = activeBookObj ? activeBookObj.color : "#38bdf8";

    ctx.fillStyle = pinColor;
    ctx.shadowColor = pinColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(activeX, bottomY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    connectedVerseIds.forEach(vid => {
      if (vid !== activeVerse) {
        const cx = verseToX(vid);
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(cx, bottomY, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }
}

// -------------------------------------------------------------
// VIEW 2: RADIAL VIEW (Sacred Scripture Ring / Mandala)
// -------------------------------------------------------------
function drawRadialView() {
  const rect = canvas.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const outerR = Math.min(rect.width, rect.height) * 0.42;
  const innerR = outerR - 14;
  const centerOrbR = outerR * 0.38;

  const activeVerse = hoveredVerseId || selectedVerseId;
  const activeBook = getActiveBook();

  function verseAngle(vId) {
    if (activeBook) {
      const span = Math.max(1, activeBook.endVerseId - activeBook.startVerseId);
      const ratio = Math.max(0, Math.min(1, (vId - activeBook.startVerseId) / span));
      return -Math.PI / 2 + ratio * (Math.PI * 2);
    }
    return -Math.PI / 2 + ((vId - 1) / 6603) * (Math.PI * 2);
  }

  // 1. Draw Circumference Segments (Books or Chapters)
  if (activeBook) {
    activeBook.chaptersList.forEach(ch => {
      const a1 = verseAngle(ch.startVerseId);
      const a2 = verseAngle(ch.endVerseId);

      const isOdd = ch.chapter % 2 === 1;
      ctx.strokeStyle = isOdd ? activeBook.color : adjustColorBrightness(activeBook.color, -25);
      ctx.lineWidth = (hoveredBookId && hoveredBookId.chapter === ch.chapter) ? 14 : 9;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, a1, a2);
      ctx.stroke();

      const shouldLabel = activeBook.chaptersCount <= 16
        ? true
        : (ch.chapter === 1 || ch.chapter === activeBook.chaptersCount || ch.chapter % 5 === 0);

      if (shouldLabel) {
        const midAngle = (a1 + a2) / 2;
        const labelR = outerR + 18;
        const lx = cx + labelR * Math.cos(midAngle);
        const ly = cy + labelR * Math.sin(midAngle);

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 9px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const chPrefix = getLang() === "pt" ? "Cap" : "Ch";
        ctx.fillText(`${chPrefix} ${ch.chapter}`, lx, ly);
      }
    });

    // Hotspots on the Ring for active book
    connectedVerseIdsList.forEach(vid => {
      if (vid >= activeBook.startVerseId && vid <= activeBook.endVerseId) {
        const ang = verseAngle(vid);
        const hx = cx + innerR * Math.cos(ang);
        const hy = cy + innerR * Math.sin(ang);

        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  } else {
    // Whole Book of Mormon: Draw 15 Book Segments
    const isNarrowRadial = rect.width < 480;
    books.forEach(b => {
      const a1 = verseAngle(b.startVerseId);
      const a2 = verseAngle(b.endVerseId);

      ctx.strokeStyle = b.color;
      ctx.lineWidth = (hoveredBookId && hoveredBookId.id === b.id) ? 14 : 9;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, a1, a2);
      ctx.stroke();

      const isHovered = hoveredBookId && hoveredBookId.id === b.id;
      if (isNarrowRadial && b.versesCount < 100 && !isHovered) return;

      const midAngle = (a1 + a2) / 2;
      const labelR = outerR + (isNarrowRadial ? 16 : 18);
      const lx = cx + labelR * Math.cos(midAngle);
      const ly = cy + labelR * Math.sin(midAngle);

      ctx.fillStyle = b.color;
      ctx.font = isNarrowRadial ? "bold 8.5px Inter, sans-serif" : "bold 9.5px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(getBookShortDisplayName(b.name, b.shortName), lx, ly);
    });

    // Hotspots on the Ring for all books
    connectedVerseIdsList.forEach(vid => {
      const ang = verseAngle(vid);
      const hx = cx + innerR * Math.cos(ang);
      const hy = cy + innerR * Math.sin(ang);

      ctx.fillStyle = "rgba(245, 158, 11, 0.7)";
      ctx.beginPath();
      ctx.arc(hx, hy, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // 3. Draw Chords Criss-Crossing Through the Center
  internalLinks.forEach(link => {
    const sourceInBook = activeBook ? (link.source >= activeBook.startVerseId && link.source <= activeBook.endVerseId) : true;
    const targetInBook = activeBook ? (link.target >= activeBook.startVerseId && link.target <= activeBook.endVerseId) : true;

    if (activeBook && !sourceInBook && !targetInBook) {
      return;
    }
    if (activeTopicFilter !== "all" && !isLinkMatchingTopic(link, activeTopicFilter)) {
      return;
    }

    const isConnectedToActive = (link.source === activeVerse || link.target === activeVerse);
    const a1 = verseAngle(link.source);
    const a2 = verseAngle(link.target);

    const x1 = cx + innerR * Math.cos(a1);
    const y1 = cy + innerR * Math.sin(a1);
    const x2 = cx + innerR * Math.cos(a2);
    const y2 = cy + innerR * Math.sin(a2);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(cx, cy, x2, y2);

    const sourceBook = getBookForVerse(link.source);
    const baseColor = (currentColorMode === "theme")
      ? getLinkThemeColor(link)
      : (sourceBook ? sourceBook.color : "#6366f1");

    if (isConnectedToActive) {
      const strokeCol = (currentColorMode === "theme") ? getLinkThemeColor(link) : "#38bdf8";
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 2.8;
      ctx.shadowColor = (currentColorMode === "theme") ? strokeCol : "rgba(56, 189, 248, 0.85)";
      ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (activeTopicFilter === "chiasmus") {
      ctx.strokeStyle = "#c084fc";
      ctx.lineWidth = 2.4;
      ctx.shadowColor = "rgba(192, 132, 252, 0.7)";
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (activeTopicFilter === "formulas") {
      ctx.strokeStyle = "#34d399";
      ctx.lineWidth = 2.4;
      ctx.shadowColor = "rgba(52, 211, 153, 0.7)";
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (activeTopicFilter === "hebraisms") {
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.4;
      ctx.shadowColor = "rgba(56, 189, 248, 0.7)";
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (activeVerse) {
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 0.6;
      ctx.globalAlpha = 0.05;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    } else {
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 1.1;
      ctx.globalAlpha = (currentColorMode === "theme") ? 0.60 : 0.35;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
  });

  // 4. Center Glowing Orb
  ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
  ctx.strokeStyle = "rgba(245, 158, 11, 0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, centerOrbR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (activeVerse) {
    const vObj = verses[activeVerse - 1];
    const conns = verseConnectionsMap.get(activeVerse) || { internal: [], external: [] };
    const total = conns.internal.length + conns.external.length;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#ffffff";
    ctx.font = "600 13px Cinzel, Georgia, serif";
    ctx.fillText(vObj ? vObj.ref : `Verse #${activeVerse}`, cx, cy - 14);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillText(t("connectionsCount", { n: total }), cx, cy + 8);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "9.5px Inter, sans-serif";
    const chLabel = getLang() === "pt" ? "Cap" : "Ch";
    const orbSub = activeBook
      ? `${getBookDisplayName(activeBook.name)} (${activeBook.chaptersCount} ${chLabel})`
      : (vObj ? getBookDisplayName(vObj.book) : t("wholeBom"));
    ctx.fillText(orbSub, cx, cy + 24);

    const activeAng = verseAngle(activeVerse);
    const ax = cx + outerR * Math.cos(activeAng);
    const ay = cy + outerR * Math.sin(activeAng);

    ctx.fillStyle = "#f59e0b";
    ctx.shadowColor = "#f59e0b";
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(ax, ay, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// -------------------------------------------------------------
// VIEW 3: THREADS VIEW (Chapter Reading & Living Scripture Threads)
// Inspired by trekhleb/bible-cross-references
// -------------------------------------------------------------
function calculateSpineLayout(canvasH, canvasW) {
  threadsSpineSegments = [];
  const paddingY = 18;
  const usableH = Math.max(200, canvasH - paddingY * 2);

  // Allocate 42% of spine to Bible, 58% to Book of Mormon
  const bibleTotalH = usableH * 0.42;
  const bomTotalH = usableH * 0.58;
  const bibleStartY = paddingY;
  const bomStartY = paddingY + bibleTotalH;

  // 1. Bible segments
  const totalBibleWeight = SPINE_BIBLE_BOOKS.reduce((acc, b) => acc + (b.weight || 1), 0);
  let curY = bibleStartY;
  SPINE_BIBLE_BOOKS.forEach(b => {
    const segH = ((b.weight || 1) / totalBibleWeight) * bibleTotalH;
    const displayName = getBibleBookDisplayName(b.name);
    threadsSpineSegments.push({
      name: b.name,
      short: getLang() === "pt" ? displayName.slice(0, 4) : b.short,
      displayName,
      color: b.color,
      top: curY,
      bottom: curY + segH,
      center: curY + segH / 2,
      category: "bible",
      bookObj: null
    });
    curY += segH;
  });

  // 2. Book of Mormon segments
  const totalBomVerses = 6604;
  curY = bomStartY;
  books.forEach(b => {
    const segH = (b.versesCount / totalBomVerses) * bomTotalH;
    threadsSpineSegments.push({
      name: b.name,
      short: getBookShortDisplayName(b.name, b.shortName || b.name),
      displayName: getBookDisplayName(b.name),
      color: b.color,
      top: curY,
      bottom: curY + segH,
      center: curY + segH / 2,
      category: "bom",
      bookObj: b
    });
    curY += segH;
  });
}

function countConnectionsToBookInCurrentChapter(bookName) {
  const chapterVerses = verses.filter(v => v.bookId === threadsCurrentBookId && v.ch === threadsCurrentChapter);
  let count = 0;
  chapterVerses.forEach(v => {
    const conns = verseConnectionsMap.get(v.id);
    if (!conns) return;
    conns.internal.forEach(link => {
      const isSrc = link.source === v.id;
      const tgtId = isSrc ? link.target : link.source;
      const b = getBookForVerse(tgtId);
      if (b && (b.name === bookName || getBookDisplayName(b.name) === bookName)) count++;
    });
    conns.external.forEach(link => {
      const bName = parseBibleBookName(link.externalRef);
      if (bName && bName === bookName) count++;
    });
  });
  return count;
}

function drawThreadsCanvas() {
  if (currentViewMode !== "threads" || !threadsCanvas || !threadsCtx || !threadsCanvasBox) return;

  const rect = threadsCanvasBox.getBoundingClientRect();
  const width = Math.floor(rect.width);
  const height = Math.floor(rect.height);
  if (width <= 0 || height <= 0) return;

  const dpr = window.devicePixelRatio || 1;
  const targetW = width * dpr;
  const targetH = height * dpr;
  if (threadsCanvas.width !== targetW || threadsCanvas.height !== targetH) {
    threadsCanvas.width = targetW;
    threadsCanvas.height = targetH;
    threadsCtx.setTransform(1, 0, 0, 1, 0, 0);
    threadsCtx.scale(dpr, dpr);
  } else {
    threadsCtx.clearRect(0, 0, width, height);
  }

  calculateSpineLayout(height, width);

  const spineBarWidth = width < 340 ? 8 : 10;
  const labelSpace = width < 340 ? 60 : 75;
  const spineBarLeft = Math.max(90, width - labelSpace - spineBarWidth);
  const gutterWidth = spineBarLeft;

  // Recalculate verse anchors from rendered reading pane DOM
  const paneRect = threadsReadingPane.getBoundingClientRect();
  const verseElements = threadsVersesList.querySelectorAll(".threads-verse-item");
  const anchors = [];

  verseElements.forEach(el => {
    const vId = parseInt(el.dataset.verseId, 10);
    const vRect = el.getBoundingClientRect();
    const y = (vRect.top - paneRect.top) + (vRect.height / 2);
    // Include if within visible vertical bounds with buffer
    if (y >= -40 && y <= height + 40) {
      anchors.push({ verseId: vId, y, el });
    }
  });

  const activeVerse = hoveredVerseId || selectedVerseId;
  const hasAnyEmphasis = activeVerse !== null || threadsHoveredVerseId !== null || threadsHoveredSpineBook !== null;

  // Collect threads
  const threadsToDraw = [];

  anchors.forEach(anchor => {
    const conns = verseConnectionsMap.get(anchor.verseId);
    if (!conns) return;

    // Filter connections
    const filteredInternal = currentFilter === "external" ? [] : conns.internal;
    const filteredExternal = currentFilter === "internal" ? [] : conns.external;

    // 1. Internal BOM threads
    filteredInternal.forEach(link => {
      const isSource = link.source === anchor.verseId;
      const targetId = isSource ? link.target : link.source;
      const targetBook = getBookForVerse(targetId);
      if (!targetBook) return;

      const bomSeg = threadsSpineSegments.find(s => s.category === "bom" && s.bookObj && s.bookObj.id === targetBook.id);
      if (!bomSeg) return;

      const segRange = bomSeg.bottom - bomSeg.top;
      const ratio = targetBook.versesCount > 1
        ? (targetId - targetBook.startVerseId) / targetBook.versesCount
        : 0.5;
      const targetY = bomSeg.top + Math.max(1, Math.min(segRange - 1, ratio * segRange));

      const isEmphasized =
        (anchor.verseId === activeVerse) ||
        (anchor.verseId === threadsHoveredVerseId) ||
        (threadsHoveredSpineBook && (bomSeg.name === threadsHoveredSpineBook || targetBook.name === threadsHoveredSpineBook));

      threadsToDraw.push({
        y1: anchor.y,
        y2: targetY,
        color: (currentColorMode === "theme") ? getLinkThemeColor(link) : (targetBook.color || "#38bdf8"),
        isEmphasized,
        targetName: targetBook.name,
        verseId: anchor.verseId
      });
    });

    // 2. External Bible threads
    filteredExternal.forEach(link => {
      const bName = parseBibleBookName(link.externalRef);
      if (!bName) return;

      const bibleSeg = threadsSpineSegments.find(s => s.category === "bible" && s.name === bName);
      if (!bibleSeg) return;

      const targetY = bibleSeg.center;
      const isEmphasized =
        (anchor.verseId === activeVerse) ||
        (anchor.verseId === threadsHoveredVerseId) ||
        (threadsHoveredSpineBook && bibleSeg.name === threadsHoveredSpineBook);

      threadsToDraw.push({
        y1: anchor.y,
        y2: targetY,
        color: (currentColorMode === "theme") ? getLinkThemeColor(link) : "#10b981", // Emerald green for Bible
        isEmphasized,
        targetName: bName,
        verseId: anchor.verseId
      });
    });
  });

  // Sort threads: faint ones first, emphasized ones on top
  threadsToDraw.sort((a, b) => Number(a.isEmphasized) - Number(b.isEmphasized));

  const bend = gutterWidth * 0.52;

  // Draw threads
  threadsToDraw.forEach(th => {
    threadsCtx.save();
    if (th.isEmphasized) {
      threadsCtx.globalAlpha = 0.95;
      threadsCtx.strokeStyle = th.color;
      threadsCtx.lineWidth = 2.4;
      threadsCtx.shadowColor = th.color;
      threadsCtx.shadowBlur = 10;
    } else if (hasAnyEmphasis) {
      threadsCtx.globalAlpha = 0.06;
      threadsCtx.strokeStyle = th.color;
      threadsCtx.lineWidth = 0.8;
    } else {
      threadsCtx.globalAlpha = 0.32;
      threadsCtx.strokeStyle = th.color;
      threadsCtx.lineWidth = 1.1;
    }

    threadsCtx.beginPath();
    threadsCtx.moveTo(0, th.y1);
    threadsCtx.bezierCurveTo(bend, th.y1, spineBarLeft - bend, th.y2, spineBarLeft, th.y2);
    threadsCtx.stroke();

    // Landing tick
    threadsCtx.fillStyle = th.color;
    threadsCtx.fillRect(spineBarLeft - 4, th.y2 - 1, 4, 2);
    threadsCtx.restore();
  });

  // Draw Spine Bar
  threadsSpineSegments.forEach(seg => {
    const isHovered = threadsHoveredSpineBook === seg.name;
    const segH = Math.max(seg.bottom - seg.top, 1.5);

    threadsCtx.fillStyle = seg.color;
    threadsCtx.globalAlpha = isHovered ? 1.0 : (seg.category === "bible" ? 0.85 : 0.95);
    threadsCtx.fillRect(spineBarLeft, seg.top, spineBarWidth, segH);

    // Separator line between segments
    threadsCtx.strokeStyle = "rgba(0, 0, 0, 0.4)";
    threadsCtx.lineWidth = 0.5;
    threadsCtx.strokeRect(spineBarLeft, seg.top, spineBarWidth, segH);

    // Label on the right
    if (segH >= 11 || isHovered) {
      threadsCtx.font = isHovered ? "bold 10px Inter, system-ui, sans-serif" : "9px Inter, system-ui, sans-serif";
      threadsCtx.textAlign = "left";
      threadsCtx.textBaseline = "middle";
      threadsCtx.fillStyle = isHovered ? "#ffffff" : "#94a3b8";
      threadsCtx.globalAlpha = isHovered ? 1.0 : 0.8;

      const labelText = width < 340 ? seg.short : seg.displayName;
      threadsCtx.fillText(labelText, spineBarLeft + spineBarWidth + 6, seg.center);
    }
  });

  threadsCtx.globalAlpha = 1.0;

  // Draw "You Are Here" indicator on current chapter
  const currentBookObj = books.find(b => b.id === threadsCurrentBookId);
  if (currentBookObj) {
    const chData = currentBookObj.chaptersList ? currentBookObj.chaptersList.find(c => c.chapter === threadsCurrentChapter) : null;
    if (chData) {
      const bomSeg = threadsSpineSegments.find(s => s.category === "bom" && s.bookObj && s.bookObj.id === currentBookObj.id);
      if (bomSeg) {
        const segRange = bomSeg.bottom - bomSeg.top;
        const startRatio = (chData.startVerseId - currentBookObj.startVerseId) / currentBookObj.versesCount;
        const endRatio = (chData.endVerseId - currentBookObj.startVerseId) / currentBookObj.versesCount;
        const topY = bomSeg.top + startRatio * segRange;
        const botY = bomSeg.top + endRatio * segRange;
        const h = Math.max(botY - topY, 6);

        threadsCtx.strokeStyle = "#fbbf24"; // Gold bracket
        threadsCtx.lineWidth = 2.5;
        threadsCtx.shadowColor = "#fbbf24";
        threadsCtx.shadowBlur = 8;
        threadsCtx.strokeRect(spineBarLeft - 2, topY - 1, spineBarWidth + 4, h + 2);
        threadsCtx.shadowBlur = 0;
      }
    }
  }
}

function renderThreadsChapter(scrollToTop = true) {
  if (!verses || verses.length === 0 || !books || books.length === 0) return;

  const currentBookObj = books.find(b => b.id === threadsCurrentBookId) || books[0];
  const bookDisplayName = getBookDisplayName(currentBookObj.name);

  // Populate book dropdown if empty or language changed
  if (threadsBookSelect.options.length !== books.length) {
    threadsBookSelect.innerHTML = "";
    books.forEach(b => {
      const opt = document.createElement("option");
      opt.value = b.id;
      opt.textContent = getBookDisplayName(b.name);
      if (b.id === threadsCurrentBookId) opt.selected = true;
      threadsBookSelect.appendChild(opt);
    });
  } else {
    threadsBookSelect.value = threadsCurrentBookId;
  }

  // Populate chapter dropdown
  threadsChapterSelect.innerHTML = "";
  for (let ch = 1; ch <= currentBookObj.chaptersCount; ch++) {
    const opt = document.createElement("option");
    opt.value = ch;
    opt.textContent = t("threadsSelectChapter", { n: ch });
    if (ch === threadsCurrentChapter) opt.selected = true;
    threadsChapterSelect.appendChild(opt);
  }

  // Filter verses for this book & chapter
  const chapterVerses = verses.filter(v => v.bookId === threadsCurrentBookId && v.ch === threadsCurrentChapter);

  // Header & subtitle
  threadsChapterHeaderTitle.textContent = `${bookDisplayName} ${threadsCurrentChapter}`;
  threadsChapterHeaderSub.textContent = t("threadsHoverHint");

  // Calculate connections in chapter
  let totalConnectionsInChapter = 0;
  chapterVerses.forEach(v => {
    const conns = verseConnectionsMap.get(v.id);
    if (conns) {
      const nInt = currentFilter === "external" ? 0 : conns.internal.length;
      const nExt = currentFilter === "internal" ? 0 : conns.external.length;
      totalConnectionsInChapter += (nInt + nExt);
    }
  });

  threadsStatsBadge.textContent = t("threadsReadingStats", {
    book: bookDisplayName,
    ch: threadsCurrentChapter,
    verses: chapterVerses.length,
    links: totalConnectionsInChapter
  });

  // Render verses list
  threadsVersesList.innerHTML = "";
  const activeVerse = hoveredVerseId || selectedVerseId;

  chapterVerses.forEach(v => {
    const item = document.createElement("div");
    item.className = "threads-verse-item";
    item.dataset.verseId = v.id;
    if (v.id === activeVerse) {
      item.classList.add("active");
    }

    const conns = verseConnectionsMap.get(v.id);
    const nInt = conns ? (currentFilter === "external" ? 0 : conns.internal.length) : 0;
    const nExt = conns ? (currentFilter === "internal" ? 0 : conns.external.length) : 0;
    const totalConns = nInt + nExt;

    if (totalConns > 0) {
      item.classList.add("has-connections");
    }

    item.innerHTML = `
      <span class="threads-verse-num">${v.v}</span>
      <span class="threads-verse-text">
        ${v.text}
        ${totalConns > 0 ? `<span class="threads-verse-pill" title="${t('verseConnectionsTooltip', { n: totalConns })}">${icons.link} ${totalConns}</span>` : ""}
      </span>
    `;

    item.addEventListener("mouseenter", () => {
      threadsHoveredVerseId = v.id;
      drawThreadsCanvas();
    });

    item.addEventListener("mouseleave", () => {
      threadsHoveredVerseId = null;
      drawThreadsCanvas();
    });

    item.addEventListener("click", () => {
      selectVerse(v.id, true);
    });

    threadsVersesList.appendChild(item);
  });

  if (scrollToTop) {
    threadsReadingPane.scrollTop = 0;
  }

  // Draw canvas after DOM layout settles
  requestAnimationFrame(() => {
    drawThreadsCanvas();
  });
}

function changeThreadsChapter(delta) {
  const currentBookObj = books.find(b => b.id === threadsCurrentBookId);
  if (!currentBookObj) return;

  let newCh = threadsCurrentChapter + delta;
  if (newCh >= 1 && newCh <= currentBookObj.chaptersCount) {
    threadsCurrentChapter = newCh;
  } else if (newCh < 1) {
    // Go to previous book
    const prevBookIdx = books.findIndex(b => b.id === threadsCurrentBookId) - 1;
    if (prevBookIdx >= 0) {
      threadsCurrentBookId = books[prevBookIdx].id;
      threadsCurrentChapter = books[prevBookIdx].chaptersCount;
    }
  } else if (newCh > currentBookObj.chaptersCount) {
    // Go to next book
    const nextBookIdx = books.findIndex(b => b.id === threadsCurrentBookId) + 1;
    if (nextBookIdx < books.length) {
      threadsCurrentBookId = books[nextBookIdx].id;
      threadsCurrentChapter = 1;
    }
  }

  // Pick first verse of new chapter as selected
  const firstVerse = verses.find(v => v.bookId === threadsCurrentBookId && v.ch === threadsCurrentChapter);
  if (firstVerse) {
    selectedVerseId = firstVerse.id;
  }

  renderThreadsChapter(true);
  if (selectedVerseId) {
    selectVerse(selectedVerseId);
  }
}


function getBookForVerse(verseId) {
  return books.find(b => verseId >= b.startVerseId && verseId <= b.endVerseId);
}

function populateBookSelect() {
  const currentVal = bookSelect.value;
  bookSelect.innerHTML = "";

  const allOpt = document.createElement("option");
  allOpt.value = "all";
  allOpt.textContent = t("allBooks");
  bookSelect.appendChild(allOpt);

  const isPt = getLang() === "pt";
  const chLabel = isPt ? "cap" : "ch";

  books.forEach(b => {
    const opt = document.createElement("option");
    opt.value = b.id;
    const name = getBookDisplayName(b.name);
    opt.textContent = `${name} (${b.chaptersCount} ${chLabel})`;
    bookSelect.appendChild(opt);
  });

  bookSelect.value = currentVal || "all";
}

// Render the Axis bar below canvas (whole BOM or chapters of zoomed book)
function renderAxis() {
  axisBar.innerHTML = "";
  bookLabelsRow.innerHTML = "";

  const activeBook = getActiveBook();

  if (activeBook) {
    bomBottomTitle.innerHTML = `📜 <strong>${activeBook.name}</strong> (${activeBook.chaptersCount} ch, ${activeBook.versesCount} v)`;
    zoomResetBtn.style.display = "inline-flex";
    zoomResetText.textContent = t("zoomReset");

    activeBook.chaptersList.forEach(ch => {
      const pct = (ch.versesCount / activeBook.versesCount) * 100;
      const seg = document.createElement("div");
      seg.className = "chapter-segment";
      seg.style.width = `${pct}%`;
      const isOdd = ch.chapter % 2 === 1;
      seg.style.backgroundColor = isOdd ? activeBook.color : adjustColorBrightness(activeBook.color, -25);
      seg.title = `${activeBook.name} ${ch.chapter} (${ch.versesCount} verses)`;

      seg.addEventListener("click", () => {
        selectVerse(ch.startVerseId);
      });
      axisBar.appendChild(seg);

      const pill = document.createElement("button");
      pill.className = "chapter-label-pill";
      pill.dataset.chapter = String(ch.chapter);
      pill.textContent = t("chapterLabel", { n: ch.chapter });
      if (verses[selectedVerseId - 1]?.book === activeBook.name && verses[selectedVerseId - 1]?.ch === ch.chapter) {
        pill.classList.add("active");
      }
      pill.addEventListener("click", () => {
        selectVerse(ch.startVerseId);
      });
      bookLabelsRow.appendChild(pill);
    });
  } else {
    bomBottomTitle.textContent = `📜 ${t("bomBottomTitle")}`;
    zoomResetBtn.style.display = "none";

    books.forEach(b => {
      const pct = (b.versesCount / 6604) * 100;

      const seg = document.createElement("div");
      seg.className = "book-segment";
      seg.style.width = `${pct}%`;
      seg.style.backgroundColor = b.color;
      seg.title = `${b.name} (${b.chaptersCount} ch, ${b.versesCount} v) - Click to zoom in`;
      seg.addEventListener("click", () => {
        zoomToBook(b.id);
      });
      seg.addEventListener("mouseenter", () => {
        hoveredBookId = b;
        draw();
      });
      seg.addEventListener("mouseleave", () => {
        hoveredBookId = null;
        draw();
      });
      axisBar.appendChild(seg);

      const pill = document.createElement("button");
      pill.className = "book-label-pill";
      pill.textContent = getBookShortDisplayName(b.name, b.shortName);
      pill.style.borderBottom = `2px solid ${b.color}`;
      pill.title = getLang() === "pt" ? `Ampliar ${getBookDisplayName(b.name)}` : `Zoom into ${b.name}`;
      pill.addEventListener("click", () => {
        zoomToBook(b.id);
      });
      pill.addEventListener("mouseenter", () => {
        hoveredBookId = b;
        draw();
      });
      pill.addEventListener("mouseleave", () => {
        hoveredBookId = null;
        draw();
      });
      bookLabelsRow.appendChild(pill);
    });
  }
}

function zoomToBook(bookId) {
  activeBookFilter = String(bookId);
  bookSelect.value = String(bookId);
  const b = books.find(item => item.id === parseInt(bookId, 10));
  if (b) {
    selectVerse(b.startVerseId);
  }
  renderAxis();
  draw();
}

function resetZoom() {
  activeBookFilter = "all";
  bookSelect.value = "all";
  renderAxis();
  draw();
}

// Render the Featured Connections quick-picker pills (dynamic verseId resolution)
function renderFeaturedPills() {
  featuredPillsRow.innerHTML = "";
  const lang = getLang();

  FEATURED_CONNECTIONS.forEach((item) => {
    const pill = document.createElement("button");
    pill.className = "featured-pill";
    if (selectedVerseId === item.verseId) {
      pill.classList.add("active");
    }

    const title = lang === "pt" ? item.titlePt : item.titleEn;
    const tag = lang === "pt" ? item.tagPt : item.tagEn;

    pill.innerHTML = `
      ${icons.sparkles}
      <span>${title}</span>
      <span class="featured-pill-tag">${tag}</span>
    `;

    pill.addEventListener("click", () => {
      if (item.verseId) {
        selectVerse(item.verseId, true);
      }
    });

    featuredPillsRow.appendChild(pill);
  });
}

// Precompute and index topic tags for links during initialization for zero-alloc hot loop rendering
function computeLinkTopics(link) {
  const topics = new Set();
  const lType = (link.type || "").toLowerCase();
  const note = (link.note || "").toLowerCase();
  const notePt = (link.notePt || "").toLowerCase();
  const noteAll = note + " " + notePt;
  const extRef = (link.externalRef || "").toLowerCase();

  if (lType === "chiasmus" || noteAll.includes("chiasm") || noteAll.includes("quiasm")) {
    topics.add("chiasmus");
  }
  if (lType === "prophetic-formula" || lType === "covenant-formula" || noteAll.includes("thus we see") || noteAll.includes("assim vemos") || noteAll.includes("prosper")) {
    topics.add("formulas");
  }
  if (lType === "hebraism" || noteAll.includes("construct") || noteAll.includes("hebraism") || noteAll.includes("oath") || noteAll.includes("colophon")) {
    topics.add("hebraisms");
  }
  if (lType.includes("prophecy") || lType.includes("fulfillment") || noteAll.includes("prophe") || noteAll.includes("profec")) {
    topics.add("prophecy");
  }
  if (noteAll.includes("christ") || noteAll.includes("jesus") || noteAll.includes("messiah") || noteAll.includes("lord") || noteAll.includes("cristo") || noteAll.includes("salvador")) {
    topics.add("christ");
  }
  if (noteAll.includes("faith") || noteAll.includes("repent") || noteAll.includes("fé") || noteAll.includes("arrependimento")) {
    topics.add("faith");
  }
  if (extRef.startsWith("isaiah") || noteAll.includes("isaiah") || noteAll.includes("isaías") || extRef.startsWith("isa")) {
    topics.add("isaiah");
  }
  link._topics = topics;
}

// Check if a link matches the selected doctrinal or literary topic
function isLinkMatchingTopic(link, topic) {
  if (!topic || topic === "all") return true;
  return link._topics ? link._topics.has(topic) : true;
}

// Render Ancient Semitic Literary Structures (Chiasmus, Formulas, Hebraisms) in the Study Panel
function renderLiteraryStructure(verseId) {
  if (!literaryStructureBox) return;

  const structures = verseStructuresMap.get(verseId);
  if (!structures || structures.length === 0) {
    literaryStructureBox.style.display = "none";
    return;
  }

  const struct = structures[0];
  literaryStructureBox.style.display = "block";

  // Badges and title
  if (struct.type === "chiasmus") {
    structureTypeBadge.textContent = t("structureChiasmusTag");
  } else if (struct.type === "prophetic-formula") {
    structureTypeBadge.textContent = t("structureFormulaTag");
  } else if (struct.type === "hebraism") {
    structureTypeBadge.textContent = t("structureHebraismTag");
  } else {
    structureTypeBadge.textContent = struct.type;
  }

  structureScopeBadge.textContent = getExternalRefDisplayName(struct.passage);
  structureTitle.textContent = getLang() === "pt" ? struct.titlePt : struct.titleEn;
  structureDesc.textContent = getLang() === "pt" ? struct.descriptionPt : struct.descriptionEn;

  // Render Chiastic tree
  if (struct.type === "chiasmus" && struct.chiasticTree && struct.chiasticTree.length > 0) {
    chiasticTreeContainer.style.display = "block";
    structureOccurrencesContainer.style.display = "none";

    chiasticTreeHeaderTitle.textContent = t("structureTreeHeader");
    chiasticTreeHint.textContent = t("structureTreeHint");
    chiasticTreeList.innerHTML = "";

    struct.chiasticTree.forEach(item => {
      const row = document.createElement("div");
      const isApex = !!item.isCenter;
      const isActive = (item.verseId === verseId);
      row.className = `chiastic-tree-item ${isApex ? "is-apex" : ""} ${isActive ? "active" : ""}`;

      const cleanLevel = item.level.replace("'", "").trim();
      let depth = 0;
      if (cleanLevel === "B") depth = 1;
      else if (cleanLevel === "C") depth = 2;
      else if (cleanLevel === "D") depth = 3;
      else if (cleanLevel === "E") depth = 4;
      else if (item.isCenter) depth = 5;

      row.style.setProperty("--chiasmus-depth", depth);

      const textSnippet = getLang() === "pt" ? item.textPt : item.textEn;
      row.innerHTML = `
        <span class="chiastic-level">${item.level}</span>
        <span class="chiastic-ref">${getExternalRefDisplayName(item.ref)}</span>
        <span class="chiastic-text" title="${textSnippet}">"${textSnippet}"</span>
      `;
      row.addEventListener("click", () => {
        selectVerse(item.verseId, false);
      });
      chiasticTreeList.appendChild(row);
    });
  } else if (struct.examples && struct.examples.length > 0) {
    chiasticTreeContainer.style.display = "none";
    structureOccurrencesContainer.style.display = "block";

    structureOccurrencesHeaderTitle.textContent = t("structureOccurrencesHeader");
    structureOccurrencesHint.textContent = t("structureOccurrencesHint");
    structurePillsList.innerHTML = "";

    struct.examples.forEach(item => {
      const pill = document.createElement("button");
      const isActive = (item.verseId === verseId);
      pill.className = `structure-pill ${isActive ? "active" : ""}`;
      const tagText = getLang() === "pt" ? item.tagPt : item.tagEn;
      pill.innerHTML = `
        <strong>${getExternalRefDisplayName(item.ref)}</strong>
        <span class="structure-pill-tag">${tagText}</span>
      `;
      pill.addEventListener("click", () => {
        selectVerse(item.verseId, false);
      });
      structurePillsList.appendChild(pill);
    });
  } else {
    chiasticTreeContainer.style.display = "none";
    structureOccurrencesContainer.style.display = "none";
  }
}

// Select a verse and update the Study Panel
function selectVerse(verseId, shouldScroll = false) {
  if (!verseId || verseId < 1 || verseId > 6604) return;
  selectedVerseId = verseId;

  // Update sequential tour counter if present (book-aware)
  const activeBook = getActiveBook();
  const relevantList = activeBook
    ? connectedVerseIdsList.filter(vid => vid >= activeBook.startVerseId && vid <= activeBook.endVerseId)
    : connectedVerseIdsList;

  const tourIdx = relevantList.indexOf(verseId);
  const shortBookName = activeBook ? getBookShortDisplayName(activeBook.name, activeBook.shortName) : "";
  const bookPrep = getLang() === "pt" ? "em" : "in";
  if (tourIdx !== -1) {
    currentTourIndex = tourIdx;
    connCounterBadge.textContent = activeBook
      ? `${currentTourIndex + 1} / ${relevantList.length} ${bookPrep} ${shortBookName}`
      : `${currentTourIndex + 1} / ${connectedVerseIdsList.length}`;
  } else {
    connCounterBadge.textContent = activeBook
      ? `${relevantList.length} ${bookPrep} ${shortBookName}`
      : `${connectedVerseIdsList.length} ${getLang() === "pt" ? "Conectados" : "Connected"}`;
  }

  const verseObj = verses[verseId - 1];
  const book = getBookForVerse(verseId);
  const connections = verseConnectionsMap.get(verseId) || { internal: [], external: [] };

  // Highlight active chapter pill if zoomed in
  if (activeBook && verseObj) {
    document.querySelectorAll(".chapter-label-pill").forEach(p => {
      if (p.dataset.chapter === String(verseObj.ch)) {
        p.classList.add("active");
        p.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      } else {
        p.classList.remove("active");
      }
    });
  }

  if (verseObj) {
    selectedVerseRef.textContent = verseObj.ref;
    selectedVerseBadge.style.display = "inline-block";
    selectedVerseBadge.textContent = book ? getBookDisplayName(book.name) : "Scripture";
    selectedVerseBadge.style.borderColor = book ? `${book.color}80` : "";
    selectedVerseBadge.style.color = book ? book.color : "";

    const verseChurchUrl = getChurchStudyUrl(verseObj);
    const boxTitle = getLang() === "pt"
      ? `Abrir ${verseObj.ref} em ChurchofJesusChrist.org ↗`
      : `Open ${verseObj.ref} on ChurchofJesusChrist.org ↗`;
    verseTextBox.title = boxTitle;
    verseTextBox.setAttribute("aria-label", boxTitle);
    verseTextBox.setAttribute("role", "button");
    verseTextBox.setAttribute("tabindex", "0");
    verseTextBox.innerHTML = `"${verseObj.text}" <span class="verse-box-link-hint" title="${boxTitle}" aria-hidden="true">${icons.externalLink}</span>`;

    // Official Church of Jesus Christ of Latter-day Saints study URL
    if (verseChurchUrl) {
      officialLinkContainer.style.display = "block";
      officialLink.href = verseChurchUrl;
      officialLink.querySelector("span").textContent = t("readOnOfficial");
    } else {
      officialLinkContainer.style.display = "none";
    }
  }

  // Render connections list (filtered by currentFilter)
  connectionsList.innerHTML = "";
  const filteredInternal = currentFilter === "external" ? [] : connections.internal;
  const filteredExternal = currentFilter === "internal" ? [] : connections.external;
  const totalCount = filteredInternal.length + filteredExternal.length;
  connectionsCountBadge.textContent = t("connectionsCount", { n: totalCount });

  if (totalCount === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "connection-card";
    emptyMsg.style.cursor = "default";
    emptyMsg.textContent = t("noConnections");
    connectionsList.appendChild(emptyMsg);
  } else {
    // Internal links
    filteredInternal.forEach(link => {
      const isSource = link.source === verseId;
      const targetId = isSource ? link.target : link.source;
      const targetRefStr = isSource ? link.targetRef : link.sourceRef;
      const targetVerse = verses[targetId - 1];
      const targetChurchUrl = getChurchStudyUrl(targetVerse);
      const displayRef = (getLang() === "pt" && targetVerse) ? targetVerse.ref : targetRefStr;
      const churchTooltip = getLang() === "pt"
        ? `Abrir ${displayRef} em ChurchofJesusChrist.org ↗`
        : `Open ${displayRef} on ChurchofJesusChrist.org ↗`;

      const typeTag = getConnectionTypeDisplayName(link.type || "parallel");
      let tagClass = "tag-internal";
      if (link.type === "chiasmus") {
        tagClass = "tag-chiasmus";
      } else if (link.type === "prophetic-formula" || link.type === "covenant-formula") {
        tagClass = "tag-formula";
      } else if (link.type === "hebraism") {
        tagClass = "tag-hebraism";
      }

      const noteText = getLang() === "pt"
        ? (link.notePt || link.note)
        : (link.noteEn || link.note);

      const card = document.createElement("div");
      card.className = "connection-card";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", `${t("jumpTo")} ${displayRef}`);
      card.innerHTML = `
        <div class="connection-left">
          <div class="connection-title">
            ${icons.link} ${displayRef}
            ${targetChurchUrl ? `<a href="${targetChurchUrl}" target="_blank" rel="noopener noreferrer" class="external-link-hint" title="${churchTooltip}" onclick="event.stopPropagation()">${icons.externalLink}</a>` : ""}
          </div>
          ${noteText ? `<div class="connection-note">${noteText}</div>` : ""}
        </div>
        <span class="tag ${tagClass}">${typeTag}</span>
      `;
      card.addEventListener("click", () => {
        selectVerse(targetId);
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectVerse(targetId);
        }
      });
      connectionsList.appendChild(card);
    });

    // External links (Bible, PGP, D&C)
    filteredExternal.forEach(link => {
      const card = document.createElement("div");
      const studyUrl = getBibleStudyUrl(link.externalRef);
      card.className = "connection-card connection-card-external";
      const displayExternalRef = getExternalRefDisplayName(link.externalRef);
      const displayExternalWork = getExternalWorkDisplayName(link.externalWork);
      const displayType = getConnectionTypeDisplayName(link.type);

      const extVerseObj = externalVerses[link.externalRef];
      const isPt = getLang() === "pt";
      const bibleVerseText = extVerseObj
        ? (isPt ? (extVerseObj.textPt || extVerseObj.textEn) : (extVerseObj.textEn || extVerseObj.textPt))
        : "";

      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      const tooltipText = isPt
        ? `Comparar ${verseObj.ref} com ${displayExternalRef} lado a lado`
        : `Compare ${verseObj.ref} with ${displayExternalRef} side-by-side`;
      card.setAttribute("title", tooltipText);
      card.setAttribute("aria-label", tooltipText);

      card.addEventListener("click", () => {
        openComparisonModal(verseObj, link);
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openComparisonModal(verseObj, link);
        }
      });

      const extNoteText = isPt
        ? (link.notePt || link.note)
        : (link.noteEn || link.note);

      card.innerHTML = `
        <div class="connection-left">
          <div class="connection-title">
            ${icons.bookOpen} ${displayExternalRef} (${displayExternalWork})
            ${studyUrl ? `<a href="${studyUrl}" target="_blank" rel="noopener noreferrer" class="external-link-hint" title="${isPt ? 'Abrir no site oficial da Igreja ↗' : 'Open on ChurchofJesusChrist.org ↗'}" onclick="event.stopPropagation()">${icons.externalLink}</a>` : ""}
          </div>
          ${bibleVerseText ? `<div class="connection-verse-quote">"${bibleVerseText}"</div>` : ""}
          ${extNoteText ? `<div class="connection-note">${extNoteText}</div>` : ""}
          <div class="connection-actions-row">
            <button type="button" class="btn-compare-side" title="${t('viewComparisonTooltip')}">
              <svg class="ui-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
              <span>${t('viewComparisonBtn')}</span>
            </button>
          </div>
        </div>
        <span class="tag tag-external">${displayType}</span>
      `;

      const compareBtn = card.querySelector(".btn-compare-side");
      if (compareBtn) {
        compareBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          openComparisonModal(verseObj, link);
        });
      }

      connectionsList.appendChild(card);
    });
  }

  // Render Ancient Semitic Literary Structures (Chiasmus, Formulas, Hebraisms)
  renderLiteraryStructure(verseId);

  // Update pills highlight if matching
  document.querySelectorAll(".featured-pill").forEach((pill, idx) => {
    if (FEATURED_CONNECTIONS[idx]?.verseId === verseId) {
      pill.classList.add("active");
    } else {
      pill.classList.remove("active");
    }
  });

  if (currentViewMode === "threads" && verseObj) {
    if (threadsCurrentBookId !== verseObj.bookId || threadsCurrentChapter !== verseObj.ch) {
      threadsCurrentBookId = verseObj.bookId;
      threadsCurrentChapter = verseObj.ch;
      renderThreadsChapter(false);
    }
    // Highlight active verse in reading pane
    document.querySelectorAll(".threads-verse-item").forEach(item => {
      item.classList.toggle("active", parseInt(item.dataset.verseId, 10) === verseId);
    });
    const activeEl = threadsVersesList.querySelector(`[data-verse-id="${verseId}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    drawThreadsCanvas();
  } else {
    draw();
  }

  syncURLParams();
  updateBookmarksUI();

  // Auto-scroll to Study Panel when user explicitly clicks/selects a verse
  if (shouldScroll) {
    setTimeout(() => {
      scrollToStudyPanel();
    }, 120);
  }
}

// Mode-aware verse detection helper for mouse and touch interactions
function getVerseAtCanvasPoint(mouseX, mouseY, radiusTolerance = 20) {
  const rect = canvas.getBoundingClientRect();
  if (currentViewMode === "radial") {
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dist = Math.sqrt((mouseX - cx) ** 2 + (mouseY - cy) ** 2);
    const outerR = Math.min(rect.width, rect.height) * 0.42;

    if (dist >= outerR * 0.25 && dist <= outerR * 1.3) {
      const angle = Math.atan2(mouseY - cy, mouseX - cx);
      return radialToVerse(angle);
    }
  } else {
    if (mouseX >= PADDING_X - 10 && mouseX <= PADDING_X + usableWidth + 10) {
      return findNearestConnectedVerse(mouseX, radiusTolerance);
    }
  }
  return null;
}

// Mouse events on canvas with mode-aware coordinates
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const vId = getVerseAtCanvasPoint(mouseX, mouseY, 18);

  if (vId) {
    hoveredVerseId = vId;
    const vObj = verses[vId - 1];
    const conns = verseConnectionsMap.get(vId) || { internal: [], external: [] };
    const total = conns.internal.length + conns.external.length;

    tooltip.style.display = "block";
    tooltip.style.left = `${e.clientX}px`;
    tooltip.style.top = `${e.clientY - 14}px`;
    tooltip.innerHTML = `<strong>${vObj ? vObj.ref : `Verse #${vId}`}</strong> &bull; ${total} connection${total === 1 ? '' : 's'}`;
  } else {
    hoveredVerseId = null;
    tooltip.style.display = "none";
  }
  draw();
});

canvas.addEventListener("mouseleave", () => {
  hoveredVerseId = null;
  tooltip.style.display = "none";
  draw();
});

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const vId = getVerseAtCanvasPoint(mouseX, mouseY, 20);
  if (vId) {
    selectVerse(vId, true);
  }
});

// Touch events on canvas for smooth mobile scrubbing & tap selection
let isCanvasTouching = false;
let canvasTouchStartPos = { x: 0, y: 0 };

canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const mouseX = touch.clientX - rect.left;
    const mouseY = touch.clientY - rect.top;
    canvasTouchStartPos = { x: touch.clientX, y: touch.clientY };

    const vId = getVerseAtCanvasPoint(mouseX, mouseY, 28);
    if (vId) {
      isCanvasTouching = true;
      hoveredVerseId = vId;
      const vObj = verses[vId - 1];
      const conns = verseConnectionsMap.get(vId) || { internal: [], external: [] };
      const total = conns.internal.length + conns.external.length;

      tooltip.style.display = "block";
      tooltip.style.left = `${touch.clientX}px`;
      tooltip.style.top = `${touch.clientY - 42}px`;
      tooltip.innerHTML = `<strong>${vObj ? vObj.ref : `Verse #${vId}`}</strong> &bull; ${total} connection${total === 1 ? '' : 's'}`;
      draw();
    }
  }
}, { passive: true });

canvas.addEventListener("touchmove", (e) => {
  if (e.touches.length === 1 && isCanvasTouching) {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const mouseX = touch.clientX - rect.left;
    const mouseY = touch.clientY - rect.top;

    const vId = getVerseAtCanvasPoint(mouseX, mouseY, 28);
    if (vId) {
      hoveredVerseId = vId;
      const vObj = verses[vId - 1];
      const conns = verseConnectionsMap.get(vId) || { internal: [], external: [] };
      const total = conns.internal.length + conns.external.length;

      tooltip.style.display = "block";
      tooltip.style.left = `${touch.clientX}px`;
      tooltip.style.top = `${touch.clientY - 42}px`;
      tooltip.innerHTML = `<strong>${vObj ? vObj.ref : `Verse #${vId}`}</strong> &bull; ${total} connection${total === 1 ? '' : 's'}`;
      draw();

      // If scrubbing along the horizontal timeline, prevent window scrolling
      if (Math.abs(touch.clientX - canvasTouchStartPos.x) > Math.abs(touch.clientY - canvasTouchStartPos.y)) {
        if (e.cancelable) e.preventDefault();
      }
    }
  }
}, { passive: false });

canvas.addEventListener("touchend", () => {
  if (isCanvasTouching) {
    isCanvasTouching = false;
    tooltip.style.display = "none";
    if (hoveredVerseId) {
      const selectedId = hoveredVerseId;
      hoveredVerseId = null;
      selectVerse(selectedId, true);
    }
    draw();
  }
});

canvas.addEventListener("touchcancel", () => {
  isCanvasTouching = false;
  hoveredVerseId = null;
  tooltip.style.display = "none";
  draw();
});

// Touch tap on axis bar segments
axisBar.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (el && (el.classList.contains("book-segment") || el.classList.contains("chapter-segment"))) {
      el.click();
    }
  }
}, { passive: true });

// View mode switcher buttons
viewBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    viewBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentViewMode = btn.dataset.view;

    if (currentViewMode === "dual") {
      canvasWrapper.style.display = "block";
      threadsContainer.style.display = "none";
      dualTopLabelRow.style.display = "flex";
      dualBottomLabelRow.style.display = "flex";
      axisContainer.style.display = "block";
      draw();
    } else if (currentViewMode === "radial") {
      canvasWrapper.style.display = "block";
      threadsContainer.style.display = "none";
      dualTopLabelRow.style.display = "none";
      dualBottomLabelRow.style.display = "none";
      axisContainer.style.display = "none";
      draw();
    } else if (currentViewMode === "threads") {
      canvasWrapper.style.display = "none";
      threadsContainer.style.display = "flex";
      if (selectedVerseId) {
        const v = verses.find(x => x.id === selectedVerseId);
        if (v) {
          threadsCurrentBookId = v.bookId;
          threadsCurrentChapter = v.ch;
        }
      }
      renderThreadsChapter(true);
    }
    syncURLParams();
  updateBookmarksUI();
  });
});

// Threads View Event Listeners
threadsPrevChBtn.addEventListener("click", () => changeThreadsChapter(-1));
threadsNextChBtn.addEventListener("click", () => changeThreadsChapter(1));

threadsBookSelect.addEventListener("change", (e) => {
  threadsCurrentBookId = parseInt(e.target.value, 10);
  threadsCurrentChapter = 1;
  const firstVerse = verses.find(v => v.bookId === threadsCurrentBookId && v.ch === threadsCurrentChapter);
  if (firstVerse) selectedVerseId = firstVerse.id;
  renderThreadsChapter(true);
  if (selectedVerseId) selectVerse(selectedVerseId);
});

threadsChapterSelect.addEventListener("change", (e) => {
  threadsCurrentChapter = parseInt(e.target.value, 10);
  const firstVerse = verses.find(v => v.bookId === threadsCurrentBookId && v.ch === threadsCurrentChapter);
  if (firstVerse) selectedVerseId = firstVerse.id;
  renderThreadsChapter(true);
  if (selectedVerseId) selectVerse(selectedVerseId);
});

threadsReadingPane.addEventListener("scroll", () => {
  if (currentViewMode === "threads") {
    requestAnimationFrame(drawThreadsCanvas);
  }
}, { passive: true });

threadsCanvas.addEventListener("mousemove", (e) => {
  if (currentViewMode !== "threads") return;
  const rect = threadsCanvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const spineBarWidth = rect.width < 340 ? 8 : 10;
  const labelSpace = rect.width < 340 ? 60 : 75;
  const spineBarLeft = Math.max(90, rect.width - labelSpace - spineBarWidth);

  // If mouse is near or on the spine
  if (mouseX >= spineBarLeft - 10 && mouseX <= rect.width) {
    const seg = threadsSpineSegments.find(s => mouseY >= s.top && mouseY <= s.bottom);
    if (seg) {
      if (threadsHoveredSpineBook !== seg.name) {
        threadsHoveredSpineBook = seg.name;
        const count = countConnectionsToBookInCurrentChapter(seg.name);
        threadsSpineTooltip.style.display = "block";
        threadsSpineTooltip.style.left = `${mouseX}px`;
        threadsSpineTooltip.style.top = `${mouseY}px`;
        threadsSpineTooltip.textContent = t("threadsSpineTooltip", { name: seg.displayName, count });
        drawThreadsCanvas();
      } else {
        threadsSpineTooltip.style.left = `${mouseX}px`;
        threadsSpineTooltip.style.top = `${mouseY}px`;
      }
      return;
    }
  }

  if (threadsHoveredSpineBook !== null) {
    threadsHoveredSpineBook = null;
    threadsSpineTooltip.style.display = "none";
    drawThreadsCanvas();
  }
});

threadsCanvas.addEventListener("mouseleave", () => {
  if (threadsHoveredSpineBook !== null) {
    threadsHoveredSpineBook = null;
    threadsSpineTooltip.style.display = "none";
    drawThreadsCanvas();
  }
});

// Touch interactions for Threads Canvas Spine
threadsCanvas.addEventListener("touchstart", (e) => {
  if (currentViewMode !== "threads" || e.touches.length !== 1) return;
  const touch = e.touches[0];
  const rect = threadsCanvas.getBoundingClientRect();
  const mouseX = touch.clientX - rect.left;
  const mouseY = touch.clientY - rect.top;

  const spineBarWidth = rect.width < 340 ? 8 : 10;
  const labelSpace = rect.width < 340 ? 60 : 75;
  const spineBarLeft = Math.max(90, rect.width - labelSpace - spineBarWidth);

  if (mouseX >= spineBarLeft - 25 && mouseX <= rect.width) {
    const seg = threadsSpineSegments.find(s => mouseY >= s.top && mouseY <= s.bottom);
    if (seg) {
      threadsHoveredSpineBook = seg.name;
      const count = countConnectionsToBookInCurrentChapter(seg.name);
      threadsSpineTooltip.style.display = "block";
      threadsSpineTooltip.style.left = `${mouseX}px`;
      threadsSpineTooltip.style.top = `${mouseY - 32}px`;
      threadsSpineTooltip.textContent = t("threadsSpineTooltip", { name: seg.displayName, count });
      drawThreadsCanvas();
    }
  }
}, { passive: true });

threadsCanvas.addEventListener("touchend", () => {
  if (threadsHoveredSpineBook !== null) {
    threadsHoveredSpineBook = null;
    threadsSpineTooltip.style.display = "none";
    drawThreadsCanvas();
  }
});

// Share Card Generator button
if (shareCardBtn) {
  shareCardBtn.addEventListener("click", async () => {
    const verseObj = verses[selectedVerseId - 1];
    if (!verseObj) return;
    const bookObj = getBookForVerse(selectedVerseId);
    const connections = verseConnectionsMap.get(selectedVerseId) || { internal: [], external: [] };

    try {
      shareCardBtn.disabled = true;
      if (shareCardText) shareCardText.textContent = t("shareCardGenerating");

      await generateVerseCard({
        verseObj,
        connections,
        bookObj,
        currentFilter
      });

      if (shareCardText) {
        shareCardText.textContent = t("shareCardSuccess");
        setTimeout(() => {
          if (shareCardText) shareCardText.textContent = t("shareCard");
          shareCardBtn.disabled = false;
        }, 2200);
      }
    } catch (err) {
      console.error("Card generation failed:", err);
      if (shareCardText) {
        shareCardText.textContent = t("shareCard");
        shareCardBtn.disabled = false;
      }
    }
  });
}

// Back to Diagram / Reading button
if (backToDiagramBtn) {
  backToDiagramBtn.addEventListener("click", () => {
    if (currentViewMode === "threads" && threadsContainer) {
      threadsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (canvasWrapper) {
      canvasWrapper.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

// Tour controls navigation (book-aware)
prevConnBtn.addEventListener("click", () => {
  const activeBook = getActiveBook();
  const list = activeBook
    ? connectedVerseIdsList.filter(vid => vid >= activeBook.startVerseId && vid <= activeBook.endVerseId)
    : connectedVerseIdsList;
  if (list.length === 0) return;
  currentTourIndex = (currentTourIndex - 1 + list.length) % list.length;
  selectVerse(list[currentTourIndex]);
});

nextConnBtn.addEventListener("click", () => {
  const activeBook = getActiveBook();
  const list = activeBook
    ? connectedVerseIdsList.filter(vid => vid >= activeBook.startVerseId && vid <= activeBook.endVerseId)
    : connectedVerseIdsList;
  if (list.length === 0) return;
  currentTourIndex = (currentTourIndex + 1) % list.length;
  selectVerse(list[currentTourIndex]);
});

randomConnBtn.addEventListener("click", () => {
  const activeBook = getActiveBook();
  const list = activeBook
    ? connectedVerseIdsList.filter(vid => vid >= activeBook.startVerseId && vid <= activeBook.endVerseId)
    : connectedVerseIdsList;
  if (list.length === 0) return;
  currentTourIndex = Math.floor(Math.random() * list.length);
  selectVerse(list[currentTourIndex]);
});

// Native Touch Swipe Gestures for Mobile Exploration
function setupTouchSwipeNavigation() {
  function attachSwipe(el, onLeft, onRight) {
    if (!el) return;
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    el.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
    }, { passive: true });

    el.addEventListener("touchend", (e) => {
      if (e.changedTouches.length !== 1) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = endY - startY;
      const elapsed = Date.now() - startTime;

      // Threshold: horizontal swipe at least 45px, more horizontal than vertical, under 600ms
      if (elapsed < 600 && Math.abs(diffX) >= 45 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        const animClass = diffX < 0 ? "swipe-slide-left" : "swipe-slide-right";
        el.classList.remove("swipe-slide-left", "swipe-slide-right");
        void el.offsetWidth; // trigger reflow for smooth re-animation
        el.classList.add(animClass);
        setTimeout(() => el.classList.remove(animClass), 160);

        if (diffX < 0) {
          if (typeof onLeft === "function") onLeft();
        } else {
          if (typeof onRight === "function") onRight();
        }
      }
    }, { passive: true });
  }

  // 1. Swipe left/right on Study Panel / Verse Inspector to navigate connections
  if (studyPanel) {
    attachSwipe(
      studyPanel,
      () => nextConnBtn && nextConnBtn.click(),
      () => prevConnBtn && prevConnBtn.click()
    );
  }

  // 2. Swipe left/right on Threads Reading Pane to navigate chapters
  if (threadsReadingPane) {
    attachSwipe(
      threadsReadingPane,
      () => threadsNextChBtn && threadsNextChBtn.click(),
      () => threadsPrevChBtn && threadsPrevChBtn.click()
    );
  }
}

// URL state synchronization helper (keeps ?v= & ?lang= & ?view= in sync)
function syncURLParams() {
  if (typeof window === "undefined" || !window.history || !window.location) return;
  try {
    const url = new URL(window.location.href);
    if (selectedVerseId) {
      url.searchParams.set("v", selectedVerseId);
    }
    url.searchParams.set("lang", getLang());
    if (currentViewMode && currentViewMode !== "dual") {
      url.searchParams.set("view", currentViewMode);
    } else {
      url.searchParams.delete("view");
    }
    if (currentColorMode === "theme") {
      url.searchParams.set("color", "theme");
    } else {
      url.searchParams.delete("color");
    }
    window.history.replaceState(null, "", url.toString());
  } catch (e) {}
}

// Copy direct verse link button with fallback and user feedback
if (copyLinkBtn) {
  copyLinkBtn.addEventListener("click", async () => {
    syncURLParams();
  updateBookmarksUI();
    const shareUrl = window.location.href;
    const currentVerse = verses[selectedVerseId - 1];
    const shareTitle = currentVerse ? `${currentVerse.ref} | Book of Mormon Cross-References` : document.title;

    let copied = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        copied = true;
      } catch (e) {}
    }
    if (!copied && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl });
        copied = true;
      } catch (e) {}
    }

    copyLinkBtn.classList.add("copied");
    if (copyLinkText) copyLinkText.textContent = t("copyLinkSuccess");
    setTimeout(() => {
      copyLinkBtn.classList.remove("copied");
      if (copyLinkText) copyLinkText.textContent = t("copyLink");
    }, 2200);
  });
}

// HTML escape helper for secure snippet rendering
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Search input handling with dropdown list, keyword search, and keyboard navigation
let searchDebounceTimer = null;
let currentSearchResults = [];
let activeResultIndex = -1;

function hideSearchResults() {
  if (searchResultsDropdown) {
    searchResultsDropdown.style.display = "none";
    searchResultsDropdown.innerHTML = "";
  }
  if (searchClearBtn) {
    searchClearBtn.style.display = searchInput && searchInput.value.trim() ? "flex" : "none";
  }
  activeResultIndex = -1;
  currentSearchResults = [];
}

function updateActiveSearchResult() {
  if (!searchResultsDropdown) return;
  const items = searchResultsDropdown.querySelectorAll(".search-result-item");
  items.forEach((item, idx) => {
    const isActive = idx === activeResultIndex;
    item.classList.toggle("highlighted", isActive);
    if (isActive) {
      item.scrollIntoView({ block: "nearest" });
    }
  });
}

function highlightMatch(text, query) {
  if (!text || !query) return text || "";
  const trimmed = query.trim();
  if (!trimmed) return text;
  const regex = new RegExp(`(${trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

function renderSearchResults(results, query) {
  if (!searchResultsDropdown) return;
  currentSearchResults = results;
  activeResultIndex = -1;

  if (results.length === 0) {
    searchResultsDropdown.innerHTML = `
      <div class="search-no-results">
        ${t("noResultsFound", { q: escapeHtml(query) })}
      </div>
    `;
    searchResultsDropdown.style.display = "block";
    return;
  }

  const countLabel = results.length === 1
    ? t("searchResultsHeaderSingle")
    : t("searchResultsHeader", { n: results.length });
  const countHeader = `
    <div class="search-results-header">
      <span>${countLabel}</span>
      <span class="search-kbd-hint" style="opacity: 0.7; font-size: 0.68rem;">Esc / ↑ ↓ Enter</span>
    </div>
  `;

  const itemsHtml = results.map((v, idx) => {
    const book = getBookForVerse(v.id);
    const bookColor = book ? book.color : "#d4af37";
    const conns = verseConnectionsMap.get(v.id) || { internal: [], external: [] };
    const totalConns = conns.internal.length + conns.external.length;

    let snippet = v.text || "";
    if (snippet.length > 110) {
      const lower = snippet.toLowerCase();
      const qIndex = lower.indexOf(query.toLowerCase());
      if (qIndex > 35) {
        snippet = "..." + snippet.substring(qIndex - 20, qIndex + 80) + "...";
      } else {
        snippet = snippet.substring(0, 110) + "...";
      }
    }
    const snippetHtml = highlightMatch(escapeHtml(snippet), query);
    const connBadge = totalConns > 0
      ? `<span class="search-result-conn-badge">🔗 ${totalConns}</span>`
      : "";

    return `
      <div class="search-result-item" data-index="${idx}" data-verse-id="${v.id}" role="option">
        <div class="search-result-top">
          <span class="search-result-ref">
            <span class="search-result-ref-dot" style="background-color: ${bookColor}"></span>
            ${escapeHtml(v.ref)}
          </span>
          ${connBadge}
        </div>
        <div class="search-result-snippet">${snippetHtml}</div>
      </div>
    `;
  }).join("");

  searchResultsDropdown.innerHTML = countHeader + itemsHtml;
  searchResultsDropdown.style.display = "block";

  // Item click listeners
  searchResultsDropdown.querySelectorAll(".search-result-item").forEach(item => {
    item.addEventListener("click", () => {
      const vId = parseInt(item.dataset.verseId, 10);
      if (vId) {
        selectVerse(vId, true);
        hideSearchResults();
      }
    });
  });
}

function executeSearch(query) {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) {
    hideSearchResults();
    return;
  }

  // Accent-normalized query for seamless PT-BR and EN searching
  const normQ = q.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const results = [];
  const activeCorpus = verses;
  const secondaryCorpus = (versesEn && versesEn.length > 0 && verses !== versesEn) ? versesEn : [];

  const matchesNorm = (str) => {
    if (!str) return false;
    const norm = str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return norm.includes(normQ);
  };

  // 1. Reference matching (exact, prefix, partial)
  for (let i = 0; i < activeCorpus.length; i++) {
    const v = activeCorpus[i];
    const normRef = v.ref.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const shortRef = `${v.shortBook.toLowerCase()} ${v.ch}:${v.v}`;
    const normShort = shortRef.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (normRef === normQ || normShort === normQ) {
      results.unshift({ verse: v, score: 100 });
    } else if (normRef.startsWith(normQ) || normShort.startsWith(normQ)) {
      results.push({ verse: v, score: 80 });
    } else if (normRef.includes(normQ) || normShort.includes(normQ)) {
      results.push({ verse: v, score: 60 });
    }
    if (results.length >= 15) break;
  }

  // Fallback to secondary English corpus if active is PT and no ref found
  if (results.length === 0 && secondaryCorpus.length > 0) {
    for (let i = 0; i < secondaryCorpus.length; i++) {
      const v = secondaryCorpus[i];
      const normRef = v.ref.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const shortRef = `${v.shortBook.toLowerCase()} ${v.ch}:${v.v}`;
      const normShort = shortRef.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (normRef === normQ || normShort === normQ) {
        results.unshift({ verse: activeCorpus[v.id - 1] || v, score: 95 });
      } else if (normRef.startsWith(normQ) || normShort.startsWith(normQ)) {
        results.push({ verse: activeCorpus[v.id - 1] || v, score: 75 });
      }
      if (results.length >= 10) break;
    }
  }

  // 2. Keyword/text search in verse body (for queries >= 3 chars)
  if (results.length < 8 && q.length >= 3) {
    const seenIds = new Set(results.map(r => r.verse.id));
    for (let i = 0; i < activeCorpus.length; i++) {
      const v = activeCorpus[i];
      if (seenIds.has(v.id)) continue;
      if (matchesNorm(v.text)) {
        const conns = verseConnectionsMap.get(v.id) || { internal: [], external: [] };
        const totalConns = conns.internal.length + conns.external.length;
        // Prioritize verses that have cross-references!
        results.push({ verse: v, score: 30 + Math.min(totalConns * 4, 25) });
        seenIds.add(v.id);
        if (results.length >= 30) break;
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  const top = results.slice(0, 8).map(r => r.verse);

  renderSearchResults(top, q);
}

searchInput.addEventListener("input", (e) => {
  const val = e.target.value.trim();
  if (searchClearBtn) {
    searchClearBtn.style.display = val ? "flex" : "none";
  }
  clearTimeout(searchDebounceTimer);
  if (val.length < 2) {
    hideSearchResults();
    return;
  }
  searchDebounceTimer = setTimeout(() => {
    executeSearch(val);
  }, 220);
});

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    hideSearchResults();
    return;
  }

  if (searchResultsDropdown && searchResultsDropdown.style.display !== "none" && currentSearchResults.length > 0) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeResultIndex = (activeResultIndex + 1) % currentSearchResults.length;
      updateActiveSearchResult();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      activeResultIndex = (activeResultIndex - 1 + currentSearchResults.length) % currentSearchResults.length;
      updateActiveSearchResult();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const chosen = activeResultIndex >= 0 ? currentSearchResults[activeResultIndex] : currentSearchResults[0];
      if (chosen) {
        selectVerse(chosen.id, true);
        hideSearchResults();
      }
      return;
    }
  }

  if (e.key === "Enter") {
    clearTimeout(searchDebounceTimer);
    executeSearch(e.target.value);
  }
});

if (searchClearBtn) {
  searchClearBtn.addEventListener("click", () => {
    searchInput.value = "";
    hideSearchResults();
    searchInput.focus();
  });
}

document.addEventListener("click", (e) => {
  if (searchResultsDropdown && !e.target.closest("#searchBoxContainer")) {
    hideSearchResults();
  }
});

// Filter buttons (Connection Type: All / Internal / External)
filterBtns.forEach(btn => {
  if (!btn.dataset.filter) return;
  btn.addEventListener("click", () => {
    document.querySelectorAll(".btn-group[aria-label=\"Connection Type Filter\"] .filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    if (selectedVerseId) {
      selectVerse(selectedVerseId);
    } else {
      draw();
    }
  });
});

// Arc Color Mode Buttons (Books vs Themes)
if (btnColorBooks) {
  btnColorBooks.addEventListener("click", () => setColorMode("book"));
}
if (btnColorThemes) {
  btnColorThemes.addEventListener("click", () => setColorMode("theme"));
}

// Book selector (zooms in on chosen book)
bookSelect.addEventListener("change", (e) => {
  if (e.target.value === "all") {
    resetZoom();
  } else {
    zoomToBook(e.target.value);
  }
});

// Zoom Reset Button
zoomResetBtn.addEventListener("click", () => {
  resetZoom();
});

// How to Use Tutorial Modal Event Listeners
if (howToUseBtn) {
  howToUseBtn.addEventListener("click", openTutorialModal);
}
if (tutorialCloseBtn) {
  tutorialCloseBtn.addEventListener("click", closeTutorialModal);
}
if (tutorialDoneBtn) {
  tutorialDoneBtn.addEventListener("click", closeTutorialModal);
}
if (tutorialModal) {
  tutorialModal.addEventListener("click", (e) => {
    if (e.target === tutorialModal) closeTutorialModal();
  });
}
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && tutorialModal && tutorialModal.style.display !== "none") {
    closeTutorialModal();
  }
  if (e.key === "Escape" && comparisonModal && comparisonModal.style.display !== "none") {
    closeComparisonModal();
  }
  if (e.key === "Escape" && bookmarksModal && bookmarksModal.style.display !== "none") {
    closeBookmarksModal();
  }
});

// Comparison Modal Event Listeners
if (comparisonCloseBtn) {
  comparisonCloseBtn.addEventListener("click", closeComparisonModal);
}
if (comparisonModal) {
  comparisonModal.addEventListener("click", (e) => {
    if (e.target === comparisonModal) closeComparisonModal();
  });
}

// Bookmarks Event Listeners
if (bookmarksBtn) {
  bookmarksBtn.addEventListener("click", openBookmarksModal);
}
if (bookmarksCloseBtn) {
  bookmarksCloseBtn.addEventListener("click", closeBookmarksModal);
}
if (bookmarksModal) {
  bookmarksModal.addEventListener("click", (e) => {
    if (e.target === bookmarksModal) closeBookmarksModal();
  });
}
if (bookmarkVerseBtn) {
  bookmarkVerseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleBookmarkVerse(selectedVerseId);
  });
}
if (clearBookmarksBtn) {
  clearBookmarksBtn.addEventListener("click", clearAllBookmarks);
}
tutorialTabs.forEach((tab, idx) => {
  tab.addEventListener("click", () => {
    setTutorialTab(idx);
  });
});
if (tutorialPrevBtn) {
  tutorialPrevBtn.addEventListener("click", () => {
    setTutorialTab(currentTutorialTabIndex - 1);
  });
}
if (tutorialNextBtn) {
  tutorialNextBtn.addEventListener("click", () => {
    setTutorialTab(currentTutorialTabIndex + 1);
  });
}

// Topic selector
topicSelect.addEventListener("change", (e) => {
  activeTopicFilter = e.target.value;
  if (currentColorMode === "theme") {
    renderThemeLegendChips();
  }
  if (activeTopicFilter === "chiasmus") {
    selectVerse(3579, true); // Alma 36:18 (Center on Christ)
  } else if (activeTopicFilter === "formulas") {
    selectVerse(4810, true); // Helaman 12:1 ("And thus we see")
  } else if (activeTopicFilter === "hebraisms") {
    selectVerse(1, true); // 1 Nephi 1:1 (Ancient colophon)
  } else {
    draw();
  }
});

// Verse Text Box click to open on ChurchofJesusChrist.org
verseTextBox.addEventListener("click", () => {
  const currentVerse = verses[selectedVerseId - 1];
  const url = getChurchStudyUrl(currentVerse);
  if (url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
});

verseTextBox.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    const currentVerse = verses[selectedVerseId - 1];
    const url = getChurchStudyUrl(currentVerse);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }
});

// Language toggle button
langToggleBtn.addEventListener("click", () => {
  const newLang = getLang() === "en" ? "pt" : "en";
  setLang(newLang);
  updateUILanguage();
});

function updateUILanguage() {
  verses = getLang() === "pt" ? (versesPt.length ? versesPt : verses) : (versesEn.length ? versesEn : verses);
  document.getElementById("appTitle").textContent = t("title");
  document.getElementById("appSubtitle").textContent = t("subtitle");
  document.getElementById("badgeBooks").textContent = t("statsBooks");
  document.getElementById("badgeChapters").textContent = t("statsChapters");
  document.getElementById("badgeVerses").textContent = t("statsVerses");
  const btnFilterAll = document.getElementById("btnFilterAll");
  const btnFilterInternal = document.getElementById("btnFilterInternal");
  const btnFilterExternal = document.getElementById("btnFilterExternal");

  if (btnFilterAll) {
    btnFilterAll.textContent = t("filterAll");
    btnFilterAll.title = t("filterAllTooltip");
  }
  if (btnFilterInternal) {
    btnFilterInternal.textContent = t("filterInternal");
    btnFilterInternal.title = t("filterInternalTooltip");
  }
  if (btnFilterExternal) {
    btnFilterExternal.textContent = t("filterExternal");
    btnFilterExternal.title = t("filterExternalTooltip");
  }

  // Arc Color Mode translations
  if (labelColorBooks) labelColorBooks.textContent = t("colorModeBooks");
  if (labelColorThemes) labelColorThemes.textContent = t("colorModeThemes");
  if (btnColorBooks) btnColorBooks.title = t("colorModeBooksTooltip");
  if (btnColorThemes) btnColorThemes.title = t("colorModeThemesTooltip");
  if (themeLegendTitle) themeLegendTitle.textContent = t("themeLegendTitle");
  if (currentColorMode === "theme") renderThemeLegendChips();

  // Update topicSelect options text
  const topicSelect = document.getElementById("topicSelect");
  if (topicSelect) {
    const topicKeys = {
      "all": "allTopics",
      "prophecy": "topicProphecy",
      "christ": "topicChrist",
      "faith": "topicFaith",
      "isaiah": "topicIsaiah",
      "chiasmus": "topicChiasmus",
      "formulas": "topicFormulas",
      "hebraisms": "topicHebraisms"
    };
    Array.from(topicSelect.options).forEach(opt => {
      const k = topicKeys[opt.value];
      if (k) opt.textContent = t(k);
    });
  }

  populateBookSelect();
  document.getElementById("connectionsSectionTitle").textContent = t("connectionsHeader");
  document.getElementById("featuredLabel").innerHTML = `${icons.sparkles} ${t("featuredTitle")}`;
  document.getElementById("viewModeLabel").textContent = t("viewModeLabel");
  document.getElementById("labelViewDual").textContent = t("viewDual");
  document.getElementById("labelViewRadial").textContent = t("viewRadial");
  if (labelViewThreads) labelViewThreads.textContent = t("viewThreads");
  if (threadsPrevText) threadsPrevText.textContent = t("threadsPrevCh");
  if (threadsNextText) threadsNextText.textContent = t("threadsNextCh");
  if (threadsSpineHeaderTitle) threadsSpineHeaderTitle.textContent = t("threadsSpineTitle");
  const isCoarsePointer = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  if (threadsHoverHintText) threadsHoverHintText.textContent = t(isCoarsePointer ? "threadsHoverHintTouch" : "threadsHoverHint");
  const elMobileFiltersText = document.getElementById("mobileFiltersToggleText");
  if (elMobileFiltersText) elMobileFiltersText.textContent = t("mobileFiltersToggle");
  if (backToDiagramText) backToDiagramText.textContent = t("backToDiagram");
  if (shareCardText && (!shareCardBtn || !shareCardBtn.disabled)) {
    shareCardText.textContent = t("shareCard");
  }
  if (shareCardBtn) {
    shareCardBtn.title = t("shareCardTooltip");
  }
  if (copyLinkText && (!copyLinkBtn || !copyLinkBtn.classList.contains("copied"))) {
    copyLinkText.textContent = t("copyLink");
  }
  if (copyLinkBtn) {
    copyLinkBtn.title = t("copyLinkTooltip");
  }
  document.getElementById("bibleTopTitle").textContent = `📖 ${t("bibleTopTitle")}`;
  zoomResetText.textContent = t("zoomReset");
  prevConnBtn.querySelector(".tour-btn-text").textContent = t("prevBtn");
  nextConnBtn.querySelector(".tour-btn-text").textContent = t("nextBtn");
  randomConnBtn.querySelector("span").textContent = t("randomBtn");
  searchInput.placeholder = t("searchPlaceholder");
  langText.textContent = t("langToggle");

  // Tutorial Modal translations
  if (howToUseText) howToUseText.textContent = t("howToUseBtn");
  if (howToUseBtn) howToUseBtn.title = t("howToUseTooltip");
  const elTutorialModalTitle = document.getElementById("tutorialModalTitle");
  if (elTutorialModalTitle) elTutorialModalTitle.textContent = t("tutorialTitle");
  const elTutorialModalSubtitle = document.getElementById("tutorialModalSubtitle");
  if (elTutorialModalSubtitle) elTutorialModalSubtitle.textContent = t("tutorialSubtitle");
  const elTabDiagramsLabel = document.getElementById("tabDiagramsLabel");
  if (elTabDiagramsLabel) elTabDiagramsLabel.textContent = t("tutorialTabDiagrams");
  const elTabNavigationLabel = document.getElementById("tabNavigationLabel");
  if (elTabNavigationLabel) elTabNavigationLabel.textContent = t("tutorialTabNav");
  const elTabChiasmusLabel = document.getElementById("tabChiasmusLabel");
  if (elTabChiasmusLabel) elTabChiasmusLabel.textContent = t("tutorialTabChiasmus");
  const elTabCardsLabel = document.getElementById("tabCardsLabel");
  if (elTabCardsLabel) elTabCardsLabel.textContent = t("tutorialTabCards");

  const elCaptionBridge = document.getElementById("captionBridge");
  if (elCaptionBridge) elCaptionBridge.textContent = t("captionBridge");
  const elCaptionThreads = document.getElementById("captionThreads");
  if (elCaptionThreads) elCaptionThreads.textContent = t("captionThreads");
  const elCaptionChiasmus = document.getElementById("captionChiasmus");
  if (elCaptionChiasmus) elCaptionChiasmus.textContent = t("captionChiasmus");
  const elCaptionCard = document.getElementById("captionCard");
  if (elCaptionCard) elCaptionCard.textContent = t("captionCard");

  const elTutoDiagramsTitle = document.getElementById("tutoDiagramsTitle");
  if (elTutoDiagramsTitle) elTutoDiagramsTitle.textContent = t("tutoDiagramsTitle");
  const elTutoBridgeDesc = document.getElementById("tutoBridgeDesc");
  if (elTutoBridgeDesc) elTutoBridgeDesc.textContent = t("tutoBridgeDesc");
  const elTutoRadialDesc = document.getElementById("tutoRadialDesc");
  if (elTutoRadialDesc) elTutoRadialDesc.textContent = t("tutoRadialDesc");
  const elTutoThreadsDesc = document.getElementById("tutoThreadsDesc");
  if (elTutoThreadsDesc) elTutoThreadsDesc.textContent = t("tutoThreadsDesc");

  const elTutoNavTitle = document.getElementById("tutoNavTitle");
  if (elTutoNavTitle) elTutoNavTitle.textContent = t("tutoNavTitle");
  const elTutoSearchDesc = document.getElementById("tutoSearchDesc");
  if (elTutoSearchDesc) elTutoSearchDesc.innerHTML = t("tutoSearchDesc");
  const elTutoScopeDesc = document.getElementById("tutoScopeDesc");
  if (elTutoScopeDesc) elTutoScopeDesc.innerHTML = t("tutoScopeDesc");
  const elTutoZoomDesc = document.getElementById("tutoZoomDesc");
  if (elTutoZoomDesc) elTutoZoomDesc.innerHTML = t("tutoZoomDesc");
  const elTutoPillsDesc = document.getElementById("tutoPillsDesc");
  if (elTutoPillsDesc) elTutoPillsDesc.innerHTML = t("tutoPillsDesc");

  const elTutoChiasmusTitle = document.getElementById("tutoChiasmusTitle");
  if (elTutoChiasmusTitle) elTutoChiasmusTitle.textContent = t("tutoChiasmusTitle");
  const elTutoChiasmusDesc = document.getElementById("tutoChiasmusDesc");
  if (elTutoChiasmusDesc) elTutoChiasmusDesc.textContent = t("tutoChiasmusDesc");
  const elTutoTreeDesc = document.getElementById("tutoTreeDesc");
  if (elTutoTreeDesc) elTutoTreeDesc.textContent = t("tutoTreeDesc");
  const elTutoFormulasDesc = document.getElementById("tutoFormulasDesc");
  if (elTutoFormulasDesc) elTutoFormulasDesc.textContent = t("tutoFormulasDesc");
  const elTutoHebraismsDesc = document.getElementById("tutoHebraismsDesc");
  if (elTutoHebraismsDesc) elTutoHebraismsDesc.textContent = t("tutoHebraismsDesc");

  const elTutoCardsTitle = document.getElementById("tutoCardsTitle");
  if (elTutoCardsTitle) elTutoCardsTitle.textContent = t("tutoCardsTitle");
  const elTutoCardsDesc = document.getElementById("tutoCardsDesc");
  if (elTutoCardsDesc) elTutoCardsDesc.textContent = t("tutoCardsDesc");
  const elTutoChurchDesc = document.getElementById("tutoChurchDesc");
  if (elTutoChurchDesc) elTutoChurchDesc.textContent = t("tutoChurchDesc");
  const elTutoShareDesc = document.getElementById("tutoShareDesc");
  if (elTutoShareDesc) elTutoShareDesc.innerHTML = t("tutoShareDesc");

  const tutoLabelIds = [
    "tutoBridgeLabel", "tutoRadialLabel", "tutoThreadsLabel",
    "tutoSearchLabel", "tutoScopeLabel", "tutoZoomLabel", "tutoPillsLabel",
    "tutoChiasmusLabel", "tutoTreeLabel", "tutoFormulasLabel", "tutoHebraismsLabel",
    "tutoCardsLabel", "tutoChurchLabel", "tutoShareLabel"
  ];
  tutoLabelIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(id);
  });

  const elTutorialPrevText = document.getElementById("tutorialPrevText");
  if (elTutorialPrevText) elTutorialPrevText.textContent = t("tutorialPrev");
  const elTutorialNextText = document.getElementById("tutorialNextText");
  if (elTutorialNextText) elTutorialNextText.textContent = t("tutorialNext");
  const elTutorialDoneText = document.getElementById("tutorialDoneText");
  if (elTutorialDoneText) elTutorialDoneText.textContent = t("tutorialDone");

  // Comparison Modal translations
  if (comparisonModalTitle) comparisonModalTitle.textContent = `⚖️ ${t("comparisonModalTitle")}`;
  if (comparisonModalSubtitle) comparisonModalSubtitle.textContent = t("comparisonModalSubtitle");
  if (comparisonBomTag) comparisonBomTag.textContent = t("comparisonBomHeader");
  if (comparisonBibleTag) comparisonBibleTag.textContent = t("comparisonBibleHeader");
  if (comparisonNoteTitle) comparisonNoteTitle.textContent = t("comparisonConnectionHeader");
  if (comparisonBomChurchText) comparisonBomChurchText.textContent = t("readOnOfficial");
  if (comparisonBibleChurchText) comparisonBibleChurchText.textContent = t("readBibleFullChapter");

  // Bookmarks translations
  if (bookmarksBtnText) bookmarksBtnText.textContent = t("bookmarksBtn");
  if (bookmarksBtn) bookmarksBtn.title = t("bookmarksTooltip");
  if (bookmarksModalTitle) bookmarksModalTitle.textContent = t("bookmarksModalTitle");
  if (bookmarksModalSubtitle) bookmarksModalSubtitle.textContent = t("bookmarksModalSubtitle");
  if (clearBookmarksText) clearBookmarksText.textContent = t("bookmarksClearAll");
  const elFooterCredits = document.getElementById("footerCredits");
  if (elFooterCredits) elFooterCredits.innerHTML = t("footerCredits");
  updateBookmarksUI();
  if (bookmarksModal && bookmarksModal.style.display !== "none") {
    renderBookmarksList();
  }

  renderAxis();
  renderFeaturedPills();
  if (currentViewMode === "threads") {
    renderThreadsChapter(false);
  }
  if (selectedVerseId) {
    selectVerse(selectedVerseId);
  }
}

// Responsive resize with debounce & requestAnimationFrame
let resizeDebounceTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeDebounceTimer);
  resizeDebounceTimer = setTimeout(() => {
    requestAnimationFrame(() => {
      if (currentViewMode === "threads") {
        drawThreadsCanvas();
      } else {
        setupCanvas();
      }
    });
  }, 100);
});

// User-facing network error display
function showDataLoadError(err) {
  if (!canvasWrapper) return;
  const isPt = getLang() === "pt";
  const title = isPt ? "Não foi possível carregar os dados das escrituras" : "Unable to load scripture data";
  const desc = isPt ? "Verifique sua conexão com a internet ou tente recarregar." : "Please check your network connection or try reloading.";
  const retryText = isPt ? "Tentar Novamente" : "Retry";

  canvasWrapper.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px;text-align:center;padding:2rem;color:#f1f5f9;gap:1rem;">
      <div style="font-size:2rem;" aria-hidden="true">⚠️</div>
      <h3 style="font-size:1.15rem;font-weight:700;margin:0;">${title}</h3>
      <p style="color:#94a3b8;font-size:0.875rem;margin:0;max-width:420px;">${desc}</p>
      <button onclick="window.location.reload()" style="background:#f59e0b;color:#090e1a;font-weight:600;padding:0.6rem 1.25rem;border-radius:8px;border:none;cursor:pointer;font-size:0.85rem;margin-top:0.5rem;">${retryText}</button>
    </div>
  `;
}

// Initial Data Load
async function init() {
  try {
    const dataBase = (import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : "./";
    const dataPrefix = dataBase.endsWith("/") ? dataBase : (dataBase + "/");
    const responses = await Promise.all([
      fetch(`${dataPrefix}data/books.json`),
      fetch(`${dataPrefix}data/cross_references.json`),
      fetch(`${dataPrefix}data/external_references.json`),
      fetch(`${dataPrefix}data/verses_en.json`),
      fetch(`${dataPrefix}data/verses_pt.json`),
      fetch(`${dataPrefix}data/literary_structures.json`),
      fetch(`${dataPrefix}data/external_verses.json`)
    ]);

    for (const res of responses) {
      if (!res.ok) {
        throw new Error(`Failed to load ${res.url}: HTTP ${res.status}`);
      }
    }

    const [booksRes, internalRes, externalRes, versesEnRes, versesPtRes, structuresRes, extVersesRes] = responses;
    books = await booksRes.json();
    internalLinks = await internalRes.json();
    externalLinks = await externalRes.json();
    versesEn = await versesEnRes.json();
    versesPt = await versesPtRes.json();
    verses = getLang() === "pt" ? versesPt : versesEn;
    literaryStructures = await structuresRes.json();
    externalVerses = await extVersesRes.json();

    // Precompute topic sets on all links for zero-alloc hot loop rendering
    internalLinks.forEach(computeLinkTopics);
    externalLinks.forEach(computeLinkTopics);

    // Populate verseStructuresMap
    literaryStructures.forEach(struct => {
      (struct.verseIds || []).forEach(vid => {
        if (!verseStructuresMap.has(vid)) {
          verseStructuresMap.set(vid, []);
        }
        verseStructuresMap.get(vid).push(struct);
      });
    });

    // Dynamically resolve verseId & targetId for all featured connections!
    FEATURED_CONNECTIONS.forEach(item => {
      const vSrc = versesEn.find(v => v.ref === item.srcRef);
      if (vSrc) item.verseId = vSrc.id;
      if (item.tgtRef) {
        const vTgt = versesEn.find(v => v.ref === item.tgtRef);
        if (vTgt) item.targetId = vTgt.id;
      }
    });

    // Populate index map
    for (let i = 1; i <= 6604; i++) {
      verseConnectionsMap.set(i, { internal: [], external: [] });
    }

    internalLinks.forEach(link => {
      if (verseConnectionsMap.has(link.source)) {
        verseConnectionsMap.get(link.source).internal.push(link);
      }
      if (verseConnectionsMap.has(link.target)) {
        verseConnectionsMap.get(link.target).internal.push(link);
      }
    });

    externalLinks.forEach(link => {
      if (verseConnectionsMap.has(link.source)) {
        verseConnectionsMap.get(link.source).external.push(link);
      }
    });

    // Build sorted list of connected verse IDs
    const connectedSet = new Set();
    verseConnectionsMap.forEach((conns, vid) => {
      if (conns.internal.length > 0 || conns.external.length > 0) {
        connectedSet.add(vid);
      }
    });
    connectedVerseIdsList = Array.from(connectedSet).sort((a, b) => a - b);

    // Ensure document lang matches current language
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.lang = getLang();
    }

    populateBookSelect();
    renderAxis();
    renderFeaturedPills();
    setupCanvas();

    // 1. Check URL parameters first so direct link sharing is honored before UI render
    const urlParams = new URLSearchParams(window.location.search);
    const paramView = urlParams.get("view");
    const paramBook = urlParams.get("book");
    const paramVerse = urlParams.get("v") || urlParams.get("verse");
    const paramColor = urlParams.get("color");

    if (paramColor === "theme") {
      currentColorMode = "theme";
      if (btnColorBooks && btnColorThemes) {
        btnColorBooks.classList.toggle("active", false);
        btnColorThemes.classList.toggle("active", true);
      }
      if (themeLegendBar) {
        themeLegendBar.style.display = "flex";
        renderThemeLegendChips();
      }
    }

    if (paramView === "radial") {
      viewBtns.forEach(b => b.classList.toggle("active", b.dataset.view === "radial"));
      currentViewMode = "radial";
      dualTopLabelRow.style.display = "none";
      dualBottomLabelRow.style.display = "none";
      axisContainer.style.display = "none";
    } else if (paramView === "threads") {
      viewBtns.forEach(b => b.classList.toggle("active", b.dataset.view === "threads"));
      currentViewMode = "threads";
      canvasWrapper.style.display = "none";
      threadsContainer.style.display = "flex";
      renderThreadsChapter(true);
    }

    let initialVerseId = 1;
    if (paramVerse) {
      const vNum = parseInt(paramVerse, 10);
      if (vNum && vNum >= 1 && vNum <= 6604) {
        initialVerseId = vNum;
      }
    }
    selectedVerseId = initialVerseId;

    if (getLang() === "pt") {
      updateUILanguage();
    } else {
      selectVerse(initialVerseId);
    }

    if (paramBook) {
      zoomToBook(paramBook);
    }

    updateBookmarksUI();
    setupTouchSwipeNavigation();

    const mobileFiltersToggleBtn = document.getElementById("mobileFiltersToggleBtn");
    const filterGroupEl = document.getElementById("filterGroup");
    if (mobileFiltersToggleBtn && filterGroupEl) {
      mobileFiltersToggleBtn.addEventListener("click", () => {
        const isOpen = filterGroupEl.classList.toggle("is-open");
        mobileFiltersToggleBtn.setAttribute("aria-expanded", String(isOpen));
      });
    }

    console.log(`Loaded ${connectedVerseIdsList.length} connected verses successfully.`);
  } catch (err) {
    console.error("Error loading scripture data:", err);
    showDataLoadError(err);
  }
}

init();

// Register Service Worker for Progressive Web App (PWA) offline capabilities
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").then((reg) => {
      console.log("PWA Service Worker registered:", reg.scope);
    }).catch((err) => {
      console.warn("PWA Service Worker registration skipped or failed:", err);
    });
  });
}
