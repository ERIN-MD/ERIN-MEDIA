import config from '../../config.js';
import te from '../../src/lib/maro-error.js';
import axios from 'axios';

async function ytStalk(username) {
  try {
    const { data } = await axios.get(`https://www.youtube.com/@${username}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 15000
    });
    
    const json = data.split("var ytInitialData = ")[1].split(";</script>")[0];
    const yt = JSON.parse(json);
    const meta = yt.metadata.channelMetadataRenderer;
    const header = yt.header?.pageHeaderRenderer?.content?.pageHeaderViewModel;

    let usn = meta.vanityChannelUrl || "";
    usn = usn.replace("https://www.youtube.com/", "").replace("http://www.youtube.com/", "");

    let subscriber = "غير معروف";
    let videos = "غير معروف";
    
    try {
      const rows = header.metadata.contentMetadataViewModel.metadataRows;
      for (const row of rows) {
        for (const part of row.metadataParts) {
          const text = part.text.content;
          if (text.includes("subscriber")) subscriber = text;
          if (text.includes("video")) videos = text;
        }
      }
    } catch {}

    let profile = "";
    try { profile = meta.avatar.thumbnails.pop().url; } catch {}

    let banner = "";
    try { banner = yt.header.pageHeaderRenderer.content.pageHeaderViewModel.banner.imageBannerViewModel.image.sources.pop().url; } catch {}

    return {
      status: true,
      result: {
        name: meta.title,
        username: usn,
        subscriber,
        videos,
        profile,
        banner,
        url: `https://youtube.com/@${username}`
      }
    };
  } catch (e) {
    return { status: false, message: "القناة غير موجودة" };
  }
}

const pluginConfig = {
  name: 'تجسس_يوتيوب',
  alias: [],
  category: 'stalker',
  description: 'استخراج معلومات قناة يوتيوب',
  usage: '.تجسس_يوتيوب <معرف>',
  example: '.تجسس_يوتيوب VinssBotz',
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 10, energi: 1, isEnabled: true
};

async function handler(m, { sock }) {
  const username = m.args.join(' ')?.trim() || m.text?.trim();

  if (!username) {
    return m.reply(`🎬 *تجسس_يوتيوب*\n\n📌 مثال: \`${m.prefix}تجسس_يوتيوب VinssBotz\``);
  }

  const cleanUsername = username.replace(/https?:\/\/.*?youtube\.com\/@?/, '').replace(/[^a-zA-Z0-9_-]/g, '');

  if (!cleanUsername) {
    return m.reply('❌ اسم مستخدم غير صالح');
  }

  m.react('🔍');

  try {
    const res = await ytStalk(cleanUsername);

    if (!res?.status || !res?.result) {
      m.react('❌');
      return m.reply('❌ القناة غير موجودة');
    }

    const r = res.result;
    const caption = `🎬 *${r.name}*\n📱 @${r.username}\n👥 ${r.subscriber}\n🎥 ${r.videos}\n🔗 ${r.url}`;

    if (r.profile) {
      await sock.sendMessage(m.chat, {
        image: { url: r.profile },
        caption: caption,
        footer: '🎬 تجسس_يوتيوب'
      }, { quoted: m });
    } else {
      await m.reply(caption);
    }

    m.react('✅');
  } catch (error) {
    console.error('YouTube Error:', error);
    m.react('❌');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };