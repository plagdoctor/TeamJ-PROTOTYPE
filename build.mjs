// Vercel build step (옵션) — esbuild로 CSS/JS minify 후 dist/ 출력.
// 사용 안 하려면 vercel.json에서 outputDirectory 제거하고 zero-config로 배포.
import { build } from "esbuild";
import { mkdir, copyFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve(".");
const dist = path.join(root, "dist");

await mkdir(dist, { recursive: true });

// 1) JS minify
await build({
  entryPoints: ["app.js"],
  outfile: "dist/app.js",
  bundle: false,
  minify: true,
  target: ["es2020"],
  legalComments: "none",
  sourcemap: false,
});

// 2) CSS minify
await build({
  entryPoints: ["styles.css"],
  outfile: "dist/styles.css",
  bundle: false,
  minify: true,
  loader: { ".css": "css" },
});

// 3) 정적 자산 복사
const staticFiles = [
  "index.html",
  "light-theme.html",
  "favicon.svg",
  "apple-touch-icon.svg",
  "manifest.webmanifest",
  "robots.txt",
];

for (const file of staticFiles) {
  if (existsSync(path.join(root, file))) {
    await copyFile(path.join(root, file), path.join(dist, file));
  }
}

// 4) 빌드 결과 요약
const out = await readdir(dist);
console.log("\nBuild 완료. dist/ 출력:");
for (const f of out) {
  const s = await stat(path.join(dist, f));
  console.log(`  ${f.padEnd(28)} ${(s.size / 1024).toFixed(1)} KB`);
}
