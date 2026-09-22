// قائمة_المتجر - أمر لعرض قائمة معلومات المتجر

import { getDatabase } from "../../src/lib/maro-database.js";
import config from "../../config.js";

const pluginConfig = {
  name: "قائمة_المتجر",
  alias: ["list"],
  category: "store",
  description: "📋 عرض قائمة معلومات المتجر",
  usage: ".قائمة_المتجر أو .قائمة_المتجر <الرقم>",
  example: ".قائمة_المتجر 1",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const lists = db.setting("storeLists") || [];

  if (lists.length === 0) {
    return m.reply(
      `📋 *لا توجد معلومات متجر*\n\n` +
        `لا توجد معلومات مضافة من قبل المدير حالياً 😔\n\n` +
        `يرجى التحقق لاحقاً أو التواصل مع المدير لمزيد من المعلومات.\n\n` +
        `_شكراً لاهتمامك_ 🙏`,
    );
  }

  const input = m.text?.trim();
  const idx = parseInt(input) - 1;

  if (!isNaN(idx) && idx >= 0 && idx < lists.length) {
    const l = lists[idx];
    let txt = `${l.content}`;

    if (l.image) {
      await sock.sendMessage(
        m.chat,
        { image: { url: l.image }, caption: txt },
        { quoted: m },
      );
      return;
    }
    if (l.video) {
      await sock.sendMessage(
        m.chat,
        { video: { url: l.video }, caption: txt },
        { quoted: m },
      );
      return;
    }
    return m.reply(txt);
  }

  let txt = `📋 *قائمة معلومات المتجر*\n\n`;
  txt += `المعلومات المتاحة حالياً 📝\n`;
  txt += `اكتب \`${m.prefix}قائمة_المتجر <الرقم>\` لعرض التفاصيل.\n\n`;

  for (let i = 0; i < lists.length; i++) {
    const l = lists[i];
    const mediaIcon = l.image ? "🖼️" : l.video ? "🎬" : "📝";
    txt += `*${i + 1}.* ${mediaIcon} *${l.name}*\n`;
  }
  txt += "\n";

  txt += `💡 _اكتب \`${m.prefix}قائمة_المتجر <الرقم>\` لقراءة تفاصيل المعلومات_`;

  await m.reply(txt);
}

export { pluginConfig as config, handler }