// ايموجي_لصورة - أمر لتحويل الإيموجي إلى صورة عالية الجودة (نمط Apple)

import axios from "axios";
import config from "../../config.js";
import te from "../../src/lib/maro-error.js";
import { saluranCtx } from "../../src/lib/maro-context.js";

const NEOXR_APIKEY = config.APIkey?.neoxr || "Milik-Bot-MaroMD";

const pluginConfig = {
  name: "ايموجي_لصورة",
  alias: ["emojitoimage"],
  category: "tools",
  description: "تحويل الإيموجي إلى صورة عالية الجودة (نمط Apple)",
  usage: ".ايموجي_لصورة <الإيموجي> [النمط]",
  example: ".ايموجي_لصورة 😳 apple",
  cooldown: 5,
  energi: 1,
  isEnabled: true,
};

const STYLES = [
  "apple",
  "google",
  "microsoft",
  "samsung",
  "whatsapp",
  "twitter",
  "facebook",
];

async function handler(m, { sock }) {
  const args = m.args || [];
  const emoji = args[0]?.trim();
  const style = args[1]?.toLowerCase() || "apple";

  if (!emoji) {
    return m.reply(
      `🖼️ *تحويل الإيموجي إلى صورة*\n\n` +
        `> تحويل الإيموجي إلى صورة عالية الجودة\n\n` +
        `*الصيغة:*\n` +
        `> \`${m.prefix}ايموجي_لصورة <الإيموجي> [النمط]\`\n\n` +
        `*مثال:*\n` +
        `> \`${m.prefix}ايموجي_لصورة 😳 apple\`\n\n` +
        `*الأنماط المتاحة:*\n` +
        `> ${STYLES.join(", ")}`,
    );
  }

  const validStyle = STYLES.includes(style) ? style : "apple";

  m.react("🖼️");

  try {
    const apiUrl = `https://api.neoxr.eu/api/emoimg?q=${encodeURIComponent(emoji)}&style=${validStyle}&apikey=${NEOXR_APIKEY}`;
    const { data } = await axios.get(apiUrl, { timeout: 15000 });

    if (!data?.status || !data?.data?.url) {
      m.react("❌");
      return m.reply("❌ *فشل*\n\n> الإيموجي غير موجود أو خطأ في الخادم");
    }

    const imgUrl = data.data.url;

    await sock.sendMedia(
      m.chat,
      imgUrl,
      `🖼️ *تحويل الإيموجي إلى صورة*\n\n> الإيموجي: ${emoji}\n> النمط: ${validStyle}\n> الكود: ${data.data.code || "-"}`,
      m,
      { type: "image", contextInfo: saluranCtx() },
    );

    m.react("✅");
  } catch (error) {
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };