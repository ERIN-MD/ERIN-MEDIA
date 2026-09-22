// تعريف_الموسيقى - أمر للتعرف على الأغنية من الصوت

import axios from "axios";
import FormData from "form-data";
import config from "../../config.js";
import { downloadMediaMessage } from "maro";
import te from "../../src/lib/maro-error.js";
import maroApi from "../../src/lib/maro-apimanager.js";
import { saluranCtx } from "../../src/lib/maro-context.js";

const pluginConfig = {
  name: "تعريف_الموسيقى",
  alias: ["musikapaini"],
  category: "tools",
  description: "التعرف على الأغنية من الصوت",
  usage: ".تعريف_الموسيقى (رد على صوت)",
  example: ".تعريف_الموسيقى",
  cooldown: 20,
  energi: 2,
  isEnabled: true,
};

async function uploadTo0x0(buffer, filename) {
  const form = new FormData();
  form.append("file", buffer, {
    filename,
    contentType: "application/octet-stream",
  });

  const res = await axios.post(
    "https://c.termai.cc/api/upload?key=AIzaBj7z2z3xBjsk",
    form,
    {
      headers: form.getHeaders(),
      timeout: 60000,
    },
  );

  if (!res.data?.status ? res.data.path : "") throw new Error("فشل الرفع");
  return res.data;
}

async function handler(m, { sock }) {
  let audioBuffer = null;
  let filename = "audio.mp3";

  if (m.quoted?.message) {
    const quotedMsg = m.quoted.message;
    const audioMsg = quotedMsg.audioMessage || quotedMsg.documentMessage;

    if (audioMsg) {
      try {
        audioBuffer = await downloadMediaMessage(
          { key: m.quoted.key, message: quotedMsg },
          "buffer",
          {},
        );
        filename = audioMsg.fileName || "audio.mp3";
      } catch {}
    }
  }

  if (!audioBuffer && m.message) {
    const audioMsg = m.message.audioMessage || m.message.documentMessage;
    if (audioMsg) {
      try {
        audioBuffer = await m.download();
        filename = audioMsg.fileName || "audio.mp3";
      } catch {}
    }
  }

  if (!audioBuffer) {
    return m.reply(
      `🎵 *ما هي هذه الموسيقى؟*\n\n` +
        `> التعرف على الأغنية من الصوت\n\n` +
        `*طريقة الاستخدام:*\n` +
        `> رد على صوت بـ \`${m.prefix}تعريف_الموسيقى\`\n` +
        `> أو أرسل صوت مع تعليق الأمر`,
    );
  }

  m.react("🎵");

  try {
    await m.reply("🕕 *جاري الرفع...*\n\n> رفع الصوت...");

    const audioUrl = await uploadTo0x0(audioBuffer, filename);

    await m.reply("🔍 *جاري التعرف...*\n\n> البحث عن معلومات الأغنية...");

    const data = await maroApi.neoxr.whatMusic(
      {
        url: audioUrl,
        apikey: config.APIkey?.neoxr || "Milik-Bot-MaroMD",
      },
      {
        timeout: 60000,
      },
    );

    if (!data?.status || !data?.data) {
      m.react("❌");
      return m.reply("❌ *فشل*\n\n> لم يتم التعرف على الأغنية أو خطأ في الخادم");
    }

    const music = data.data;
    const links = music.links || {};

    let text = `🎵 *تم العثور على الأغنية!*\n\n`;
    text += `╭┈┈⬡「 📋 *المعلومات* 」\n`;
    text += `┃ 🎶 العنوان: ${music.title || "-"}\n`;
    text += `┃ 👤 الفنان: ${music.artist || "-"}\n`;
    text += `┃ 💿 الألبوم: ${music.album || "-"}\n`;
    text += `┃ 📅 تاريخ الإصدار: ${music.release || "-"}\n`;
    text += `╰┈┈┈┈┈┈┈┈⬡\n\n`;

    const buttons = [];

    if (links.spotify?.track?.id) {
      buttons.push({
        name: "cta_url",
        buttonParamsJson: JSON.stringify({
          display_text: "🎧 Spotify",
          url: `https://open.spotify.com/track/${links.spotify.track.id}`,
        }),
      });
    }

    if (links.youtube?.vid) {
      buttons.push({
        name: "cta_url",
        buttonParamsJson: JSON.stringify({
          display_text: "▶️ يوتيوب",
          url: `https://youtube.com/watch?v=${links.youtube.vid}`,
        }),
      });
    }

    if (links.deezer?.track?.id) {
      buttons.push({
        name: "cta_url",
        buttonParamsJson: JSON.stringify({
          display_text: "🎵 ديزر",
          url: `https://deezer.com/track/${links.deezer.track.id}`,
        }),
      });
    }

    const msgContent = {
      text,
      footer: "🎵 التعرف على الموسيقى",
      contextInfo: saluranCtx(),
    };

    if (buttons.length > 0) {
      msgContent.interactiveButtons = buttons;
    }

    await sock.sendMessage(m.chat, msgContent, { quoted: m });

    m.react("✅");
  } catch (error) {
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };