import { load } from 'cheerio'
import config from "../../config.js";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "قرآن_صوتي",
  alias: ["murrotal"],
  category: "islamic",
  description: "استمع إلى تلاوة القرآن الكريم حسب السورة",
  usage: ".قرآن_صوتي <اسم السورة>",
  example: ".قرآن_صوتي الفاتحة",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const query = m.args?.join(" ")?.trim();

  if (!query) {
    return m.reply(
      `🎧 *القرآن صوتي*\n\n` +
        `> أدخل اسم السورة\n\n` +
        `\`مثال: ${m.prefix}قرآن_صوتي الفاتحة\`\n` +
        `\`مثال: ${m.prefix}قرآن_صوتي الرحمن\``,
    );
  }

  m.react("🔍");

  try {
    const res = await fetch("https://islamipedia.id/murottal/");
    const html = await res.text();
    const $ = load(html);

    const data = $(".surah-item")
      .map((i, el) => ({
        no: parseInt($(el).find("h5").text().split(".")[0]),
        surah: ($(el).attr("data-title") || "").toLowerCase(),
        arti: $(el).find("p").text().trim(),
        audio: $(el).attr("data-audio") || "",
      }))
      .get();

    const q = query.toLowerCase();
    const find = data.find((v) =>
      v.surah.replace(/[^a-z0-9]/g, "").includes(q.replace(/[^a-z0-9]/g, "")),
    );

    if (!find || !find.audio) {
      m.react("❌");
      return m.reply(`❌ سورة *${query}* غير موجودة`);
    }

    m.react("✅");
    await sock.sendMedia(m.chat, find.audio, null, m, { type: "audio" });
  } catch (e) {
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };