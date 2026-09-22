import fs from 'fs';

const pluginConfig = {
  name: "swm",
  alias: ["wm", "stickerwm", "stickermark", "swm", "حقوق"],
  category: "sticker",
  description: "اضافة اسم مستعار وزر المفضلة للملصق",
  usage: ".swm <اسم_مستعار> (رد على ملصق)",
  example: ".swm محمد",
  isOwner: false,
  cooldown: 5,
  isEnabled: true,
};

async function handler(m, { sock, config: botConfig }) {
  const q = m.quoted;
  
  if (!q) {
    return m.reply(`🖼️ *SWM*\n\n📌 رد على ملصق مع:\n${m.prefix}swm اسمك\n${m.prefix}حقوق اسمك`);
  }

  const isSticker = q.type === 'stickerMessage' || q.isSticker;
  if (!isSticker) return m.reply('❌ قم بالرد على ملصق');

  const userName = m.text ? m.text.trim() : 'User';
  const botName = botConfig.bot?.name || 'Bot';

  m.react('⏳');

  let webpPath;
  
  try {
    const buffer = await q.download();
    webpPath = '/tmp/swm_' + Date.now() + '.webp';
    fs.writeFileSync(webpPath, buffer);

    const { default: WebPMux } = await import('node-webpmux');
    const wm = new WebPMux.Image();
    await wm.load(webpPath);

    const exif = JSON.stringify({
      "sticker-pack-name": botName,
      "sticker-pack-publisher": userName,
      "emojis": ["✨"],
      "is-ai-sticker": 1,
      "is-avatar-sticker": 1,
      "premium": 1,
      "is-avatar-instant-sticker": 1,
      "sticker-maker-source-type": 5,
    });

    const eb = Buffer.from(exif, 'utf-8');
    const h = Buffer.from([0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,0x00,0x00,0x16,0x00,0x00,0x00]);
    h.writeUInt32LE(eb.length, 14);
    wm.exif = Buffer.concat([h, eb]);
    await wm.save(webpPath);

    await sock.sendMessage(m.chat, { sticker: fs.readFileSync(webpPath) }, { quoted: m });
    m.react('✅');

  } catch (err) {
    console.log(err);
    m.react('❌');
    m.reply('❌ فشل');
  } finally {
    try { if (webpPath && fs.existsSync(webpPath)) fs.unlinkSync(webpPath); } catch {}
  }
}

export { pluginConfig as config, handler };