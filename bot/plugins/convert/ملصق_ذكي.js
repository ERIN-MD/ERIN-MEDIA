import { exec } from 'child_process';
import fs from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

const pluginConfig = {
  name: "ملصق_ذكي",
  alias: ["stcai", "stickerai", "ملصق_ذكي"],
  category: "convert",
  description: "تحويل الصور/الفيديو لملصقات AI",
  usage: ".ملصق_ذكي <اسم> (رد على صورة/فيديو)",
  example: ".ملصق_ذكي حزمة",
  isOwner: false,
  cooldown: 5,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const packname = m.args.join(' ') || 'AI Sticker';
  
  if (!m.quoted) {
    return m.reply('❌ قم بالرد على صورة أو فيديو');
  }

  const q = m.quoted;
  let mime = '';

  if (q.message) {
    if (q.message.imageMessage) mime = 'image';
    else if (q.message.videoMessage) mime = 'video';
  }

  if (!mime) {
    return m.reply('❌ قم بالرد على صورة أو فيديو');
  }

  m.react('⏳');

  let inputPath, webpPath;
  
  try {
    const media = await q.download();
    inputPath = '/tmp/sticker_' + Date.now() + (mime === 'video' ? '.mp4' : '.png');
    fs.writeFileSync(inputPath, media);

    webpPath = '/tmp/sticker_' + Date.now() + '.webp';

    if (mime === 'image') {
      const { Jimp } = await import('jimp');
      const image = await Jimp.read(inputPath);
      image.cover({ w: 512, h: 512 });
      await image.write(inputPath);
    }

    // تحويل لـ webp
    await execAsync('ffmpeg -i "' + inputPath + '" -y -vcodec libwebp -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:-1:-1:color=#00000000,setsar=1" ' + (mime === 'video' ? '-loop 0 -preset default -an -fps_mode auto ' : '') + '"' + webpPath + '"');

    // إضافة metadata
    const { default: WebPMux } = await import('node-webpmux');
    const wm = new WebPMux.Image();
    await wm.load(webpPath);

    const exifData = JSON.stringify({
      "sticker-pack-id": "https://t.me/bot",
      "sticker-pack-name": packname,
      "sticker-pack-publisher": "Bot",
      "emojis": ["✨"],
      "is-ai-sticker": 1,
      "is-avatar-sticker": 1,
      "avatar-sticker-template-id": "AI",
      "is-avatar-country-sticker": 1,
      "is-avatar-instant-sticker": 1,
      "sticker-maker-source-type": 5,
      "is-avatar-social-sticker": 1,
      "avatar-sticker-style": "AI",
      "avatar-sticker-revision-id": "v1"
    });

    const exifBuff = Buffer.from(exifData, 'utf-8');
    const header = Buffer.from([0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,0x00,0x00,0x16,0x00,0x00,0x00]);
    header.writeUInt32LE(exifBuff.length, 14);
    wm.exif = Buffer.concat([header, exifBuff]);
    await wm.save(webpPath);

    await sock.sendMessage(m.chat, { sticker: fs.readFileSync(webpPath) }, { quoted: m });
    m.react('✅');

  } catch (err) {
    console.log(err);
    m.react('❌');
    m.reply('❌ فشل');
  } finally {
    try { if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}
    try { if (webpPath && fs.existsSync(webpPath)) fs.unlinkSync(webpPath); } catch {}
  }
}

export { pluginConfig as config, handler };