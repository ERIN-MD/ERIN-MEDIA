import * as _canvas from '@napi-rs/canvas'
import axios from "axios";

import config from "../../config.js";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "سرقة_الصورة",
  alias: ["colongpp"],
  category: "owner",
  description: "أخذ واستخدام صورة الملف الشخصي للهدف كصورة للبوت",
  usage: ".سرقة_الصورة (رد على رسالة الهدف)",
  example: ".سرقة_الصورة",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
};

const FALLBACK_PP = "https://telegra.ph/file/1ecdb5a0aee62ef17d7fc.jpg";
const PP_SIZE = 640;

async function resizeForPP(buffer) {
  const { createCanvas, loadImage } = _canvas;
  const img = await loadImage(buffer);
  const canvas = createCanvas(PP_SIZE, PP_SIZE);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, PP_SIZE, PP_SIZE);
  return canvas.toBuffer("image/jpeg");
}

async function handler(m, { sock }) {
  const targetJid = m.quoted?.sender || m.mentions?.[0];
  console.log(targetJid);
  if (!targetJid) {
    return m.reply(
      `🕵️ *سرقة الصورة*\n\n` +
        `> قم بالرد على رسالة شخص ما لسرقة صورته\n\n` +
        `*الطريقة:*\n` +
        `> رد على رسالة الهدف → \`${m.prefix}سرقة_الصورة\``,
    );
  }
  await m.react("🕵️");
  try {
    let ppBuffer;
    let source = "الملف الشخصي";
    try {
      const ppUrl = await sock.profilePictureUrl(targetJid, "image");
      const res = await axios.get(ppUrl, {
        responseType: "arraybuffer",
        timeout: 15000,
      });
      ppBuffer = Buffer.from(res.data);
    } catch {
      const res = await axios.get(FALLBACK_PP, {
        responseType: "arraybuffer",
        timeout: 15000,
      });
      ppBuffer = Buffer.from(res.data);
      source = "افتراضي (الهدف ليس لديه صورة)";
    }
    const processed = await resizeForPP(ppBuffer);
    const botJid = sock.user?.id;
    await sock.updateProfilePicture(botJid, processed);
    const targetNumber = targetJid.split("@")[0];
    await m.react("✅");
    return m.reply(
      `✅ *تمت سرقة الصورة بنجاح!*\n\n` +
        `> 🎯 الهدف: @${targetNumber}\n` +
        `> 📸 المصدر: ${source}`,
      { mentions: [targetJid] },
    );
  } catch (err) {
    console.error("[سرقة_الصورة] خطأ:", err.message);
    await m.react("☢");
    return m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };