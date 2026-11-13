import { t, getLang, setLang, getBookDisplayName } from "./i18n.js";
import { icons } from "./icons.js";
import { generateVerseCard } from "./shareCard.js";

// State
let books = [];
let verses = [];
let internalLinks = [];
let externalLinks = [];
let currentTourIndex = 0;
let verseConnectionsMap = new Map(); // verseId -> { internal: [], external: [] }
let connectedVerseIdsList = []; // sorted array of IDs that have >= 1 connection

let currentViewMode = "dual"; // "dual" | "radial" | "threads"
let selectedVerseId = 4876; // Default to Helaman 14:2 (Samuel the Lamanite's Sign)
let hoveredVerseId = null;
let hoveredBookId = null;
let currentFilter = "all"; // "all" | "internal" | "external"
let activeBookFilter = "all";
let activeTopicFilter = "all";

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
  { name: "Isaiah", short: "Isa (525 refs)", color: "#fbbf24", pos: 0.40, weight: 2.5 },
  { name: "Jeremiah", short: "Jer", color: "#d97706", pos: 0.48 },
  { name: "Ezekiel", short: "Ezek", color: "#d97706", pos: 0.52 },
  { name: "Micah", short: "Mic", color: "#d97706", pos: 0.56 },
  { name: "Malachi", short: "Mal", color: "#f59e0b", pos: 0.60 },
  // New Testament
  { name: "Matthew", short: "Matt (113 refs)", color: "#10b981", pos: 0.68, weight: 2.0 },
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
const CHURCH_BOOK_SLUGS = {
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
};

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
const backToDiagramBtn = document.getElementById("backToDiagramBtn");
const backToDiagramText = document.getElementById("backToDiagramText");

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

// Snapping for horizontal axes (zoomed book aware)
function findNearestConnectedVerse(mouseX, pixelTolerance = 25) {
  const activeBook = getActiveBook();
  const relevantVerseIds = activeBook
    ? connectedVerseIdsList.filter(vid => vid >= activeBook.startVerseId && vid <= activeBook.endVerseId)
    : connectedVerseIdsList;

  if (relevantVerseIds.length === 0) return xToVerse(mouseX);

  let bestId = null;
  let minDiff = Infinity;

  for (const vid of relevantVerseIds) {
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
  BIBLE_BOOKS.forEach(b => {
    const bx = PADDING_X + b.pos * usableWidth;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(bx, topY, b.weight ? 3.5 : 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = b.color;
    ctx.font = b.weight ? "bold 10px Inter, sans-serif" : "9px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(b.short, bx, topY - 12);
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

      const isConnectedToActive = (link.source === activeVerse);
      const xBom = verseToX(link.source);
      const xBible = getBibleBookX(link.externalRef, rect.width, PADDING_X);

      ctx.beginPath();
      ctx.moveTo(xBom, bottomY);
      const midY = (topY + bottomY) / 2;
      ctx.bezierCurveTo(xBom, midY + 40, xBible, midY - 40, xBible, topY);

      if (isConnectedToActive) {
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 3.2;
        ctx.shadowColor = "rgba(245, 158, 11, 0.9)";
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(xBible, topY, 5.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (activeVerse) {
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = activeBook ? 1.0 : 0.6;
        ctx.globalAlpha = activeBook ? 0.20 : 0.05;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      } else {
        ctx.strokeStyle = "rgba(16, 185, 129, 0.35)";
        ctx.lineWidth = activeBook ? 1.2 : 0.9;
        ctx.stroke();
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
      const baseColor = sourceBook ? sourceBook.color : "#6366f1";

      ctx.beginPath();
      ctx.moveTo(x1, bottomY);
      ctx.quadraticCurveTo(cx, cy, x2, bottomY);

      if (isConnectedToActive) {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2.8;
        ctx.shadowColor = "rgba(56, 189, 248, 0.85)";
        ctx.shadowBlur = 12;
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
        ctx.globalAlpha = 0.4;
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
        ctx.fillText(`Ch ${ch.chapter}`, lx, ly);
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
    books.forEach(b => {
      const a1 = verseAngle(b.startVerseId);
      const a2 = verseAngle(b.endVerseId);

      ctx.strokeStyle = b.color;
      ctx.lineWidth = (hoveredBookId && hoveredBookId.id === b.id) ? 14 : 9;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, a1, a2);
      ctx.stroke();

      const midAngle = (a1 + a2) / 2;
      const labelR = outerR + 18;
      const lx = cx + labelR * Math.cos(midAngle);
      const ly = cy + labelR * Math.sin(midAngle);

      ctx.fillStyle = b.color;
      ctx.font = "bold 9.5px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(b.shortName, lx, ly);
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
    const baseColor = sourceBook ? sourceBook.color : "#6366f1";

    if (isConnectedToActive) {
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.8;
      ctx.shadowColor = "rgba(56, 189, 248, 0.85)";
      ctx.shadowBlur = 14;
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
      ctx.globalAlpha = 0.35;
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
    ctx.fillText(`${total} Connections`, cx, cy + 8);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "9.5px Inter, sans-serif";
    ctx.fillText(activeBook ? `${activeBook.name} (${activeBook.chaptersCount} Ch)` : (vObj ? vObj.book : "The Book of Mormon"), cx, cy + 24);

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
    threadsSpineSegments.push({
      name: b.name,
      short: b.short,
      displayName: b.name,
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
      short: b.shortName || b.name,
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
  threadsCanvas.width = width * dpr;
  threadsCanvas.height = height * dpr;
  threadsCtx.setTransform(1, 0, 0, 1, 0, 0);
  threadsCtx.scale(dpr, dpr);

  threadsCtx.clearRect(0, 0, width, height);

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
        color: targetBook.color || "#38bdf8",
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
        color: "#10b981", // Emerald green for Bible
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
  while (bookSelect.options.length > 1) {
    bookSelect.remove(1);
  }
  books.forEach(b => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = `${b.name} (${b.chaptersCount} ch)`;
    bookSelect.appendChild(opt);
  });
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
      pill.textContent = b.shortName;
      pill.style.borderBottom = `2px solid ${b.color}`;
      pill.title = `Zoom into ${b.name}`;
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
  if (tourIdx !== -1) {
    currentTourIndex = tourIdx;
    connCounterBadge.textContent = activeBook
      ? `${currentTourIndex + 1} / ${relevantList.length} in ${activeBook.shortName}`
      : `${currentTourIndex + 1} / ${connectedVerseIdsList.length}`;
  } else {
    connCounterBadge.textContent = activeBook
      ? `${relevantList.length} in ${activeBook.shortName}`
      : `${connectedVerseIdsList.length} Connected`;
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
    selectedVerseBadge.textContent = book ? book.name : "Scripture";
    selectedVerseBadge.style.borderColor = book ? `${book.color}80` : "";
    selectedVerseBadge.style.color = book ? book.color : "";

    verseTextBox.textContent = `"${verseObj.text}"`;

    // Official Church of Jesus Christ of Latter-day Saints study URL
    const slug = CHURCH_BOOK_SLUGS[verseObj.book];
    if (slug) {
      officialLinkContainer.style.display = "block";
      const langParam = getLang() === "pt" ? "por" : "eng";
      officialLink.href = `https://www.churchofjesuschrist.org/study/scriptures/bofm/${slug}/${verseObj.ch}?lang=${langParam}#${verseObj.v}`;
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

      const card = document.createElement("div");
      card.className = "connection-card";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", `${t("jumpTo")} ${targetRefStr}`);
      card.innerHTML = `
        <div class="connection-left">
          <div class="connection-title">${icons.link} ${targetRefStr}</div>
          ${link.note ? `<div class="connection-note">${link.note}</div>` : ""}
        </div>
        <span class="tag tag-internal">${link.type || "Parallel"}</span>
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
      card.className = `connection-card ${studyUrl ? "connection-card-external" : ""}`;

      if (studyUrl) {
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");
        const tooltipText = getLang() === "pt"
          ? `Abrir ${link.externalRef} em ChurchofJesusChrist.org ↗`
          : `Open ${link.externalRef} on ChurchofJesusChrist.org ↗`;
        card.setAttribute("title", tooltipText);
        card.setAttribute("aria-label", tooltipText);
        card.addEventListener("click", () => {
          window.open(studyUrl, "_blank", "noopener,noreferrer");
        });
        card.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            window.open(studyUrl, "_blank", "noopener,noreferrer");
          }
        });
      } else {
        card.style.cursor = "default";
      }

      card.innerHTML = `
        <div class="connection-left">
          <div class="connection-title">
            ${icons.bookOpen} ${link.externalRef} (${link.externalWork || "Bible"})
            ${studyUrl ? `<span class="external-link-hint" aria-hidden="true">${icons.externalLink}</span>` : ""}
          </div>
          ${link.note ? `<div class="connection-note">${link.note}</div>` : ""}
        </div>
        <span class="tag tag-external">${link.type || "Biblical Reference"}</span>
      `;
      connectionsList.appendChild(card);
    });
  }

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

  // Auto-scroll to Study Panel when user explicitly clicks/selects a verse
  if (shouldScroll) {
    setTimeout(() => {
      scrollToStudyPanel();
    }, 120);
  }
}

// Mouse events on canvas with mode-aware coordinates
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  let vId = null;

  if (currentViewMode === "radial") {
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dist = Math.sqrt((mouseX - cx) ** 2 + (mouseY - cy) ** 2);
    const outerR = Math.min(rect.width, rect.height) * 0.42;

    if (dist >= outerR * 0.25 && dist <= outerR * 1.25) {
      const angle = Math.atan2(mouseY - cy, mouseX - cx);
      vId = radialToVerse(angle);
    }
  } else {
    if (mouseX >= PADDING_X && mouseX <= PADDING_X + usableWidth) {
      vId = findNearestConnectedVerse(mouseX, 18);
    }
  }

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

  if (currentViewMode === "radial") {
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dist = Math.sqrt((mouseX - cx) ** 2 + (mouseY - cy) ** 2);
    const outerR = Math.min(rect.width, rect.height) * 0.42;

    if (dist >= outerR * 0.25 && dist <= outerR * 1.25) {
      const angle = Math.atan2(mouseY - cy, mouseX - cx);
      const vId = radialToVerse(angle);
      selectVerse(vId, true);
    }
  } else {
    if (mouseX >= PADDING_X && mouseX <= PADDING_X + usableWidth) {
      const vId = findNearestConnectedVerse(mouseX, 20);
      selectVerse(vId, true);
    }
  }
});

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

// Search input handling
searchInput.addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  if (!q) return;

  const matchedVerse = verses.find(v => v.ref.toLowerCase().includes(q) || `${v.shortBook.toLowerCase()} ${v.ch}:${v.v}`.includes(q));
  if (matchedVerse) {
    selectVerse(matchedVerse.id);
  }
});

// Filter buttons
filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    if (selectedVerseId) {
      selectVerse(selectedVerseId);
    } else {
      draw();
    }
  });
});

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

// Topic selector
topicSelect.addEventListener("change", (e) => {
  activeTopicFilter = e.target.value;
  draw();
});

// Language toggle button
langToggleBtn.addEventListener("click", () => {
  const newLang = getLang() === "en" ? "pt" : "en";
  setLang(newLang);
  updateUILanguage();
});

function updateUILanguage() {
  document.getElementById("appTitle").textContent = t("title");
  document.getElementById("appSubtitle").textContent = t("subtitle");
  document.getElementById("badgeBooks").textContent = t("statsBooks");
  document.getElementById("badgeChapters").textContent = t("statsChapters");
  document.getElementById("badgeVerses").textContent = t("statsVerses");
  document.getElementById("btnFilterAll").textContent = t("filterAll");
  document.getElementById("btnFilterInternal").textContent = t("filterInternal");
  document.getElementById("btnFilterExternal").textContent = t("filterExternal");
  document.getElementById("connectionsSectionTitle").textContent = t("drawerTitle");
  document.getElementById("featuredLabel").innerHTML = `${icons.sparkles} ${t("featuredTitle")}`;
  document.getElementById("viewModeLabel").textContent = t("viewModeLabel");
  document.getElementById("labelViewDual").textContent = t("viewDual");
  document.getElementById("labelViewRadial").textContent = t("viewRadial");
  if (labelViewThreads) labelViewThreads.textContent = t("viewThreads");
  if (threadsPrevText) threadsPrevText.textContent = t("threadsPrevCh");
  if (threadsNextText) threadsNextText.textContent = t("threadsNextCh");
  if (threadsSpineHeaderTitle) threadsSpineHeaderTitle.textContent = t("threadsSpineTitle");
  if (threadsHoverHintText) threadsHoverHintText.textContent = t("threadsHoverHint");
  if (backToDiagramText) backToDiagramText.textContent = t("backToDiagram");
  if (shareCardText && (!shareCardBtn || !shareCardBtn.disabled)) {
    shareCardText.textContent = t("shareCard");
  }
  if (shareCardBtn) {
    shareCardBtn.title = t("shareCardTooltip");
  }
  document.getElementById("bibleTopTitle").textContent = `📖 ${t("bibleTopTitle")}`;
  zoomResetText.textContent = t("zoomReset");
  prevConnBtn.querySelector(".tour-btn-text").textContent = t("prevBtn");
  nextConnBtn.querySelector(".tour-btn-text").textContent = t("nextBtn");
  randomConnBtn.querySelector("span").textContent = t("randomBtn");
  searchInput.placeholder = t("searchPlaceholder");
  langText.textContent = t("langToggle");

  renderAxis();
  renderFeaturedPills();
  if (currentViewMode === "threads") {
    renderThreadsChapter(false);
  }
  if (selectedVerseId) {
    selectVerse(selectedVerseId);
  }
}

// Responsive resize
window.addEventListener("resize", () => {
  if (currentViewMode === "threads") {
    drawThreadsCanvas();
  } else {
    setupCanvas();
  }
});

// Initial Data Load
async function init() {
  try {
    const [booksRes, internalRes, externalRes, versesRes] = await Promise.all([
      fetch("/data/books.json"),
      fetch("/data/cross_references.json"),
      fetch("/data/external_references.json"),
      fetch("/data/verses_en.json")
    ]);

    books = await booksRes.json();
    internalLinks = await internalRes.json();
    externalLinks = await externalRes.json();
    verses = await versesRes.json();

    // Dynamically resolve verseId & targetId for all featured connections!
    FEATURED_CONNECTIONS.forEach(item => {
      const vSrc = verses.find(v => v.ref === item.srcRef);
      if (vSrc) item.verseId = vSrc.id;
      if (item.tgtRef) {
        const vTgt = verses.find(v => v.ref === item.tgtRef);
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

    populateBookSelect();
    renderAxis();
    renderFeaturedPills();
    setupCanvas();

    // Check URL parameters for direct link sharing
    const urlParams = new URLSearchParams(window.location.search);
    const paramView = urlParams.get("view");
    const paramBook = urlParams.get("book");

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

    if (paramBook) {
      zoomToBook(paramBook);
    } else {
      // Select the first featured connection (Helaman 14:2)
      selectVerse(FEATURED_CONNECTIONS[0].verseId || 4876);
    }

    console.log(`Loaded ${connectedVerseIdsList.length} connected verses successfully.`);
  } catch (err) {
    console.error("Error loading scripture data:", err);
  }
}

init();
