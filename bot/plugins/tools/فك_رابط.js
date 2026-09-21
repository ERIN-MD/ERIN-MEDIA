import axios from 'axios';
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "فك_رابط",
  alias: ["sfl", "bypass", "فك_رابط"],
  category: "tools",
  description: "فك روابط SFL المختصرة",
  usage: ".فك_رابط <رابط_SFL>",
  example: ".فك_رابط https://sfl.gl/xxxx",
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const text = m.args.join(" ");
  
  if (!text || !text.includes('sfl.gl')) {
    return m.reply(`🔓 *فك روابط SFL*\n\n📌 ${m.prefix}${m.command} https://sfl.gl/xxxx`);
  }

  m.react('⏳');

  try {
    const { data } = await axios.get(`https://api.theresav.biz.id/bypass/sfl`, {
      params: { url: text },
      timeout: 60000
    });

    if (!data?.status || !data?.data?.bypassed_url) {
      throw new Error('فشل فك الرابط');
    }

    const res = data.data;
    let caption = `🔓 *تم فك الرابط*\n\n`;
    caption += `🔗 *الأصلي:* ${res.original_url || text}\n`;
    caption += `✅ *المفكوك:* ${res.bypassed_url}\n`;
    if (res.stats?.duration) caption += `⏱️ *الوقت:* ${res.stats.duration}s\n`;

    await sock.sendMessage(m.chat, { text: caption }, { quoted: m });
    m.react('✅');

  } catch (error) {
    console.log(error);
    m.react('❌');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };