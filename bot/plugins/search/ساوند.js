import te from "../../src/lib/maro-error.js";
import { load } from "cheerio";
import fetch from "node-fetch";

// ═══════════════════════════════════════════════
// 🔍 بحث SoundCloud
// ═══════════════════════════════════════════════
async function scSearch(q) {
  const url = "https://m.soundcloud.com/search?q=" + encodeURIComponent(q);
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
  const html = await res.text();
  const $ = load(html);
  const jsonText = $("#__NEXT_DATA__").text();
  if (!jsonText) return [];
  const json = JSON.parse(jsonText);

  const tracks = json.props.pageProps.initialStoreState.entities.tracks;
  if (!tracks) return [];

  const result = Object.values(tracks)
    .filter((v) => v && v.data && v.data.title)
    .map((v) => {
      const d = v.data;
      return {
        id: d.id || "-",
        title: d.title || "-",
        url: d.permalink_url || "-",
        user_id: d.user_id || "-",
        artwork: d.artwork_url || null,
        duration: d.duration || "-",
        plays: d.playback_count || "-",
        likes: d.likes_count || "-",
        comments: d.comment_count || "-",
        reposts: d.reposts_count || "-",
        created_at: d.created_at || "-",
      };
    });

  return result;
}

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "ساوند",
  alias: ["sc"],
  category: "search",
  description: "بحث عن أغاني في SoundCloud",
  usage: ".ساوند <اسم الأغنية>",
  example: ".ساوند Only We Know",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 5, energi: 1, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎵 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const query = m.args.join(" ");

  if (!query) {
    return m.reply(`🎵 *SoundCloud*\n\n📌 مثال: \`${m.prefix}ساوند Only We Know\``);
  }

  await m.react("⏳");

  try {
    const data = await scSearch(query);
    if (!data.length) {
      return m.reply(`❌ لم يتم العثور على أغاني`);
    }

    let thumb = data.find((v) => v.artwork)?.artwork || null;
    let txt = `🎧 *نتائج البحث*\n\n`;
    const limit = Math.min(data.length, 5);
    for (let i = 0; i < limit; i++) {
      txt += `🎵 *${data[i].title}*\n`;
      txt += `🔗 ${data[i].url}\n`;
      txt += `👁️ ${data[i].plays} | ❤️ ${data[i].likes}\n`;
      if (i < limit - 1) txt += `\n`;
    }
    txt += `\nلتحميل الأغنية استخدم \`${m.prefix}ساوند_تحميل\``;

    if (thumb) {
      await sock.sendMedia(m.chat, thumb, txt.trim(), m, { type: "image" });
    } else {
      await m.reply(txt.trim());
    }
    await m.react("✅");
  } catch (e) {
    m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler, scSearch };