import axios from 'axios';
import config from '../../config.js';
import te from '../../src/lib/maro-error.js';

async function tiktokStalk(profile) {
  try {
    const { data } = await axios.post(
      "https://tools.xrespond.com/api/tiktok/profile/details",
      { profile },
      {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Origin": "https://slidesigma.com",
          "Referer": "https://slidesigma.com/"
        },
        timeout: 15000
      }
    );

    const user = data.data.data.user;
    const stats = data.data.data.stats;

    return {
      status: true,
      result: {
        nama: user.nickname,
        bio: user.signature,
        avatar: user.avatarLarger || user.avatarMedium || user.avatarThumb,
        mengikuti: stats.followingCount,
        pengikut: stats.followerCount,
        totalSuka: stats.heartCount,
        jumlahVideo: stats.videoCount,
        jumlahDisukai: stats.diggCount
      }
    };
  } catch (error) {
    return { status: false, message: error.message };
  }
}

const pluginConfig = {
  name: 'تجسس_تيكتوك',
  alias: [],
  category: 'stalker',
  description: 'استخراج معلومات حساب تيكتوك',
  usage: '.تجسس_تيكتوك <معرف>',
  example: '.تجسس_تيكتوك khaby00',
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 10, energi: 1, isEnabled: true
};

async function handler(m, { sock }) {
  const username = m.args.join(' ')?.trim() || m.text?.trim();

  if (!username) {
    return m.reply(`🎵 *تجسس_تيكتوك*\n\n📌 مثال: \`${m.prefix}تجسس_تيكتوك khaby00\``);
  }

  const cleanUsername = username.replace(/https?:\/\/.*?tiktok\.com\/@?/, '').replace(/[^a-zA-Z0-9._-]/g, '');

  if (!cleanUsername) {
    return m.reply('❌ اسم مستخدم غير صالح');
  }

  m.react('🔍');

  try {
    const res = await tiktokStalk(cleanUsername);

    if (!res?.status || !res?.result) {
      m.react('❌');
      return m.reply(`❌ ${res?.message || 'الحساب غير موجود'}`);
    }

    const r = res.result;
    const caption = 
      `🎵 *${r.nama}*\n\n` +
      `📝 ${r.bio || 'لا يوجد وصف'}\n\n` +
      `👥 *المتابعون:* ${r.pengikut || 0}\n` +
      `🔁 *يتابع:* ${r.mengikuti || 0}\n` +
      `❤️ *الإعجابات:* ${r.totalSuka || 0}\n` +
      `🎬 *الفيديوهات:* ${r.jumlahVideo || 0}\n\n` +
      `🔗 https://tiktok.com/@${cleanUsername}`;

    if (r.avatar) {
      await sock.sendMessage(m.chat, {
        image: { url: r.avatar },
        caption: caption,
        footer: '🎵 تجسس_تيكتوك'
      }, { quoted: m });
    } else {
      await m.reply(caption);
    }

    m.react('✅');
  } catch (error) {
    console.error('TikTok Stalk Error:', error);
    m.react('❌');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };