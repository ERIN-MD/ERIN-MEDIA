import crypto from "crypto";
import { generateWAMessage, generateWAMessageFromContent, jidNormalizedUser } from "maro";
import te from "../../src/lib/maro-error.js";
import { tiktokSearchVideo } from "../../src/scraper/tiktoksearch.js";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "تيك_البوم",
  alias: ["tts"],
  category: "search",
  description: "بحث عن فيديوهات تيكتوك (ألبوم)",
  usage: ".تيك_البوم <بحث>",
  example: ".تيك_البوم anime",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 15, energi: 1, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎵 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const query = m.args.join(" ")?.trim();

  if (!query) {
    return m.reply(`🎵 *تيك البوم*\n\n📌 مثال: \`${m.prefix}تيك_البوم anime\``);
  }

  m.react("🔍");

  try {
    const videos = await tiktokSearchVideo(query);

    if (!videos || videos.length === 0) {
      m.react("❌");
      return m.reply(`❌ لم يتم العثور على فيديوهات لـ: ${query}`);
    }

    const maxShow = Math.min(videos.length, 5);
    const mediaList = videos.slice(0, maxShow).map((video) => ({
      video: { url: video.link },
      mimetype: "video/mp4",
      caption: `🎵 *${video.title || "-"}*\n👤 ${video.author?.nickname || "-"}\n👀 ${video.stats?.plays || 0} | ❤️ ${video.stats?.likes || 0}`,
      contextInfo: { forwardingScore: 99, isForwarded: true },
    }));

    try {
      const opener = generateWAMessageFromContent(m.chat, {
        messageContextInfo: { messageSecret: crypto.randomBytes(32) },
        albumMessage: { expectedImageCount: 0, expectedVideoCount: mediaList.length },
      }, { userJid: jidNormalizedUser(sock.user.id), quoted: m, upload: sock.waUploadToServer });

      await sock.relayMessage(opener.key.remoteJid, opener.message, { messageId: opener.key.id });

      const generatedMessages = await Promise.all(
        mediaList.map(async (content) => {
          const msg = await generateWAMessage(opener.key.remoteJid, content, { upload: sock.waUploadToServer });
          msg.message.messageContextInfo = {
            messageSecret: crypto.randomBytes(32),
            messageAssociation: { associationType: 1, parentMessageKey: opener.key },
          };
          return msg;
        }),
      );

      for (const msg of generatedMessages) {
        await sock.relayMessage(msg.key.remoteJid, msg.message, { messageId: msg.key.id });
      }
    } catch {
      for (const content of mediaList) {
        await sock.sendMessage(m.chat, content, { quoted: m });
      }
    }

    m.react("✅");
  } catch (error) {
    m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler, tiktokSearchVideo };