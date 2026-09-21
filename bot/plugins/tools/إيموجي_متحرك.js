// إيموجي_متحرك - أمر لتحويل الإيموجي إلى ملصق متحرك

import axios from "axios";
import config from "../../config.js";
import te from "../../src/lib/maro-error.js";
import { saluranCtx } from "../../src/lib/maro-context.js";

const NEOXR_APIKEY = config.APIkey?.neoxr || "Milik-Bot-MaroMD";

const pluginConfig = {
  name: "إيموجي_متحرك",
  alias: ["emojitoanimasi"],
  category: "tools",
  description: "تحويل الإيموجي إلى ملصق متحرك",
  usage: ".إيموجي_متحرك <الإيموجي>",
  example: ".إيموجي_متحرك 😳",
  cooldown: 5,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const emoji = m.text?.trim();

  if (!emoji) {
    return m.reply(
      `🎭 *تحويل الإيموجي إلى ملصق متحرك*\n\n` +
        `> تحويل الإيموجي إلى ملصق متحرك\n\n` +
        `*مثال:*\n` +
        `> \`${m.prefix}إيموجي_متحرك 😳\``,
    );
  }

  m.react("🎭");

  try {
    const apiUrl = `https://api.neoxr.eu/api/emojito?q=${encodeURIComponent(emoji)}&apikey=${NEOXR_APIKEY}`;
    const { data } = await axios.get(apiUrl, { timeout: 15000 });

    if (!data?.status || !data?.data?.url) {
      m.react("❌");
      return m.reply("❌ *فشل*\n\n> الإيموجي غير موجود أو خطأ في الخادم");
    }

    const webpUrl = data.data.url;

    const webpRes = await axios.get(webpUrl, {
      responseType: "arraybuffer",
      timeout: 15000,
    });
    const webpBuffer = Buffer.from(webpRes.data);

    await sock.sendMessage(
      m.chat,
      {
        sticker: webpBuffer,
        contextInfo: saluranCtx(),
      },
      { quoted: m },
    );

    m.react("✅");
  } catch (error) {
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };