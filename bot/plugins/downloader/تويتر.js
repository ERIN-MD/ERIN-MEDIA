import axios from 'axios';
import config from '../../config.js';
import te from '../../src/lib/maro-error.js';

async function xdl(link) {
  const id = link.match(/status\/(\d+)/)?.[1];
  if (!id) throw new Error('الرابط غير صالح');

  const { data } = await axios.get(`https://api.fxtwitter.com/status/${id}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });

  const media = data.tweet?.media?.all?.[0];
  if (!media) throw new Error('لا يوجد وسائط');

  let dl = media.variants?.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0]?.url || media.url;
  if (!dl) throw new Error('رابط التحميل غير موجود');

  const res = await axios({
    url: dl,
    method: "GET",
    responseType: "arraybuffer",
    headers: { "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36" }
  });

  return {
    buffer: Buffer.from(res.data),
    type: media.type === "photo" ? "image" : "video",
    tweet: data.tweet?.text || ''
  };
}

const pluginConfig = {
  name: 'تويتر',
  alias: ['x', 'twitter'],
  category: 'downloader',
  description: 'تحميل فيديوهات وصور تويتر',
  usage: '.تويتر <رابط>',
  example: '.تويتر https://x.com/user/status/123',
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 10, energi: 1, isEnabled: true
};

async function handler(m, { sock }) {
  const url = m.text?.trim();

  if (!url || !url.includes('x.com') && !url.includes('twitter.com')) {
    return m.reply(`🐦 *تويتر*\n\n📌 مثال: \`${m.prefix}تويتر https://x.com/user/status/123\``);
  }

  m.react('⏳');

  try {
    const result = await xdl(url);
    const caption = result.tweet ? `🐦 ${result.tweet.substring(0, 200)}` : '✅ *تم التحميل*';

    if (result.type === 'video') {
      await sock.sendMessage(m.chat, {
        video: result.buffer,
        caption: caption
      }, { quoted: m });
    } else {
      await sock.sendMessage(m.chat, {
        image: result.buffer,
        caption: caption
      }, { quoted: m });
    }

    m.react('✅');
  } catch (error) {
    console.error('Twitter DL Error:', error);
    m.react('❌');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };