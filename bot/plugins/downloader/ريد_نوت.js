import { RedNoteDL } from "../../src/scraper/rednote.js";

const pluginConfig = {
  name: "ريد_نوت",
  alias: ["rednote"," ريدنوت"],
  category: "downloader",
  description: "تحميل فيديو/صورة من ريد نوت (شياوهونغشو)",
  usage: ".ريد_نوت <رابط>",
  example: ".ريد_نوت https://www.xiaohongshu.com/xxx",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const text = m.text?.trim();
  if (!text) {
    m.react("❌");
    return m.reply(
      `📕 *محمل ريد نوت*\n\n` +
        `تحميل فيديو أو صورة من شياوهونغشو (ريد نوت).\n\n` +
        `*الاستخدام:*\n` +
        `> *${m.prefix}ريد_نوت <رابط>*\n\n` +
        `*مثال:*\n` +
        `> *${m.prefix}ريد_نوت https://www.xiaohongshu.com/xxx*`,
    );
  }

  m.react("🕕");

  try {
    const result = await RedNoteDL(text);

    if (!result.status) {
      m.react("☢");
      return m.reply(`❌ *فشل ريد نوت*\n\n> ${result.error}`);
    }

    if (result.type === "video" && result.results?.[0]) {
      await sock.sendMedia(m.chat, result.results[0], result.title, m, {
        type: "video",
      });
    } else if (result.results?.length > 0) {
      for (let i = 0; i < Math.min(result.results.length, 5); i++) {
        await sock.sendMedia(m.chat, result.results[i], "", m, {
          type: "image",
        });
      }
      if (result.results.length > 5) {
        await m.reply(
          `_يوجد ${result.results.length - 5} صور أخرى، الحد الأقصى 5_`,
        );
      }
    }

    m.react("✅");
  } catch (e) {
    console.error(e);
    m.react("☢");
    m.reply("❌ فشل جلب بيانات ريد نوت، حاول مجدداً لاحقاً");
  }
}

export { pluginConfig as config, handler };