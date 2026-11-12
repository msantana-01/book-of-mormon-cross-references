import { t, getLang, setLang } from "./i18n.js";

// State
let books = [];
let verses = [];
let internalLinks = [];
let externalLinks = [];
let verseConnectionsMap = new Map(); // verseId -> { internal: [], external: [] }
let selectedVerseId = 142; // Default to 1 Nephi 3:7 ("I will go and do...")
let hoveredVerseId = null;
let hoveredBookId = null;
let currentFilter = "all"; // "all" | "internal" | "external"
let activeBookFilter = "all";

// DOM Elements
const canvas = document.getElementById("arcCanvas");
const ctx = canvas.getContext("2d");
const tooltip = document.getElementById("tooltip");
const axisBar = document.getElementById("axisBar");
const bookLabelsRow = document.getElementById("bookLabelsRow");
const bookSelect = document.getElementById("bookSelect");
const searchInput = document.getElementById("searchInput");
const filterBtns = document.querySelectorAll(".filter-btn");
const langToggleBtn = document.getElementById("langToggleBtn");

const selectedVerseRef = document.getElementById("selectedVerseRef");
const selectedVerseBadge = document.getElementById("selectedVerseBadge");
const connectionsCountBadge = document.getElementById("connectionsCountBadge");
const verseTextBox = document.getElementById("verseTextBox");
const connectionsList = document.getElementById("connectionsList");
const officialLinkContainer = document.getElementById("officialLinkContainer");
const officialLink = document.getElementById("officialLink");

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

// Layout calculations
const PADDING_X = 24;
const PADDING_TOP = 20;
let usableWidth = 0;
let canvasHeight = 0;
let baselineY = 0;

function setupCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  usableWidth = rect.width - PADDING_X * 2;
  canvasHeight = rect.height;
  baselineY = canvasHeight - 16;
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

// Draw the arc diagram
function draw() {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  if (books.length === 0) return;

  const activeVerse = hoveredVerseId || selectedVerseId;
  const activeVerseConnections = verseConnectionsMap.get(activeVerse) || { internal: [], external: [] };
  const connectedVerseIds = new Set();
  activeVerseConnections.internal.forEach(l => {
    connectedVerseIds.add(l.source);
    connectedVerseIds.add(l.target);
  });

  // 1. Draw Baseline & Book dividers
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING_X, baselineY);
  ctx.lineTo(PADDING_X + usableWidth, baselineY);
  ctx.stroke();

  // Book boundary tick marks
  books.forEach(b => {
    const x = verseToX(b.startVerseId);
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, baselineY - 4);
    ctx.lineTo(x, baselineY + 6);
    ctx.stroke();
  });

  // 2. Draw Arcs
  const shouldDrawArcs = currentFilter !== "external";
  if (shouldDrawArcs) {
    const linksToDraw = internalLinks.filter(link => {
      if (activeBookFilter !== "all") {
        const b = books.find(item => item.id === parseInt(activeBookFilter));
        if (b && (link.source < b.startVerseId || link.source > b.endVerseId) &&
                 (link.target < b.startVerseId || link.target > b.endVerseId)) {
          return false;
        }
      }
      return true;
    });

    linksToDraw.forEach(link => {
      const isConnectedToActive = (link.source === activeVerse || link.target === activeVerse);
      const isBookActive = hoveredBookId ? (
        (link.source >= hoveredBookId.startVerseId && link.source <= hoveredBookId.endVerseId) ||
        (link.target >= hoveredBookId.startVerseId && link.target <= hoveredBookId.endVerseId)
      ) : false;

      const x1 = verseToX(link.source);
      const x2 = verseToX(link.target);
      const dist = Math.abs(x2 - x1);

      // Arc height curve (proportional & bounded)
      const maxH = canvasHeight - PADDING_TOP - 30;
      const arcHeight = Math.min(maxH, Math.max(25, Math.pow(dist / usableWidth, 0.72) * (maxH * 1.25)));
      const cx = (x1 + x2) / 2;
      const cy = baselineY - arcHeight;

      const sourceBook = getBookForVerse(link.source);
      const baseColor = sourceBook ? sourceBook.color : "#6366f1";

      ctx.beginPath();
      ctx.moveTo(x1, baselineY);
      ctx.quadraticCurveTo(cx, cy, x2, baselineY);

      if (isConnectedToActive) {
        // Vibrant illuminated highlight
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2.8;
        ctx.shadowColor = "rgba(56, 189, 248, 0.8)";
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      } else if (isBookActive) {
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 1.8;
        ctx.globalAlpha = 0.8;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      } else if (activeVerse) {
        // Dim unselected arcs
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = 0.08;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      } else {
        // Idle normal glow
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.45;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    });
  }

  // 3. Draw Active Verse Pointer & Indicator
  if (activeVerse) {
    const activeX = verseToX(activeVerse);
    const activeBook = getBookForVerse(activeVerse);
    const pinColor = activeBook ? activeBook.color : "#38bdf8";

    // Vertical cursor beam
    ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(activeX, PADDING_TOP);
    ctx.lineTo(activeX, baselineY + 10);
    ctx.stroke();

    // Glow dot on baseline
    ctx.fillStyle = pinColor;
    ctx.shadowColor = pinColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(activeX, baselineY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw connected dots along baseline
    connectedVerseIds.forEach(vid => {
      if (vid !== activeVerse) {
        const cx = verseToX(vid);
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(cx, baselineY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
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

// Select a verse and update the Study Panel
function selectVerse(verseId) {
  if (verseId < 1 || verseId > 6604) return;
  selectedVerseId = verseId;

  const verseObj = verses[verseId - 1];
  const book = getBookForVerse(verseId);
  const connections = verseConnectionsMap.get(verseId) || { internal: [], external: [] };

  if (verseObj) {
    selectedVerseRef.textContent = verseObj.ref;
    selectedVerseBadge.style.display = "inline-block";
    selectedVerseBadge.textContent = book ? book.name : "Scripture";
    selectedVerseBadge.style.backgroundColor = book ? `${book.color}25` : "";
    selectedVerseBadge.style.color = book ? book.color : "";

    verseTextBox.textContent = `"${verseObj.text}"`;

    // Official Church of Jesus Christ of Latter-day Saints study URL
    const slug = CHURCH_BOOK_SLUGS[verseObj.book];
    if (slug) {
      officialLinkContainer.style.display = "block";
      const langParam = getLang() === "pt" ? "por" : "eng";
      officialLink.href = `https://www.churchofjesuschrist.org/study/scriptures/bofm/${slug}/${verseObj.ch}?lang=${langParam}#${verseObj.v}`;
      officialLink.textContent = t("readOnOfficial");
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
          <div class="connection-title">🔗 ${targetRefStr}</div>
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
          <div class="connection-title">📖 ${link.externalRef} (${link.externalWork || "Bible"})</div>
          ${link.note ? `<div class="connection-note">${link.note}</div>` : ""}
        </div>
        <span class="tag tag-external">${link.type || "Biblical Reference"}</span>
      `;
      connectionsList.appendChild(card);
    });
  }

  draw();
}

// Mouse events on canvas
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (mouseX >= PADDING_X && mouseX <= PADDING_X + usableWidth) {
    const vId = xToVerse(mouseX);
    hoveredVerseId = vId;
    const vObj = verses[vId - 1];
    const conns = verseConnectionsMap.get(vId) || { internal: [], external: [] };
    const total = conns.internal.length + conns.external.length;

    tooltip.style.display = "block";
    tooltip.style.left = `${e.clientX}px`;
    tooltip.style.top = `${e.clientY - 12}px`;
    tooltip.innerHTML = `<strong>${vObj ? vObj.ref : `Verse #${vId}`}</strong> &bull; ${total} connections`;
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
  if (mouseX >= PADDING_X && mouseX <= PADDING_X + usableWidth) {
    const vId = xToVerse(mouseX);
    selectVerse(vId);
  }
});

// Search input handling
searchInput.addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  if (!q) return;

  // Search exact reference match first (e.g. "alma 32:21")
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
  searchInput.placeholder = t("searchPlaceholder");
  langToggleBtn.textContent = t("langToggle");

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

    renderAxis();
    setupCanvas();
    selectVerse(selectedVerseId);
    console.log("Book of Mormon Cross-Reference Visualizer loaded successfully.");
  } catch (err) {
    console.error("Error loading scripture data:", err);
  }
}

init();
