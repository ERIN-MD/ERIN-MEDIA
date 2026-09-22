import { generateWAMessageFromContent, prepareWAMessageMedia } from "maro";
import te from "../../src/lib/maro-error.js";
import { f } from "../../src/lib/maro-http.js";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "صوره",
  alias: ["pap"],
  category: "search",
  description: "صور عشوائية من Pinterest",
  usage: ".صوره <cewe/cowo/femboy>",
  example: ".صوره cewe",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 5, energi: 1, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 📸 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const arg = m.args[0]?.toLowerCase();
  const validTypes = ["cewe", "cowo", "femboy"];

  if (!arg || !validTypes.includes(arg)) {
    return m.reply(`❌ اختر نوع: \`cewe\`, \`cowo\`, \`femboy\`\n\n📌 مثال: \`${m.prefix}صوره cewe\``);
  }

  await m.react("⏳");

  try {
    const data = await f(`https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(arg)}`);
    const results = data?.data;
    if (!results || results.length === 0) {
      await m.react("❌");
      return m.reply(`❌ لا توجد نتائج حالياً`);
    }

    const randomItem = results[Math.floor(Math.random() * results.length)];
    const imageUrl = randomItem.image_url;
    if (!imageUrl) {
      await m.react("❌");
      return m.reply("⚠️ الصورة غير متاحة");
    }

    const mediaMessage = await prepareWAMessageMedia({ image: { url: imageUrl } }, { upload: sock.waUploadToServer });

    const msg = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: { title: "", subtitle: "", hasMediaAttachment: true, imageMessage: mediaMessage.imageMessage },
            body: { text: `📸 *${arg.toUpperCase()}*` },
            footer: { text: "اختر من الأسفل 👇" },
            nativeFlowMessage: {
              buttons: [
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🔁 التالي", id: `${m.prefix}صوره ${arg}` }) },
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "👧 بنت", id: `${m.prefix}صوره cewe` }) },
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "👦 ولد", id: `${m.prefix}صوره cowo` }) },
              ]
            }
          }
        }
      }
    }, { quoted: m, userJid: sock.user.jid });

    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    await m.react("✅");

  } catch (error) {
    console.error("[PAP]", error.message);
    await m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };