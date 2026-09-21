import config from "../../config.js";
import { bratImage } from "../../src/lib/maro-brat.js";
const pluginConfig = {
  name: "bratwhite",
  alias: [],
  category: "sticker",
  description: "Membuat sticker brat white",
  usage: ".bratwhite <text>",
  example: ".bratwhite Hai semua",
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
      `🖼️ *BRAT WHITE*\n\n> Masukkan teks\n\n\`Contoh: ${m.prefix}bratwhite Hai semua\``,
    );
  }

  m.react("🕕");

  try {
    await sock.sendImageAsSticker(m.chat, bratImage(text, "white"), m, {
      packname: config.sticker.packname,
      author: config.sticker.author,
    });
    m.react("✅");
  } catch (error) {
    console.error("Brat White Error:", error);
    m.react("❌");
  }
}

export { pluginConfig as config, handler };
