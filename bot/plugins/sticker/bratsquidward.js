import config from "../../config.js";
import { bratImage } from "../../src/lib/maro-brat.js";
const pluginConfig = {
  name: "bratsquidward",
  alias: [],
  category: "sticker",
  description: "Membuat sticker brat squidward",
  usage: ".bratsquidward <text>",
  example: ".bratsquidward Hai semua",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const text = m.args.join(" ");
  if (!text) {
    return m.reply(
      `🖼️ *BRAT SQUIDWARD*\n\n> Masukkan teks\n\n\`Contoh: ${m.prefix}bratsquidward Hai semua\``,
    );
  }

  m.react("🕕");

  try {
    await sock.sendImageAsSticker(m.chat, bratImage(text, "squidward"), m, {
      packname: config.sticker.packname,
      author: config.sticker.author,
    });
    m.react("✅");
  } catch (error) {
    console.error("Brat Squidward Error:", error);
    m.react("❌");
  }
}

export { pluginConfig as config, handler };
