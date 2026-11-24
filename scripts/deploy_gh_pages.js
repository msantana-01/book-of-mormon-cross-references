import { execSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("🚀 Starting GitHub Pages Deployment...");

const distDir = path.resolve("dist");
if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, "index.html"))) {
  console.error("❌ Error: dist/index.html not found. Run 'npm run build' first.");
  process.exit(1);
}

// Ensure .nojekyll exists and disable Vercel builds on gh-pages
fs.writeFileSync(path.join(distDir, ".nojekyll"), "");
if (fs.existsSync("vercel.json")) {
  fs.copyFileSync("vercel.json", path.join(distDir, "vercel.json"));
}

// Get current git remote origin url
let remoteUrl = "";
try {
  remoteUrl = execSync("git config --get remote.origin.url", { encoding: "utf8" }).trim();
} catch (e) {
  remoteUrl = "https://github.com/msantana-01/book-of-mormon-cross-references.git";
}

console.log(`📡 Remote: ${remoteUrl}`);
console.log("📦 Preparing dist repository on gh-pages branch...");

const distGitDir = path.join(distDir, ".git");
if (fs.existsSync(distGitDir)) {
  fs.rmSync(distGitDir, { recursive: true, force: true });
}

try {
  execSync("git init", { cwd: distDir, stdio: "inherit" });
  execSync("git checkout -b gh-pages", { cwd: distDir, stdio: "inherit" });
  execSync("git add -A", { cwd: distDir, stdio: "inherit" });
  execSync('git commit -m "deploy: automated build for GitHub Pages"', { cwd: distDir, stdio: "inherit" });
  execSync(`git remote add origin ${remoteUrl}`, { cwd: distDir, stdio: "inherit" });
  console.log("⬆️ Pushing to origin/gh-pages...");
  execSync("git push -u origin gh-pages --force", { cwd: distDir, stdio: "inherit" });

  // Clean up .git in dist
  fs.rmSync(path.join(distDir, ".git"), { recursive: true, force: true });

  console.log("\n✅ Deployment to gh-pages branch succeeded!");
  console.log("🌐 URL: https://msantana-01.github.io/book-of-mormon-cross-references/");
  console.log("💡 (Ensure in GitHub Settings > Pages that 'Deploy from a branch' is set to branch 'gh-pages' / root)");
} catch (err) {
  console.error("❌ Deployment failed:", err.message);
  process.exit(1);
}
