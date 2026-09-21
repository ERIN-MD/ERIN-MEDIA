import axios from 'axios';
import config from '../../config.js';
import te from '../../src/lib/maro-error.js';

async function xStalk(username) {
  try {
    const { data } = await axios.get(`https://twitterwebviewer.com/api/tweets/${username}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36' },
      timeout: 15000
    });

    const user = data?.data?.user;
    if (!user) throw new Error('الحساب غير موجود');

    return {
      status: true,
      result: {
        id: user.id,
        username: user.username,
        name: user.displayName,
        bio: user.bio,
        avatar: user.avatar,
        followers: user.followers,
        following: user.following,
        tweets: user.tweets,
        verified: user.verified,
        joined: user.joined,
        latestTweets: (data.data.tweets || []).slice(0, 3).map(v => ({
          id: v.id,
          content: v.content,
          createdAt: v.createdAt,
          likes: v.stats?.likes || 0,
          retweets: v.stats?.retweets || 0,
          replies: v.stats?.replies || 0,
          views: v.stats?.views || 0
        }))
      }
    };
  } catch (e) {
    return { status: false, message: e.message };
  }
}

const pluginConfig = {
  name: 'تجسس_تويتر',
  alias: [],
  category: 'stalker',
  description: 'استخراج معلومات حساب تويتر',
  usage: '.تجسس_تويتر <معرف>',
  example: '.تجسس_تويتر ashabul08',
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 10, energi: 1, isEnabled: true
};

async function handler(m, { sock }) {
  const username = m.args.join(' ')?.trim() || m.text?.trim();

  if (!username) {
    return m.reply(`🐦 *تجسس_تويتر*\n\n📌 مثال: \`${m.prefix}تجسس_تويتر ashabul08\``);
  }

  const cleanUsername = username.replace(/https?:\/\/.*?twitter\.com\//, '').replace(/[^a-zA-Z0-9_]/g, '');

  if (!cleanUsername) {
    return m.reply('❌ اسم مستخدم غير صالح');
  }

  m.react('🔍');

  try {
    const res = await xStalk(cleanUsername);

    if (!res?.status || !res?.result) {
      m.react('❌');
      return m.reply('❌ الحساب غير موجود');
    }

    const r = res.result;
    let text = `🐦 *${r.name}*\n@${r.username}${r.verified ? ' ✅' : ''}\n\n`;
    text += `📝 ${r.bio || 'لا يوجد وصف'}\n\n`;
    text += `👥 *المتابعون:* ${r.followers || 0}\n`;
    text += `🔁 *يتابع:* ${r.following || 0}\n`;
    text += `🐤 *التغريدات:* ${r.tweets || 0}\n`;
    text += `📅 *الانضمام:* ${r.joined || '?'}\n\n`;

    if (r.latestTweets?.length) {
      text += `📌 *آخر التغريدات:*\n`;
      for (const t of r.latestTweets) {
        text += `• ${t.content?.substring(0, 50)}... (❤️${t.likes} 🔁${t.retweets})\n`;
      }
    }

    text += `\n🔗 https://twitter.com/${r.username}`;

    if (r.avatar) {
      await sock.sendMessage(m.chat, {
        image: { url: r.avatar },
        caption: text,
        footer: '🐦 تجسس_تويتر'
      }, { quoted: m });
    } else {
      await m.reply(text);
    }

    m.react('✅');
  } catch (error) {
    console.error('Twitter Error:', error);
    m.react('❌');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };