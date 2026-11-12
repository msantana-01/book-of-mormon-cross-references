import { t, getLang, setLang } from "./i18n.js";
import { icons } from "./icons.js";

// State
let books = [];
let verses = [];
let internalLinks = [];
let externalLinks = [];
let currentTourIndex = 0;
let verseConnectionsMap = new Map(); // verseId -> { internal: [], external: [] }
let connectedVerseIdsList = []; // sorted array of IDs that have >= 1 connection

let currentViewMode = "dual"; // "dual" | "radial" | "classic"
let selectedVerseId = 142; // Default to 1 Nephi 3:7 ("I will go and do...")
let hoveredVerseId = null;
let hoveredBookId = null;
let currentFilter = "all"; // "all" | "internal" | "external"
let activeBookFilter = "all";
let activeTopicFilter = "all";

// Curated Key Connections for 1-Click Exploration
const FEATURED_CONNECTIONS = [
  {
    id: "samuel-prophecy",
    titleEn: "Samuel's Sign → 3 Nephi Fulfilled",
    titlePt: "Sinal de Samuel → 3 Néfi Cumprido",
    tagEn: "Prophecy",
    tagPt: "Profecia",
    verseId: 4897, // Helaman 14:2
    targetId: 4962  // 3 Nephi 1:15
  },
  {
    id: "iron-rod",
    titleEn: "The Iron Rod & Tree of Life",
    titlePt: "A Barra de Ferro & Árvore da Vida",
    tagEn: "Typology",
    tagPt: "Tipologia",
    verseId: 198,   // 1 Nephi 8:19
    targetId: 288   // 1 Nephi 11:25
  },
  {
    id: "alma-conversion",
    titleEn: "Alma's Repentance & Grace",
    titlePt: "Conversão & Graça de Alma",
    tagEn: "Parallel",
    tagPt: "Paralelo",
    verseId: 2395,  // Mosiah 27:24
    targetId: 3543  // Alma 36:18
  },
  {
    id: "abinadi-noah",
    titleEn: "Abinadi's Prophecy on King Noah",
    titlePt: "Profecia de Abinádi sobre o Rei Noé",
    tagEn: "Fulfillment",
    tagPt: "Cumprimento",
    verseId: 2110,  // Mosiah 17:15
    targetId: 2157  // Mosiah 19:20
  },
  {
    id: "christ-appearance",
    titleEn: "Christ Appears in the Americas",
    titlePt: "Aparição de Cristo nas Américas",
    tagEn: "Prophecy",
    tagPt: "Profecia",
    verseId: 1198,  // 2 Nephi 26:1
    targetId: 5211  // 3 Nephi 11:8
  },
  {
    id: "sermon-mount",
    titleEn: "Sermon on the Mount in 3 Nephi",
    titlePt: "Sermão da Montanha em 3 Néfi",
    tagEn: "Bible Quoted",
    tagPt: "Citação Bíblica",
    verseId: 5240,  // 3 Nephi 12:3
    targetId: null
  },
  {
    id: "moroni-farewell",
    titleEn: "Moroni's Final Exhortation",
    titlePt: "Exortação Final de Morôni",
    tagEn: "Doctrine",
    tagPt: "Doutrina",
    verseId: 6008,  // Mormon 9:37
    targetId: 6444  // Moroni 10:3
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
  // Default fallback middle
  return paddingX + 0.5 * usable;
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

// DOM Elements
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

const dualTopLabelRow = document.getElementById("dualTopLabelRow");
const dualBottomLabelRow = document.getElementById("dualBottomLabelRow");
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

// Layout constants
const PADDING_X = 26;
let usableWidth = 0;
let canvasHeight = 0;

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
  return PADDING_X + ((verseId - 1) / 6603) * usableWidth;
}

function xToVerse(x) {
  const clampedX = Math.max(PADDING_X, Math.min(PADDING_X + usableWidth, x));
  const ratio = (clampedX - PADDING_X) / usableWidth;
  return Math.max(1, Math.min(6604, Math.round(ratio * 6603) + 1));
}

// Snapping for horizontal axes
function findNearestConnectedVerse(mouseX, pixelTolerance = 20) {
  if (connectedVerseIdsList.length === 0) return xToVerse(mouseX);

  let bestId = null;
  let minDiff = Infinity;

  for (const vid of connectedVerseIdsList) {
    const vx = verseToX(vid);
    const diff = Math.abs(vx - mouseX);
    if (diff < minDiff && diff <= pixelTolerance) {
      minDiff = diff;
      bestId = vid;
    }
  }

  return bestId !== null ? bestId : xToVerse(mouseX);
}

// Snapping for radial circular mode
function radialToVerse(angleRad) {
  // Normalize angle so -PI/2 (top) is 0
  let norm = angleRad + Math.PI / 2;
  while (norm < 0) norm += Math.PI * 2;
  while (norm >= Math.PI * 2) norm -= Math.PI * 2;

  const ratio = norm / (Math.PI * 2);
  const vId = Math.max(1, Math.min(6604, Math.round(ratio * 6603) + 1));

  // Snap to nearest connected if within ~60 verses
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
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  if (books.length === 0) return;

  if (currentViewMode === "dual") {
    drawDualView();
  } else if (currentViewMode === "radial") {
    drawRadialView();
  } else {
    drawClassicView();
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

    // Small label
    ctx.fillStyle = b.color;
    ctx.font = b.weight ? "bold 10px Inter, sans-serif" : "9px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(b.short, bx, topY - 12);
  });

  // B. Bottom Rail (Book of Mormon)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING_X, bottomY);
  ctx.lineTo(PADDING_X + usableWidth, bottomY);
  ctx.stroke();

  // Book boundary tick marks
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

  // C. Cross-Testament Bridging Beams (BOM <-> Bible)
  if (currentFilter !== "internal") {
    externalLinks.forEach(link => {
      const isConnectedToActive = (link.source === activeVerse);
      const xBom = verseToX(link.source);
      const xBible = getBibleBookX(link.externalRef, rect.width, PADDING_X);

      ctx.beginPath();
      ctx.moveTo(xBom, bottomY);
      // Gentle S-curve or central control point
      const midY = (topY + bottomY) / 2;
      ctx.bezierCurveTo(xBom, midY + 40, xBible, midY - 40, xBible, topY);

      if (isConnectedToActive) {
        // High-voltage golden beam
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 3.0;
        ctx.shadowColor = "rgba(245, 158, 11, 0.9)";
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Top node highlight
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(xBible, topY, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (activeVerse) {
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 0.6;
        ctx.globalAlpha = 0.05;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      } else {
        ctx.strokeStyle = "rgba(16, 185, 129, 0.22)";
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }
    });
  }

  // D. Internal BOM Arcs (curving upward in the lower half)
  if (currentFilter !== "external") {
    internalLinks.forEach(link => {
      const isConnectedToActive = (link.source === activeVerse || link.target === activeVerse);
      const x1 = verseToX(link.source);
      const x2 = verseToX(link.target);
      const dist = Math.abs(x2 - x1);

      // Arc height in lower half
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
    const activeBook = getBookForVerse(activeVerse);
    const pinColor = activeBook ? activeBook.color : "#38bdf8";

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
  const activeVerseConnections = verseConnectionsMap.get(activeVerse) || { internal: [], external: [] };

  function verseAngle(vId) {
    return -Math.PI / 2 + ((vId - 1) / 6603) * (Math.PI * 2);
  }

  // 1. Draw Circumference Book Segments
  books.forEach(b => {
    const a1 = verseAngle(b.startVerseId);
    const a2 = verseAngle(b.endVerseId);

    ctx.strokeStyle = b.color;
    ctx.lineWidth = (hoveredBookId && hoveredBookId.id === b.id) ? 14 : 9;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, a1, a2);
    ctx.stroke();

    // Book label outside the ring
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

  // 2. Hotspots on the Ring
  connectedVerseIdsList.forEach(vid => {
    const ang = verseAngle(vid);
    const hx = cx + innerR * Math.cos(ang);
    const hy = cy + innerR * Math.sin(ang);

    ctx.fillStyle = "rgba(245, 158, 11, 0.7)";
    ctx.beginPath();
    ctx.arc(hx, hy, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // 3. Draw Chords Criss-Crossing Through the Center
  internalLinks.forEach(link => {
    const isConnectedToActive = (link.source === activeVerse || link.target === activeVerse);
    const a1 = verseAngle(link.source);
    const a2 = verseAngle(link.target);

    const x1 = cx + innerR * Math.cos(a1);
    const y1 = cy + innerR * Math.sin(a1);
    const x2 = cx + innerR * Math.cos(a2);
    const y2 = cy + innerR * Math.sin(a2);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    // Curve through center with slight pull
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

  // 4. Center Glowing Orb (Sacred Core)
  ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
  ctx.strokeStyle = "rgba(245, 158, 11, 0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, centerOrbR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Center Orb Typography
  if (activeVerse) {
    const vObj = verses[activeVerse - 1];
    const conns = verseConnectionsMap.get(activeVerse) || { internal: [], external: [] };
    const total = conns.internal.length + conns.external.length;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Book & Ref
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 13px Cinzel, Georgia, serif";
    ctx.fillText(vObj ? vObj.ref : `Verse #${activeVerse}`, cx, cy - 14);

    // Connections count
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillText(`${total} Connections`, cx, cy + 8);

    // Subtext
    ctx.fillStyle = "#94a3b8";
    ctx.font = "9.5px Inter, sans-serif";
    ctx.fillText(vObj ? (vObj.book) : "The Book of Mormon", cx, cy + 24);

    // Active marker dot on circumference
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
// VIEW 3: CLASSIC VIEW (Traditional Chris Harrison Arc Diagram)
// -------------------------------------------------------------
function drawClassicView() {
  const bottomY = canvasHeight - 20;
  const activeVerse = hoveredVerseId || selectedVerseId;
  const activeVerseConnections = verseConnectionsMap.get(activeVerse) || { internal: [], external: [] };

  // Baseline
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING_X, bottomY);
  ctx.lineTo(PADDING_X + usableWidth, bottomY);
  ctx.stroke();

  // Book boundary tick marks
  books.forEach(b => {
    const x = verseToX(b.startVerseId);
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, bottomY - 4);
    ctx.lineTo(x, bottomY + 6);
    ctx.stroke();
  });

  // Hotspots
  connectedVerseIdsList.forEach(vid => {
    const hx = verseToX(vid);
    ctx.fillStyle = "rgba(99, 102, 241, 0.75)";
    ctx.beginPath();
    ctx.arc(hx, bottomY, 1.8, 0, Math.PI * 2);
    ctx.fill();
  });

  // Arcs
  internalLinks.forEach(link => {
    const isConnectedToActive = (link.source === activeVerse || link.target === activeVerse);
    const x1 = verseToX(link.source);
    const x2 = verseToX(link.target);
    const dist = Math.abs(x2 - x1);

    const maxH = canvasHeight - 40;
    const arcHeight = Math.min(maxH, Math.max(25, Math.pow(dist / usableWidth, 0.72) * (maxH * 1.25)));
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
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = 0.08;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    } else {
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.45;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
  });

  // Active verse
  if (activeVerse) {
    const activeX = verseToX(activeVerse);
    const activeBook = getBookForVerse(activeVerse);
    const pinColor = activeBook ? activeBook.color : "#38bdf8";

    ctx.fillStyle = pinColor;
    ctx.shadowColor = pinColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(activeX, bottomY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function getBookForVerse(verseId) {
  return books.find(b => verseId >= b.startVerseId && verseId <= b.endVerseId);
}

// Render the 15-book Axis bar below canvas
function renderAxis() {
  axisBar.innerHTML = "";
  bookLabelsRow.innerHTML = "";

  books.forEach(b => {
    const pct = (b.versesCount / 6604) * 100;

    // Segment
    const seg = document.createElement("div");
    seg.className = "book-segment";
    seg.style.width = `${pct}%`;
    seg.style.backgroundColor = b.color;
    seg.title = `${b.name} (${b.chaptersCount} ch, ${b.versesCount} v)`;
    seg.addEventListener("click", () => {
      selectVerse(b.startVerseId);
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

    // Label pill
    const pill = document.createElement("button");
    pill.className = "book-label-pill";
    pill.textContent = b.shortName;
    pill.style.borderBottom = `2px solid ${b.color}`;
    pill.addEventListener("click", () => {
      selectVerse(b.startVerseId);
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

    // Dropdown option
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = `${b.name} (${b.chaptersCount} ch)`;
    bookSelect.appendChild(opt);
  });
}

// Render the Featured Connections quick-picker pills
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
      selectVerse(item.verseId);
      document.querySelectorAll(".featured-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
    });

    featuredPillsRow.appendChild(pill);
  });
}

// Select a verse and update the Study Panel
function selectVerse(verseId) {
  if (verseId < 1 || verseId > 6604) return;
  selectedVerseId = verseId;

  // Update sequential tour counter if present
  const tourIdx = connectedVerseIdsList.indexOf(verseId);
  if (tourIdx !== -1) {
    currentTourIndex = tourIdx;
    connCounterBadge.textContent = `${currentTourIndex + 1} / ${connectedVerseIdsList.length}`;
  } else {
    connCounterBadge.textContent = `${connectedVerseIdsList.length} Connected`;
  }

  const verseObj = verses[verseId - 1];
  const book = getBookForVerse(verseId);
  const connections = verseConnectionsMap.get(verseId) || { internal: [], external: [] };

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

  // Render connections list
  connectionsList.innerHTML = "";
  const totalCount = connections.internal.length + connections.external.length;
  connectionsCountBadge.textContent = t("connectionsCount", { n: totalCount });

  if (totalCount === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "connection-card";
    emptyMsg.style.cursor = "default";
    emptyMsg.textContent = t("noConnections");
    connectionsList.appendChild(emptyMsg);
  } else {
    // Internal links
    connections.internal.forEach(link => {
      const isSource = link.source === verseId;
      const targetId = isSource ? link.target : link.source;
      const targetRefStr = isSource ? link.targetRef : link.sourceRef;

      const card = document.createElement("div");
      card.className = "connection-card";
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
      connectionsList.appendChild(card);
    });

    // External links (Bible)
    connections.external.forEach(link => {
      const card = document.createElement("div");
      card.className = "connection-card";
      card.style.cursor = "default";
      card.innerHTML = `
        <div class="connection-left">
          <div class="connection-title">${icons.bookOpen} ${link.externalRef} (${link.externalWork || "Bible"})</div>
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

  draw();
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
    // Dual or Classic View
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
      selectVerse(vId);
    }
  } else {
    if (mouseX >= PADDING_X && mouseX <= PADDING_X + usableWidth) {
      const vId = findNearestConnectedVerse(mouseX, 20);
      selectVerse(vId);
    }
  }
});

// View mode switcher buttons
viewBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    viewBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentViewMode = btn.dataset.view;

    // Toggle rail headers visibility
    if (currentViewMode === "dual") {
      dualTopLabelRow.style.display = "flex";
      dualBottomLabelRow.style.display = "flex";
      axisContainer.style.display = "block";
    } else if (currentViewMode === "radial") {
      dualTopLabelRow.style.display = "none";
      dualBottomLabelRow.style.display = "none";
      axisContainer.style.display = "none";
    } else {
      dualTopLabelRow.style.display = "none";
      dualBottomLabelRow.style.display = "none";
      axisContainer.style.display = "block";
    }

    draw();
  });
});

// Tour controls navigation
prevConnBtn.addEventListener("click", () => {
  if (connectedVerseIdsList.length === 0) return;
  currentTourIndex = (currentTourIndex - 1 + connectedVerseIdsList.length) % connectedVerseIdsList.length;
  selectVerse(connectedVerseIdsList[currentTourIndex]);
});

nextConnBtn.addEventListener("click", () => {
  if (connectedVerseIdsList.length === 0) return;
  currentTourIndex = (currentTourIndex + 1) % connectedVerseIdsList.length;
  selectVerse(connectedVerseIdsList[currentTourIndex]);
});

randomConnBtn.addEventListener("click", () => {
  if (connectedVerseIdsList.length === 0) return;
  currentTourIndex = Math.floor(Math.random() * connectedVerseIdsList.length);
  selectVerse(connectedVerseIdsList[currentTourIndex]);
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
    draw();
  });
});

// Book selector
bookSelect.addEventListener("change", (e) => {
  activeBookFilter = e.target.value;
  if (activeBookFilter !== "all") {
    const b = books.find(item => item.id === parseInt(activeBookFilter));
    if (b) selectVerse(b.startVerseId);
  }
  draw();
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
  document.getElementById("labelViewClassic").textContent = t("viewClassic");
  document.getElementById("bibleTopTitle").textContent = `📖 ${t("bibleTopTitle")}`;
  document.getElementById("bomBottomTitle").textContent = `📜 ${t("bomBottomTitle")}`;
  prevConnBtn.querySelector(".tour-btn-text").textContent = t("prevBtn");
  nextConnBtn.querySelector(".tour-btn-text").textContent = t("nextBtn");
  randomConnBtn.querySelector("span").textContent = t("randomBtn");
  searchInput.placeholder = t("searchPlaceholder");
  langText.textContent = t("langToggle");

  renderFeaturedPills();
  if (selectedVerseId) {
    selectVerse(selectedVerseId);
  }
}

// Responsive resize
window.addEventListener("resize", () => {
  setupCanvas();
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

    renderAxis();
    renderFeaturedPills();
    setupCanvas();

    // Select the first featured connection
    selectVerse(selectedVerseId);
    console.log(`Loaded ${connectedVerseIdsList.length} connected verses successfully.`);
  } catch (err) {
    console.error("Error loading scripture data:", err);
  }
}

init();
