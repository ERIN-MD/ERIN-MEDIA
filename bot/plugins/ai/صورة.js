import axios from 'axios';
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "صورة",
  alias: ["صورة", "صوره", "image", "img", "توليد", "generate", "رسم"],
  category: "ai",
  description: "توليد صور بالذكاء الاصطناعي",
  usage: ".صورة <وصف_الصورة>",
  example: ".صورة فتاة انمي",
  isOwner: false,
  cooldown: 30,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const text = m.args.join(" ");
  
  if (!text) {
    return m.reply(`🎨 *توليد الصور*\n\n📌 ${m.prefix}${m.command} وصف الصورة`);
  }

  m.react('🎨');

  try {
    const { data } = await axios.get(
      `https://omegatech-api.dixonomega.tech/api/ai/nano-banana-pro?prompt=${encodeURIComponent(text)}`,
      { timeout: 90000 }
    );

    if (!data.success || !data.image) throw new Error('فشل');

    await sock.sendMessage(m.chat, {
      image: { url: data.image },
      caption: `🎨 ${text}`
    }, { quoted: m });

    m.react('✅');

  } catch (error) {
    m.react('❌');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };