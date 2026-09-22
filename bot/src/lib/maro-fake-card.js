import { escapeXml, splitLines } from "./maro-brat.js";

async function avatarDataUri(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return null;
  try {
    const { default: sharp } = await import("sharp");
    const png = await sharp(buffer, { limitInputPixels: 268402689 })
      .rotate()
      .resize(180, 180, { fit: "cover", position: "centre" })
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

async function loadCardAvatar(m, sock) {
  try {
    if (m?.isImage) return await m.download();
    if (m?.quoted?.isImage || m?.quoted?.type === "imageMessage") return await m.quoted.download();
  } catch {
    // Continue with the profile-picture fallback.
  }
  try {
    const profileUrl = await sock?.profilePictureUrl?.(m?.sender, "image");
    if (!profileUrl) return null;
    const response = await fetch(profileUrl, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

async function fakeCardImage({ title, name, subtitle = "Tarboo Bot", primary = "#101827", secondary = "#f59e0b", avatarBuffer = null }) {
  const lines = splitLines(name, 20, 3);
  const avatar = await avatarDataUri(avatarBuffer);
  const nameNodes = lines
    .map((line, index) => `<text x="${avatar ? 300 : 72}" y="${490 + index * 100}" font-size="82" font-weight="700">${escapeXml(line)}</text>`)
    .join("");
  const avatarNode = avatar ? `<defs><clipPath id="avatarClip"><circle cx="170" cy="340" r="100"/></clipPath></defs><circle cx="170" cy="340" r="108" fill="${secondary}"/><image href="${avatar}" x="70" y="240" width="200" height="200" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarClip)"/>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="${primary}"/><stop offset="1" stop-color="#05070c"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/><circle cx="1070" cy="100" r="230" fill="${secondary}" opacity="0.18"/><path d="M0 520 L1200 320 L1200 630 L0 630Z" fill="${secondary}" opacity="0.14"/><rect x="56" y="56" width="1088" height="518" rx="32" fill="none" stroke="${secondary}" stroke-width="5" opacity="0.8"/>${avatarNode}<text x="${avatar ? 300 : 72}" y="160" fill="${secondary}" font-size="44" font-family="Arial, Noto Sans Arabic, sans-serif" font-weight="700">${escapeXml(title)}</text><g fill="#ffffff" font-family="Arial, Noto Sans Arabic, sans-serif" direction="auto" unicode-bidi="plaintext">${nameNodes}</g><text x="${avatar ? 300 : 72}" y="548" fill="#d1d5db" font-size="28" font-family="Arial, Noto Sans Arabic, sans-serif">${escapeXml(subtitle)}</text></svg>`;
  return Buffer.from(svg, "utf8");
}

export { fakeCardImage, avatarDataUri, loadCardAvatar };
