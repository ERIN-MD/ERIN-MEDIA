const VARIANTS = {
  classic: { background: "#000000", foreground: "#ffffff", accent: "#ffffff" },
  green: { background: "#b7ff00", foreground: "#000000", accent: "#000000" },
  white: { background: "#ffffff", foreground: "#000000", accent: "#000000" },
  hd: { background: "#101010", foreground: "#ffffff", accent: "#d4af37" },
  anime: { background: "#ffd6ef", foreground: "#29132a", accent: "#6b2d5c" },
  bahlil: { background: "#e2d7bc", foreground: "#1e1a14", accent: "#765a2a" },
  patrick: { background: "#ff9caf", foreground: "#36121a", accent: "#4fce9b" },
  squidward: { background: "#a6d9d1", foreground: "#153632", accent: "#6b836f" },
};

function escapeXml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function splitLines(text, maxLength = 17, maxLines = 5) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxLength && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = next;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines.length ? lines : ["brat"];
}

function bratImage(text, variant = "classic") {
  const theme = VARIANTS[variant] || VARIANTS.classic;
  const lines = splitLines(text);
  const fontSize = lines.length <= 2 ? 158 : lines.length === 3 ? 130 : 108;
  const lineHeight = fontSize * 1.08;
  const firstY = 512 - ((lines.length - 1) * lineHeight) / 2;
  const lineNodes = lines
    .map((line, index) => `<text x="512" y="${Math.round(firstY + index * lineHeight)}" text-anchor="middle">${escapeXml(line)}</text>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="${theme.background}"/><rect x="38" y="38" width="948" height="948" rx="44" fill="none" stroke="${theme.accent}" stroke-width="10" opacity="0.55"/><g fill="${theme.foreground}" font-family="Arial, Noto Sans Arabic, sans-serif" font-size="${fontSize}" font-weight="700" direction="auto" unicode-bidi="plaintext">${lineNodes}</g></svg>`;
  return Buffer.from(svg, "utf8");
}

export { bratImage, escapeXml, splitLines };
