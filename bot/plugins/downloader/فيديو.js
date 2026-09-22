import axios from 'axios';
import config from '../../config.js';
import te from '../../src/lib/maro-error.js';
import { AIRich } from '../../src/lib/maro-builder.js';
import { generateWAMessageFromContent } from 'maro';
import sharp from 'sharp';
import fs from 'fs';

// تخزين الفيديوهات مؤقتاً
const videoCache = new Map();

const pluginConfig = {
  name: "فيديو",
  alias: ["video", "videos"],
  category: "downloader",
  description: "عرض فيديوهات متنوعة داخل ميتا",
  usage: ".فيديو",
  example: ".فيديو",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 10, energi: 1, isEnabled: true,
};

async function handler(m, { sock }) {
  const args = m.args || [];
  
  // إذا تم اختيار فيديو من القائمة
  if (args[0]?.startsWith('عرض_')) {
    const index = parseInt(args[0].replace('عرض_', ''));
    const videos = videoCache.get(m.sender);
    if (!videos || !videos[index]) {
      return m.reply('❌ انتهت الجلسة. اكتب `.فيديو` مرة أخرى');
    }

    const video = videos[index];
    m.react('🎬');

    if (video.linkvideo) {
      const rich = new AIRich(sock);
      rich.setTitle('🎬 فيديو');
      rich.setFooter(`🎬 Video`);

      rich.addText(`# 🎬 *${video.judul || 'فيديو'}*`);
      rich.addVideo(video.linkvideo);

      rich.addTable([
        ['👤 الناشر', '📝 الوصف'],
        [video.username || 'مجهول', video.deskripsi || 'لا يوجد وصف']
      ]);

      await rich.send(m.chat, { quoted: m });
    }
    m.react('✅');
    return;
  }

  // العرض الرئيسي
  m.react('🎬');

  try {
    const { data } = await axios.get('https://allapiproject.zone.id/video-krtl.json', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });

    const videos = Array.isArray(data) ? data : [data];
    if (!videos.length) { m.react('❌'); return m.reply('❌ لا توجد فيديوهات'); }

    // تخزين الفيديوهات
    videoCache.set(m.sender, videos);
    setTimeout(() => videoCache.delete(m.sender), 300000); // تنتهي بعد 5 دقائق

    // أول فيديو في ميتا
    const first = videos[0];
    if (first.linkvideo) {
      const rich = new AIRich(sock);
      rich.setTitle('🎬 فيديوهات');
      rich.setFooter(`📊 ${videos.length} فيديو | 🎬 Video`);

      rich.addText(`# 🎬 *${first.judul || 'فيديو'}*`);
      rich.addVideo(first.linkvideo);

      rich.addTable([
        ['👤 الناشر', '📝 الوصف'],
        [first.username || 'مجهول', first.deskripsi || 'لا يوجد وصف']
      ]);

      await rich.send(m.chat, { quoted: m });
    }

    // قائمة الفيديوهات
    if (videos.length > 1) {
      let thumb = null;
      try {
        const img = fs.readFileSync(config.assets["maro"]);
        thumb = await sharp(img).resize(300, 170).jpeg().toBuffer();
      } catch {}

      const rows = videos.slice(1, 11).map((v, i) => ({
        title: `${i + 2}. ${(v.judul || 'فيديو').substring(0, 40)}`,
        description: `👤 ${v.username || 'مجهول'}`,
        id: `${m.prefix}فيديو عرض_${i + 1}`,
      }));

      const content = {
        buttonsMessage: {
          buttons: [{
            buttonText: { displayText: '📋 اختر فيديو' },
            buttonId: 'select',
            type: 1,
            nativeFlowInfo: {
              name: 'single_select',
              paramsJson: JSON.stringify({
                title: `🎬 ${videos.length} فيديو`,
                sections: [{ title: 'اختر فيديو للعرض', rows }],
              }),
            },
          }],
          locationMessage: { jpegThumbnail: thumb, degreesLatitude: 0, degreesLongitude: 0, name: '🎬 فيديوهات', address: `${videos.length} فيديو متاح` },
          contentText: `🎬 *${videos.length - 1} فيديو إضافي*\n\nاختر فيديو من الزر أدناه 👇`,
          footerText: '🎬 فيديوهات',
          headerType: 6,
        },
      };

      const msg = generateWAMessageFromContent(m.chat, content, { userJid: sock.user.jid });
      await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    }

    m.react('✅');
  } catch (error) {
    console.error('Video Error:', error);
    m.react('❌');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };