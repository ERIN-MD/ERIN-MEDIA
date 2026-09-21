import config from "../../config.js";
import { bratImage } from "../../src/lib/maro-brat.js";

const pluginConfig = {
  name: "2انمي_برات",
  alias: ["bratanime", "bratanime"],
  category: "sticker",
  description: "صنع ستيكر برات انمي",
  usage: ".انمي_برات <نص>",
  example: ".انمي_برات مرحبا",
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
    return m.reply(`🖼️ *2انمي_برات*\n\n📌 مثال: \`${m.prefix}انمي_برات مرحبا\``);
  }

  m.react("🕕");

  try {
    await sock.sendImageAsSticker(m.chat, bratImage(text, "anime"), m, {
      packname: config.sticker.packname,
      author: config.sticker.author,
    });
    m.react("✅");
  } catch (error) {
    console.error("Brat Anime Error:", error);
    m.react("❌");
  }
}

export { pluginConfig as config, handler };
