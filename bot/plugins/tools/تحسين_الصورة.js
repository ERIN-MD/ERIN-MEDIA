// تحسين_الصورة - أمر لتحسين جودة الصورة إلى HD

const config = {
  name: "تحسين_الصورة",
  alias: ["remini"],
  category: "tools",
  description: "تكبير الصورة محلياً بجودة عالية",
  usage: ".تحسين_الصورة (رد على صورة)",
  example: ".تحسين_الصورة",
  cooldown: 15,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const img = m.isImage || (m.quoted && m.quoted.type === "imageMessage");

  if (!img) {
    return m.reply(
      `*🪁 تحسين الصورة إلى HD*\n> رد على صورة\n\n\`\`\`${m.prefix}تحسين_الصورة\`\`\``,
    );
  }

  m.react("🕕");

  try {
    const input = m.quoted?.isMedia ? await m.quoted.download() : await m.download();
    const { default: sharp } = await import("sharp");
    const source = sharp(input, { limitInputPixels: 268402689 }).rotate();
    const metadata = await source.metadata();
    const width = Math.min(Math.max((metadata.width || 512) * 2, 512), 4096);
    const height = Math.min(Math.max((metadata.height || 512) * 2, 512), 4096);
    const enhanced = await source
      .resize(width, height, { fit: "inside", kernel: sharp.kernel.lanczos3, withoutEnlargement: false })
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();

    await sock.sendMessage(m.chat, { image: enhanced, caption: "تم تكبير الصورة محلياً." }, { quoted: m });
    m.react("✅");
  } catch (e) {
    console.error("Local image enhancement error:", e);
    m.react("❌");
  }
}

export { config, handler };
