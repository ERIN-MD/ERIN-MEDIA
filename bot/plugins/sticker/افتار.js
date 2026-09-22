import { exec } from 'child_process';
import fs from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

const pluginConfig = {
  name: "افتار",
  alias: ["avatar", "افتار", "av"],
  category: "sticker",
  description: "تحويل الصور/الفيديو لـ Avatar Sticker مع توقيع",
  usage: ".افتار <اسم> (رد على صورة/فيديو)",
  example: ".افتار حزمة",
  isOwner: false,
  cooldown: 5,
  isEnabled: true,
};

async function handler(m, { sock, config: botConfig }) {
  const packname = m.args.join(' ') || botConfig.sticker?.packname || botConfig.bot?.name || 'Avatar AI';
  const author = botConfig.sticker?.author || botConfig.owner?.name || 'Bot';
  
  if (!m.quoted) return m.reply('❌ قم بالرد على صورة أو فيديو');

  const q = m.quoted;
  let mime = '';

  if (q.message) {
    if (q.message.imageMessage) mime = 'image';
    else if (q.message.videoMessage) mime = 'video';
  }

  if (!mime) return m.reply('❌ قم بالرد على صورة أو فيديو');
  if (mime === 'video' && q.message.videoMessage && q.message.videoMessage.seconds > 15) return m.reply('❌ أقصى مدة 15 ثانية');

  m.react('⏳');

  let inputPath, webpPath;
  
  try {
    const media = await q.download();
    inputPath = '/tmp/av_' + Date.now() + (mime === 'video' ? '.mp4' : '.png');
    webpPath = '/tmp/av_' + Date.now() + '.webp';
    fs.writeFileSync(inputPath, media);

    if (mime === 'image') {
      const { Jimp } = await import('jimp');
      const img = await Jimp.read(inputPath);
      img.cover({ w: 512, h: 512 });
      await img.write(inputPath);
      await execAsync('ffmpeg -i "' + inputPath + '" -y -vcodec libwebp -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:-1:-1:color=#00000000,setsar=1" "' + webpPath + '"');
    } else {
      await execAsync('ffmpeg -i "' + inputPath + '" -y -vcodec libwebp -vf "scale=256:256:force_original_aspect_ratio=decrease,format=rgba,pad=256:256:-1:-1:color=#00000000,setsar=1" -loop 0 -an -t 3 -q:v 50 -preset picture -compression_level 6 "' + webpPath + '"');
    }

    const { default: WebPMux } = await import('node-webpmux');
    const wm = new WebPMux.Image();
    await wm.load(webpPath);

    const exif = JSON.stringify({
      "sticker-pack-id": "https://t.me/bot",
      "sticker-pack-name": packname,
      "sticker-pack-publisher": author,
      "emojis": ["✨"],
      "is-ai-sticker": 1,
      "is-avatar-sticker": 1,
      "premium": 1,
      "is-avatar-instant-sticker": 1,
      "sticker-maker-source-type": 5,
      "is-avatar-country-sticker": 1,
      "is-avatar-social-sticker": 1,
      "avatar-sticker-template-id": "AI",
      "avatar-sticker-style": "cool",
      "avatar-sticker-revision-id": "v2"
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
    try { if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}
    try { if (webpPath && fs.existsSync(webpPath)) fs.unlinkSync(webpPath); } catch {}
  }
}

export { pluginConfig as config, handler };