import { aiodl } from "../../src/scraper/aio.js";
import te from "../../src/lib/maro-error.js";
import { saluranCtx } from "../../src/lib/maro-context.js";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "aio",
  alias: ["تحميل", "تنزيل"],
  category: "downloader",
  description: "محمل شامل (انستغرام، تيكتوك، فيسبوك، تويتر، يوتيوب، بنترست، كاب كات، وغيرها)",
  usage: ".aio <رابط>",
  example: ".aio https://instagram.com/p/xxx",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎯 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const url = m.text?.trim();

  // ─────────────────────────────────────────────
  // ❓ لم يرسل رابطاً
  // ─────────────────────────────────────────────
  if (!url) {
    return m.reply(
      `📥 *محمل شامل*\n\n` +
      `> تحميل من مختلف المنصات!\n\n` +
      `╭┈┈⬡「 🌐 *المنصات* 」\n` +
      `┃ • انستغرام\n` +
      `┃ • تيكتوك\n` +
      `┃ • فيسبوك\n` +
      `┃ • تويتر/X\n` +
      `┃ • يوتيوب\n` +
      `┃ • بنترست\n` +
      `┃ • كاب كات\n` +
      `┃ • ثريدز / ريديت\n` +
      `╰┈┈┈┈┈┈┈┈⬡\n\n` +
      `> *مثال:* ${m.prefix}تحميل https://instagram.com/p/xxx`
    );
  }

  if (!url.startsWith("http")) {
    return m.reply(`❌ رابط غير صالح! يجب أن يبدأ بـ http/https`);
  }

  await m.react("⏳");

  try {
    const result = await aiodl(url);

    if (!result?.media?.length) {
      await m.react("❌");
      return m.reply(`❌ فشل جلب الوسائط. تأكد من صحة الرابط.`);
    }

    const ctxInfo = saluranCtx();

    for (const item of result.media) {
      if (item.type === "video") {
        await sock.sendMedia(m.chat, item.url, result.title || null, m, {
          type: "video", contextInfo: ctxInfo,
        });
      } else if (item.type === "audio") {
        await sock.sendMessage(m.chat, {
          audio: { url: item.url }, mimetype: "audio/mpeg", contextInfo: ctxInfo,
        }, { quoted: m });
      } else {
        await sock.sendMedia(m.chat, item.url, result.title || null, m, {
          type: "image", contextInfo: ctxInfo,
        });
      }
      break;
    }

    await m.react("✅");
  } catch (error) {
    await m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };