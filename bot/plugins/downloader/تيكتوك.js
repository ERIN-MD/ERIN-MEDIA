import ttdown from "../../src/scraper/tiktok.js";
import { tiktokSearchVideo } from "../../src/scraper/tiktoksearch.js";
import { AIRich } from "../../src/lib/maro-builder.js";

function formatNumber(integer) {
  let numb = parseInt(integer);
  return Number(numb).toLocaleString().replace(/,/g, ".");
}

function formatDate(n, locale = "en") {
  let d = new Date(n);
  return d.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
}

async function tiktokDl(url) {
  const result = await ttdown(url);
  return {
    status: true,
    title: result.title || "TikTok",
    cover: result.cover || null,
    data: result.downloads || [],
    author: {
      fullname: result.author?.username || "",
      nickname: result.author?.username || "غير معروف",
      avatar: result.author?.avatar || null,
    },
    stats: { views: "-", likes: "-", comment: "-", share: "-", download: "-" },
    music_info: { title: "-", author: "-", url: result.downloads?.find((item) => item.type === "mp3")?.url || null },
  };
}

const pluginConfig = {
  name: ["تيكتوك", "tt", "ttmp4"],
  alias: ["tiktokdl", "ttdown", "ttplay", "tk"],
  category: "downloader",
  description: "تحميل فيديو تيكتوك أو البحث عنه",
  usage: ".تيكتوك <رابط> أو .تيكتوك <بحث>",
  example: ".تيكتوك رقص",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

async function sendTikTokResult(sock, m, result, videoUrl, prefix) {
  const builder = new AIRich(sock);

  const videoItem = result.data?.find((entry) => entry.type === "nowatermark_hd" || entry.type === "nowatermark");
  if (videoItem?.url) {
    builder.addVideo(videoItem.url);

    const authorText = `> 👤 *الناشر:* ${result.author.nickname} (@${result.author.fullname})\n`;
    const descText = `> 📝 *الوصف:* ${result.title || "-"}\n`;
    const musicText = `> 🎵 *الموسيقى:* ${result.music_info.title} - ${result.music_info.author}\n`;
    builder.addText("# تحميل تيكتوك\n\n" + authorText + descText + musicText);

    builder.addTable([
      ["👀 المشاهدات", "❤️ الإعجابات", "💬 التعليقات", "🔁 المشاركات", "📥 التحميلات"],
      [result.stats.views, result.stats.likes, result.stats.comment, result.stats.share, result.stats.download]
    ]);

    await builder.send(m.chat, { quoted: m });

    await sock.sendMessage(m.chat, {
      text: "🎵 *تحميل الصوت*",
      footer: "اختر الزر أدناه",
      interactiveButtons: [{
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: "📩 تحميل الصوت",
          id: `${prefix}ttmp3 ${videoUrl}`,
        }),
      }],
    }, { quoted: m });
  } else {
    const slides = result.data?.map((zan) => ({ image: { url: zan.url } }));
    await sock.sendMessage(m.chat, { albumMessage: slides }, { quoted: m });
  }
}

async function handler(m, { sock }) {
  const query = m.args.join(" ")?.trim();
  const prefix = m.prefix;

  if (!query) {
    return m.reply(`🎵 *تيكتوك*\n\n📌 *رابط:* \`${prefix}تيكتوك <رابط>\`\n📌 *بحث:* \`${prefix}تيكتوك <بحث>\``);
  }

  // رابط مباشر
  if (query.includes("tiktok.com")) {
    m.react("⏳");
    try {
      const result = await tiktokDl(query);
      await sendTikTokResult(sock, m, result, query, prefix);
      m.react("✅");
      return;
    } catch (e) {
      console.error(e);
      m.react("❌");
      return m.reply("❌ فشل التحميل.");
    }
  }

  // بحث
  m.react("🔍");
  try {
    const videos = await tiktokSearchVideo(query);
    if (!videos?.length) {
      m.react("❌");
      return m.reply(`❌ لم يتم العثور على فيديوهات`);
    }

    const firstVideo = videos[0];
    const videoUrl = firstVideo.link;

    if (!videoUrl) {
      m.react("❌");
      return m.reply(`❌ رابط الفيديو غير موجود`);
    }

    const result = await tiktokDl(videoUrl);
    await sendTikTokResult(sock, m, result, videoUrl, prefix);
    m.react("✅");

  } catch (error) {
    console.error(error);
    m.react("❌");
    m.reply(`❌ فشل البحث: ${error.message}`);
  }
}

export { pluginConfig as config, handler };
