# Book of Mormon Cross-References | Interactive Arc Diagram

An interactive, high-performance web visualization exploring cross-references, prophecy fulfillments, quotations, and biblical parallels across all **15 books**, **239 chapters**, and **6,604 verses** of the Book of Mormon.

Inspired by Chris Harrison and Christoph Römhild's classic 2007 biblical arc diagram and [trekhleb/bible-cross-references](https://github.com/trekhleb/bible-cross-references).

---

## ✨ Features

- **High-Performance Canvas 2D Engine:** Renders arcs with quadratic Bézier curves at 60 FPS with zero lag, optimized for both Desktop and Mobile.
- **Canon Proportions:** Horizontal timeline accurately representing the 15 books by their verse counts.
- **Bi-directional Interactivity:** 
  - Hover over any point to preview connections and verse coordinates.
  - Click to select and isolate all connected incoming and outgoing arcs.
  - Interactive Study Drawer displaying full scripture text and doctrinal insights.
  - Jump directly between linked passages.
- **Dual Connection Modes:**
  - **Internal Arcs:** Inter-book fulfillments, prophecies, quotations, and chiasms (e.g., Samuel the Lamanite in Helaman 14 $\leftrightarrow$ Christ's appearance in 3 Nephi).
  - **Biblical Parallels:** Parallel passages and direct quotations from the Old Testament (e.g. Isaiah) and New Testament (e.g. Sermon on the Mount).
- **Canonical Deep Linking:** Direct links to read chapters in context on the official [ChurchofJesusChrist.org](https://www.churchofjesuschrist.org/study/scriptures/bofm) website.
- **Multi-language Ready (i18n):** Toggle interface between English and Portuguese with a single click.
- **Ultra-lightweight:** Pure client-side application (< 5 KB compressed JS) requiring zero backend server.

---

## 🚀 Running Locally

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/mormon-book-cross-references.git
   cd mormon-book-cross-references
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

---

## ☁️ Deploy to Vercel (100% Free)

This project is pre-configured with `vercel.json` for seamless static hosting on Vercel's Hobby tier:

### Method 1: Push to GitHub & Connect to Vercel
1. Push this repository to your GitHub account:
   ```bash
   git add .
   git commit -m "Initial release of Book of Mormon cross-references visualizer"
   git branch -M main
   git remote add origin https://github.com/YOUR_USER/mormon-book-cross-references.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com/), click **Add New > Project**, and select your GitHub repository.
3. Click **Deploy**. Vercel will automatically detect Vite and publish your site with a free `.vercel.app` domain and SSL.

### Method 2: Vercel CLI
```bash
npx vercel
```

---

## 📜 Data Sources & Legal Attribution

- **Scripture Text:** Based on public domain editions provided by the [LDS Documentation Project / scriptures.nephi.org](https://scriptures.nephi.org/) (maintained by `@beandog`).
- **Cross-Reference & Parallel Datasets:** Curated open datasets from `wordtreefoundation/bomdb` and open scripture research.
- **Code License:** [MIT License](LICENSE).
