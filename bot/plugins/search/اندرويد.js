import { getAssetBuffer } from "../../src/lib/maro-asset-manager.js";
import axios from "axios";
import config from "../../config.js";
import fs from "fs";
import { getDatabase } from "../../src/lib/maro-database.js";
import te from "../../src/lib/maro-error.js";

const NEOXR_APIKEY = config.APIkey?.neoxr || "Milik-Bot-MaroMD";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "اندرويد",
  alias: ["an1"],
  category: "search",
  description: "بحث وتحميل APK MOD",
  usage: ".اندرويد <بحث>",
  example: ".اندرويد Subway Surfer",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 10, energi: 1, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎯 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const db = getDatabase();
  const text = m.text?.trim();

  if (!text) {
    return m.reply(
      `📱 *بحث اندرويد*\n\n` +
      `╭┈┈⬡「 📋 *الاستخدام* 」\n` +
      `┃ 🔍 \`${m.prefix}اندرويد <بحث>\`\n` +
      `╰┈┈⬡\n\n` +
      `> مثال:\n` +
      `\`${m.prefix}اندرويد Subway Surfer\``
    );
  }

  m.react("🔍");

  try {
    const { data } = await axios.get(
      `https://api.neoxr.eu/api/an1?q=${encodeURIComponent(text)}&apikey=${NEOXR_APIKEY}`,
      { timeout: 30000 }
    );

    if (!data?.status || !data?.data?.length) {
      m.react("❌");
      return m.reply(`❌ لم يتم العثور على نتائج لـ: \`${text}\``);
    }

    const apps = data.data.slice(0, 10);

    if (!db.db.data.sessions) db.db.data.sessions = {};
    const sessionKey = `an1_${m.sender}`;
    db.db.data.sessions[sessionKey] = { results: apps, query: text, timestamp: Date.now() };
    db.save();

    let caption = `📱 نتائج البحث عن *${text}*\n`;
    caption += `*${apps.length}* تطبيق تم العثور عليه\n\n`;

    apps.forEach((app, i) => {
      caption += `*${i + 1}.* ${app.name}\n`;
      caption += `   ├ 👤 ${app.developer}\n`;
      caption += `   └ ⭐ ${app.rating}/5\n\n`;
    });

    caption += `> اختر رقماً للتحميل المباشر`;

    const buttons = apps.slice(0, 10).map((app, i) => ({
      title: `${i + 1}. ${app.name.substring(0, 20)}`,
      description: `${app.developer} • ⭐${app.rating}`,
      id: `${m.prefix}android1-get ${app.url}`,
    }));

    m.react("✅");
    await sock.sendButton(
      m.chat,
      getAssetBuffer("maro"),
      caption,
      m,
      {
        buttons: [{
          name: "single_select",
          buttonParamsJson: JSON.stringify({
            title: "اختر APK",
            sections: [{ title: "التطبيقات", rows: buttons }],
          }),
        }],
        footer: "📱 بحث اندرويد",
      },
    );
  } catch (err) {
    m.react("❌");
    return m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };