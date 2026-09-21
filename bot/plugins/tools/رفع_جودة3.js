import axios from 'axios';
import FormData from 'form-data';
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "رفع_جودة3",
  alias: ["hd3", "upscale3", "جودة3"],
  category: "tools",
  description: "تحسين جودة الصورة 4x (imgUpscaler)",
  usage: ".رفع_جودة3 (رد على صورة)",
  example: ".رفع_جودة3",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 15,
  energi: 2,
  isEnabled: true,
};

function generateRandomIP() {
  const r = () => Math.floor(Math.random() * 254) + 1;
  return `${r()}.${r()}.${r()}.${r()}`;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function upscaleBuffer(imageBuffer, scale = "4") {
  const randomIp = generateRandomIP();
  const commonHeaders = {
    'Origin': 'https://imgupscaler.com',
    'Referer': 'https://imgupscaler.com/',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
    'X-Client-Ipv4': randomIp,
    'X-Forwarded-For': randomIp
  };

  try {
    const form = new FormData();
    form.append('tool', 'upscaler');
    form.append('mode', 'batch');
    form.append('scaleRadio', scale);
    form.append('file', imageBuffer, {
      filename: `image_${Date.now()}.jpg`,
      contentType: 'image/jpeg'
    });

    const uploadRes = await axios.post('https://imgupscaler.com/api/legacy/upload', form, {
      headers: { ...form.getHeaders(), ...commonHeaders },
      timeout: 30000
    });

    const taskId = uploadRes.data?.taskId;
    if (!taskId) return { status: false, message: 'فشل رفع الصورة' };

    let attempts = 0;
    const maxAttempts = 50;

    while (attempts < maxAttempts) {
      attempts++;
      await sleep(2000);

      const statusRes = await axios.post('https://imgupscaler.com/api/legacy/status',
        { tool: 'upscaler', taskId, scaleRadio: scale },
        { headers: { 'Content-Type': 'application/json', ...commonHeaders }, timeout: 15000 }
      );

      const resData = statusRes.data;

      if (resData.status === 'success' && resData.downloadUrls?.length > 0) {
        return { status: true, download_url: resData.downloadUrls[0] };
      }

      if (resData.status !== 'waiting') {
        return { status: false, message: 'فشل المعالجة' };
      }
    }

    return { status: false, message: 'انتهى الوقت' };

  } catch (error) {
    return { status: false, message: error.message };
  }
}

async function handler(m, { sock }) {
  const hasImage = m.isImage || (m.isQuoted && m.quoted.isImage);

  if (!hasImage) {
    return m.reply(`❌ أرسل أو رد على صورة مع \`${m.prefix}${m.command}\``);
  }

  await m.react('⏳');
  await m.reply("⏳ جاري تحسين الجودة... انتظر 15-30 ثانية");

  try {
    const mediaBuffer = (m.isQuoted && m.quoted.isImage) ? await m.quoted.download() : await m.download();

    const result = await upscaleBuffer(mediaBuffer, "4");

    if (!result.status) {
      await m.react('❌');
      return m.reply(`❌ *فشل:* ${result.message}`);
    }

    await sock.sendMessage(m.chat, {
      image: { url: result.download_url },
      caption: `✨ *تم تحسين الجودة 4x*`
    }, { quoted: m });

    await m.react('✅');

  } catch (error) {
    console.error("[Upscale Error]", error);
    await m.react('☢');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };