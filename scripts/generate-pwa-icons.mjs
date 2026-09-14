import sharp from "sharp";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";

const OUT_DIR = path.resolve("public/icons");
mkdirSync(OUT_DIR, { recursive: true });

const BG = "#8ed600";
const FG = "#0a0d10";

const WRENCH_PATH =
  "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z";

// `iconScale` controls how large the 24x24 wrench glyph is drawn relative to
// the canvas; `cornerRatio` is 0 for maskable icons (the OS applies its own
// mask, so the background must be edge-to-edge) and >0 for standalone icons.
function buildSvg(size, { iconScale, cornerRatio }) {
  const r = size * cornerRatio;
  const glyphSize = size * iconScale;
  const offset = (size - glyphSize) / 2;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${BG}" />
  <g transform="translate(${offset}, ${offset}) scale(${glyphSize / 24})">
    <path d="${WRENCH_PATH}" fill="none" stroke="${FG}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </g>
</svg>`;
}

const targets = [
  { file: "icon-192.png", size: 192, iconScale: 0.6, cornerRatio: 0.22 },
  { file: "icon-512.png", size: 512, iconScale: 0.6, cornerRatio: 0.22 },
  { file: "icon-maskable-192.png", size: 192, iconScale: 0.5, cornerRatio: 0 },
  { file: "icon-maskable-512.png", size: 512, iconScale: 0.5, cornerRatio: 0 },
  { file: "apple-touch-icon.png", size: 180, iconScale: 0.58, cornerRatio: 0 },
];

for (const t of targets) {
  const svg = buildSvg(t.size, t);
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  writeFileSync(path.join(OUT_DIR, t.file), buf);
  console.log("wrote", t.file, buf.length, "bytes");
}
