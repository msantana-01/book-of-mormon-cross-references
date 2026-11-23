import { t, getLang, getBookDisplayName, BOOK_NAMES_PT, getExternalRefDisplayName, getExternalWorkDisplayName } from "./i18n.js";

/**
 * Renders a high-resolution, visually stunning Scripture Study Card (PNG)
 * containing the verse text, its connected cross-references, and a miniature
 * canon arc diagram. Runs 100% in the user's browser with zero server cost.
 */
export async function generateVerseCard({
  verseObj,
  connections,
  bookObj,
  currentFilter = "all"
}) {
  if (!verseObj) return;

  // Wait for Google Fonts (Cinzel, Cormorant Garamond, Inter) to be ready
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn("Fonts ready timeout:", e);
    }
  }

  // 1200x675 standard 16:9 canvas (2x scaled for ultra-crisp Retina export: 2400x1350)
  const scale = 2;
  const W = 1200;
  const H = 675;

  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  // -----------------------------------------------------------
  // 1. BACKGROUND GRADIENT & SACRED VIGNETTE
  // -----------------------------------------------------------
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, "#050811");
  bgGrad.addColorStop(0.5, "#0b1222");
  bgGrad.addColorStop(1, "#070c17");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle radial gold glow in center
  const glow = ctx.createRadialGradient(W / 2, H * 0.38, 50, W / 2, H * 0.38, 450);
  glow.addColorStop(0, "rgba(245, 158, 11, 0.08)");
  glow.addColorStop(0.6, "rgba(56, 189, 248, 0.03)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Outer border & sacred corner marks
  const m = 22; // margin
  ctx.strokeStyle = "rgba(245, 158, 11, 0.35)";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(m, m, W - m * 2, H - m * 2);

  // Corner brackets (delicate ornamental styling)
  const cLen = 20;
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 2.5;

  // Top-left
  ctx.beginPath();
  ctx.moveTo(m + cLen, m);
  ctx.lineTo(m, m);
  ctx.lineTo(m, m + cLen);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(W - m - cLen, m);
  ctx.lineTo(W - m, m);
  ctx.lineTo(W - m, m + cLen);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(m + cLen, H - m);
  ctx.lineTo(m, H - m);
  ctx.lineTo(m, H - m - cLen);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(W - m - cLen, H - m);
  ctx.lineTo(W - m, H - m);
  ctx.lineTo(W - m, H - m - cLen);
  ctx.stroke();

  // -----------------------------------------------------------
  // 2. HEADER: BRANDING & SCRIPTURE BADGE
  // -----------------------------------------------------------
  const isPt = getLang() === "pt";
  const brandTitle = isPt ? "O LIVRO DE MÓRMON" : "THE BOOK OF MORMON";
  const brandSub = isPt
    ? "Referências Cruzadas & Paralelos Bíblicos"
    : "Cross-References & Biblical Parallels";

  // Brand Name (Cinzel serif display)
  ctx.font = "700 17px Cinzel, Georgia, serif";
  ctx.fillStyle = "#fbbf24";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(brandTitle, 54, 46);

  ctx.font = "500 11.5px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(brandSub, 54, 70);

  // Right Badges: Book Ref + Connections count
  const bookColor = bookObj?.color || "#f59e0b";
  const filteredInternal = currentFilter === "external" ? [] : (connections?.internal || []);
  const filteredExternal = currentFilter === "internal" ? [] : (connections?.external || []);
  const totalCount = filteredInternal.length + filteredExternal.length;

  const bookDisplayName = getBookDisplayName(verseObj.book);
  const refBadgeText = `${bookDisplayName} ${verseObj.ch}:${verseObj.v}`.toUpperCase();
  ctx.font = "700 14px Inter, system-ui, sans-serif";
  const refWidth = ctx.measureText(refBadgeText).width + 26;

  // Verse reference badge pill
  const badgeX = W - 54 - refWidth;
  const badgeY = 46;
  const badgeH = 34;

  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.strokeStyle = bookColor;
  ctx.lineWidth = 1.5;
  roundRect(ctx, badgeX, badgeY, refWidth, badgeH, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f8fafc";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(refBadgeText, badgeX + refWidth / 2, badgeY + badgeH / 2);

  // Connections Count pill
  const countText = isPt ? `${totalCount} Conexões` : `${totalCount} Connections`;
  ctx.font = "600 11.5px Inter, system-ui, sans-serif";
  const countWidth = ctx.measureText(countText).width + 18;
  const countX = badgeX - countWidth - 10;

  ctx.fillStyle = "rgba(245, 158, 11, 0.12)";
  ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
  ctx.lineWidth = 1;
  roundRect(ctx, countX, badgeY + 2, countWidth, 30, 999);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#fbbf24";
  ctx.fillText(countText, countX + countWidth / 2, badgeY + 17);

  // Horizontal divider
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(54, 98);
  ctx.lineTo(W - 54, 98);
  ctx.stroke();

  // -----------------------------------------------------------
  // 3. SCRIPTURE VERSE TEXT (Cormorant Garamond Serif Typography)
  // -----------------------------------------------------------
  const textX = 72;
  const textY = 130;
  const maxTextW = W - 144;
  const verseText = `“${verseObj.text}”`;

  // Calculate dynamic font size based on text length
  let fontSize = 28;
  let lineHeight = 42;
  if (verseText.length > 400) {
    fontSize = 19;
    lineHeight = 29;
  } else if (verseText.length > 250) {
    fontSize = 22;
    lineHeight = 34;
  } else if (verseText.length > 150) {
    fontSize = 25;
    lineHeight = 38;
  }

  ctx.font = `italic ${fontSize}px "Cormorant Garamond", Georgia, serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const rawLines = wrapText(ctx, verseText, maxTextW - 30);
  const maxLines = 7;
  let lines = rawLines;
  if (rawLines.length > maxLines) {
    lines = rawLines.slice(0, maxLines);
    lines[maxLines - 1] = lines[maxLines - 1].replace(/[\s.,;:—-]+$/, "") + "…”";
  }
  const textBlockHeight = lines.length * lineHeight;

  // Vertical scripture accent bar on the left
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(54, textY, 3.5, Math.min(250, textBlockHeight + 4));

  // Render text lines
  ctx.fillStyle = "#f8fafc";
  lines.forEach((line, i) => {
    ctx.fillText(line, textX, textY + i * lineHeight);
  });

  // -----------------------------------------------------------
  // 4. CROSS-REFERENCES & MINI-ARC FOOTER SECTION
  // -----------------------------------------------------------
  const cardBoxY = 415;
  const cardBoxH = 195;
  const cardBoxW = W - 108;

  // Glass panel container
  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.09)";
  ctx.lineWidth = 1;
  roundRect(ctx, 54, cardBoxY, cardBoxW, cardBoxH, 10);
  ctx.fill();
  ctx.stroke();

  // Section Label
  ctx.font = "700 11px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#38bdf8";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const crossrefLabel = isPt
    ? "CONEXÕES PROFÉTICAS & PARALELOS BÍBLICOS"
    : "PROPHETIC CROSS-REFERENCES & BIBLICAL PARALLELS";
  ctx.fillText(crossrefLabel, 72, cardBoxY + 16);

  // Mini-Arc Visualization Canvas inside the box
  const arcLeft = 72;
  const arcWidth = 360;
  const arcBaselineY = cardBoxY + cardBoxH - 35;

  // Mini Canon Baseline
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(arcLeft, arcBaselineY);
  ctx.lineTo(arcLeft + arcWidth, arcBaselineY);
  ctx.stroke();

  // Active verse location dot
  const currentRatio = (verseObj.id - 1) / 6604;
  const currentDotX = arcLeft + currentRatio * arcWidth;

  // Draw miniature arcs connecting to destination verses
  const sampleLinks = [...filteredExternal.slice(0, 2), ...filteredInternal.slice(0, 2)];

  sampleLinks.forEach((link, idx) => {
    let targetX;
    let arcColor;

    if (link.externalRef) {
      // External Bible parallel
      arcColor = "#10b981";
      targetX = arcLeft + (0.15 + (idx * 0.28)) * arcWidth;
    } else {
      // Internal BOM connection
      arcColor = "#38bdf8";
      const targetId = link.source === verseObj.id ? link.target : link.source;
      targetX = arcLeft + ((targetId - 1) / 6604) * arcWidth;
    }

    const dist = Math.abs(targetX - currentDotX);
    const arcHeight = Math.min(55, Math.max(18, dist * 0.35));
    const cx = (currentDotX + targetX) / 2;
    const cy = arcBaselineY - arcHeight;

    ctx.save();
    ctx.strokeStyle = arcColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = arcColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(currentDotX, arcBaselineY);
    ctx.quadraticCurveTo(cx, cy, targetX, arcBaselineY);
    ctx.stroke();

    // Destination tick/dot
    ctx.fillStyle = arcColor;
    ctx.beginPath();
    ctx.arc(targetX, arcBaselineY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Current Verse Glowing Gold Pin
  ctx.save();
  ctx.fillStyle = "#fbbf24";
  ctx.shadowColor = "#fbbf24";
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(currentDotX, arcBaselineY, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Baseline Labels
  ctx.font = "9px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.textAlign = "left";
  ctx.fillText(isPt ? "1 Néfi" : "1 Nephi", arcLeft, arcBaselineY + 12);
  ctx.textAlign = "right";
  ctx.fillText(isPt ? "Morôni 10" : "Moroni 10", arcLeft + arcWidth, arcBaselineY + 12);

  // List of Cross-Reference Pills (Right side of the glass panel)
  const pillsStartX = arcLeft + arcWidth + 40;
  const pillW = cardBoxW - (arcWidth + 70);
  let pillCurY = cardBoxY + 42;

  if (sampleLinks.length === 0) {
    ctx.font = "italic 13px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "left";
    ctx.fillText(
      isPt ? "Nenhuma referência direta registrada para este versículo." : "No direct recorded cross-references.",
      pillsStartX,
      pillCurY + 20
    );
  } else {
    const typeTranslationsPt = {
      "quotation": "Citação",
      "parallel": "Paralelo",
      "paraphrase": "Paráfrase",
      "fulfillment": "Cumprimento",
      "prophecy": "Profecia",
      "prophecy-vision": "Profecia",
      "typology": "Tipologia",
      "crossref": "Ref. Cruzada",
      "biblical parallel": "Paralelo Bíblico"
    };
    const typeTranslationsEn = {
      "quotation": "Quotation",
      "parallel": "Parallel",
      "paraphrase": "Paraphrase",
      "fulfillment": "Fulfillment",
      "prophecy": "Prophecy",
      "prophecy-vision": "Prophecy",
      "typology": "Typology",
      "crossref": "Cross-Ref",
      "biblical parallel": "Biblical Parallel"
    };

    sampleLinks.slice(0, 3).forEach(link => {
      const isExternal = Boolean(link.externalRef);
      let targetRefStr = isExternal
        ? (isPt ? getExternalRefDisplayName(link.externalRef) : link.externalRef)
        : (link.source === verseObj.id ? link.targetRef : link.sourceRef);

      if (!isExternal && isPt) {
        for (const [enB, ptB] of Object.entries(BOOK_NAMES_PT)) {
          if (targetRefStr.startsWith(enB)) {
            targetRefStr = targetRefStr.replace(enB, ptB);
            break;
          }
        }
      }

      const sourceWorkLabel = isExternal
        ? (isPt ? getExternalWorkDisplayName(link.externalWork) : (link.externalWork || "Bible"))
        : (isPt ? "Livro de Mórmon" : "Book of Mormon");
      const refTitle = `${targetRefStr} (${sourceWorkLabel})`;

      const rawType = (link.type || (isExternal ? "Biblical Parallel" : "Parallel")).toLowerCase();
      const tagText = isPt
        ? (typeTranslationsPt[rawType] || link.type || "Paralelo")
        : (typeTranslationsEn[rawType] || link.type || "Parallel");

      // Card pill background
      ctx.fillStyle = isExternal ? "rgba(16, 185, 129, 0.08)" : "rgba(56, 189, 248, 0.08)";
      ctx.strokeStyle = isExternal ? "rgba(16, 185, 129, 0.25)" : "rgba(56, 189, 248, 0.25)";
      ctx.lineWidth = 1;
      roundRect(ctx, pillsStartX, pillCurY, pillW, 40, 6);
      ctx.fill();
      ctx.stroke();

      // Dot indicator
      ctx.fillStyle = isExternal ? "#10b981" : "#38bdf8";
      ctx.beginPath();
      ctx.arc(pillsStartX + 16, pillCurY + 20, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Title
      ctx.font = "600 12px Inter, system-ui, sans-serif";
      ctx.fillStyle = isExternal ? "#34d399" : "#38bdf8";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(refTitle, pillsStartX + 26, pillCurY + 20);

      // Tag pill
      ctx.font = "600 10px Inter, system-ui, sans-serif";
      const tagW = ctx.measureText(tagText).width + 12;
      ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
      roundRect(ctx, pillsStartX + pillW - tagW - 10, pillCurY + 10, tagW, 20, 4);
      ctx.fill();

      ctx.fillStyle = isExternal ? "#a7f3d0" : "#c7d2fe";
      ctx.textAlign = "center";
      ctx.fillText(tagText, pillsStartX + pillW - tagW / 2 - 10, pillCurY + 20);

      pillCurY += 46;
    });
  }

  // -----------------------------------------------------------
  // 5. FOOTER: REPO & STUDY EDITION
  // -----------------------------------------------------------
  ctx.font = "10px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(
    isPt ? "Explorador de Referências Cruzadas do Livro de Mórmon" : "Book of Mormon Cross-References Explorer",
    54,
    H - 30
  );

  ctx.textAlign = "right";
  ctx.fillText(
    isPt ? "Edição de Estudo • ChurchofJesusChrist.org" : "ChurchofJesusChrist.org Scripture Study Edition",
    W - 54,
    H - 30
  );

  // -----------------------------------------------------------
  // 6. BLOB GENERATION & DOWNLOAD / NATIVE SHARE
  // -----------------------------------------------------------
  const sanitizedRef = verseObj.ref.replace(/[^a-zA-Z0-9]/g, "-");
  const filename = `bom-card-${sanitizedRef}.png`;

  return new Promise((resolve, reject) => {
    canvas.toBlob(async blob => {
      if (!blob) {
        reject(new Error("Canvas blob generation failed"));
        return;
      }

      const file = new File([blob], filename, { type: "image/png" });

      // Try native Web Share API with file support (mobile friendly)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: verseObj.ref,
            text: `"${verseObj.text}" - ${verseObj.ref}`,
            files: [file]
          });
          resolve({ success: true, method: "share", filename });
          return;
        } catch (err) {
          // Fall back to direct download if user cancelled or share failed
          if (err.name !== "AbortError") {
            console.log("Share skipped, falling back to download:", err);
          }
        }
      }

      // Standard browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(url), 2000);
      resolve({ success: true, method: "download", filename });
    }, "image/png");
  });
}

/** Helper: canvas rounded rectangle with safe radius clamping */
function roundRect(ctx, x, y, width, height, radius) {
  const maxR = Math.min(Math.abs(width) / 2, Math.abs(height) / 2);
  const r = Math.max(0, Math.min(radius, maxR));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Helper: word wrapper for canvas text */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}
