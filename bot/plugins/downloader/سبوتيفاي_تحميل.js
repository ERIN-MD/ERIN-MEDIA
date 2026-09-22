import config from '../../config.js';
import te from '../../src/lib/maro-error.js';
import { downloadSpotify } from '../../src/scraper/spotify.js';
import sharp from 'sharp';
import fs from 'fs';

const pluginConfig = {
  name: 'سبوتيفاي_تحميل',
  alias: ['spotify', 'spdl'],
  category: 'downloader',
  description: 'تحميل من سبوتيفاي',
  usage: '.سبوتيفاي_تحميل <رابط>',
  example: '.سبوتيفاي_تحميل https://open.spotify.com/track/xxx',
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 15, energi: 2, isEnabled: true
};

async function handler(m, { sock }) {
  const url = m.text?.trim();

  if (!url || !url.includes("open.spotify.com")) {
    return m.reply(`🎵 *سبوتيفاي_تحميل*\n\n📌 مثال: \`${m.prefix}سبوتيفاي_تحميل https://open.spotify.com/track/xxx\``);
  }

  m.react('⏳');

  try {
    const result = await downloadSpotify(url);
    const res = {
      success: true,
      result: {
        metadata: {
          title: result.title,
          duration: result.duration,
          artists: result.artist ? result.artist.split(', ').filter(Boolean) : [],
          cover: result.cover,
          spotify: url
        },
        download: { url: result.download }
      }
    };

    if (!res?.success || !res?.result?.download?.url) {
      m.react('❌');
      return m.reply('❌ فشل التحميل');
    }

    const meta = res.result.metadata;
    const duration = meta.duration ? `${Math.floor(meta.duration / 60000)}:${String(Math.floor((meta.duration % 60000) / 1000)).padStart(2, '0')}` : '?';
    const caption = `🎵 *${meta.title || 'بدون عنوان'}*\n👤 ${meta.artists?.join(', ') || '?'}\n⏱️ ${duration}\n🔗 ${meta.spotify || url}\n\n🎧 *Spotify Downloader*`;

    // تحميل صورة البوت للثمبنيل
    let thumb = null;
    try {
      const img = fs.readFileSync(config.assets["maro"]);
      thumb = await sharp(img).resize(300, 300).jpeg().toBuffer();
    } catch (e) {}

    // رد مزيف - Order Message
    const fakeOrder = {
      key: { fromMe: false, participant: "0@s.whatsapp.net", remoteJid: "status@broadcast" },
      message: {
        orderMessage: {
          orderId: `spotify-${Date.now()}`,
          thumbnail: thumb,
          itemCount: 1,
          status: "INQUIRY",
          surface: "CATALOG",
          message: `🎵 ${meta.title || 'Spotify Track'}`,
          orderTitle: `🎧 Spotify Premium`,
          sellerJid: config.botNumber ? `${config.botNumber}@s.whatsapp.net` : m.sender,
          token: "spotify-download",
          totalAmount1000: 999,
          totalCurrencyCode: "USD",
          contextInfo: {
            isForwarded: true,
            forwardingScore: 9,
            forwardedNewsletterMessageInfo: {
              newsletterJid: config.saluran?.id || "120363400911374213@newsletter",
              newsletterName: config.saluran?.name || config.bot?.name || "Spotify Bot",
              serverMessageId: 127
            }
          }
        }
      }
    };

    await sock.sendMessage(m.chat, {
      audio: { url: res.result.download.url },
      mimetype: 'audio/mpeg',
      caption: caption,
      contextInfo: {
        externalAdReply: {
          title: meta.title || 'Spotify Track',
          body: meta.artists?.join(', ') || 'Spotify Artist',
          thumbnail: thumb,
          mediaType: 2,
          renderLargerThumbnail: true,
          sourceUrl: meta.spotify || url
        }
      }
    }, { quoted: fakeOrder });

    m.react('✅');
  } catch (error) {
    console.error('Spotify Error:', error);
    m.react('❌');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };
