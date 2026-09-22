import { escapeXml, splitLines } from "./maro-brat.js";

function isDark(hex) {
  const normalized = String(hex || "").replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return false;
  const [r, g, b] = [0, 2, 4].map((index) => Number.parseInt(normalized.slice(index, index + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 < 145;
}

function quoteImage({ name = "Tarboo Bot", text = "", color = "#1f2937" } = {}) {
  const background = /^#[0-9a-f]{6}$/i.test(color) ? color : "#1f2937";
  const foreground = isDark(background) ? "#ffffff" : "#111827";
  const lines = splitLines(text, 23, 4);
  const textSize = lines.length <= 2 ? 75 : 60;
  const startY = 360 - ((lines.length - 1) * textSize * 1.24) / 2;
  const message = lines
    .map((line, index) => `<text x="150" y="${Math.round(startY + index * textSize * 1.24)}" font-size="${textSize}">${escapeXml(line)}</text>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect width="1024" height="1024" rx="84" fill="${background}"/><circle cx="152" cy="170" r="78" fill="${foreground}" opacity="0.22"/><text x="150" y="185" text-anchor="middle" fill="${foreground}" font-family="Arial, Noto Sans Arabic, sans-serif" font-size="76" font-weight="700">${escapeXml(String(name).slice(0, 2).toUpperCase())}</text><text x="260" y="156" fill="${foreground}" font-family="Arial, Noto Sans Arabic, sans-serif" font-size="46" font-weight="700">${escapeXml(name)}</text><text x="260" y="205" fill="${foreground}" opacity="0.76" font-family="Arial, Noto Sans Arabic, sans-serif" font-size="30">WhatsApp • Tarboo Bot</text><path d="M102 280 Q102 240 142 240 H882 Q922 240 922 280 V660 Q922 700 882 700 H260 L152 790 L174 700 H142 Q102 700 102 660Z" fill="${foreground}" opacity="0.14"/><g fill="${foreground}" font-family="Arial, Noto Sans Arabic, sans-serif" font-weight="600" direction="auto" unicode-bidi="plaintext">${message}</g><text x="150" y="900" fill="${foreground}" opacity="0.7" font-family="Arial, Noto Sans Arabic, sans-serif" font-size="30">اقتباس محلي</text></svg>`;
  return Buffer.from(svg, "utf8");
}

export { quoteImage, isDark };
