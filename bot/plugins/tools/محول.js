// محول - أمر لتحويل الملفات إلى صيغ أخرى

import fs from "fs";
import path from "path";
import { mconverter } from "../../src/scraper/mconverter.js";
import { downloadContentFromMessage } from "maro";
import config from "../../config.js";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "محول",
  alias: ["converter"],
  category: "tools",
  description: "تحويل الملفات إلى صيغ أخرى",
  usage: ".محول <الصيغة> (رد على ملف)",
  example: ".محول mp3",
  isOwner: false,
  isPremium: true,
  isGroup: false,
  isPrivate: false,
  cooldown: 30,
  energi: 3,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const targetFormat = m.text?.trim()?.toLowerCase();

  if (!m.quoted && !m.isMedia) {
    return m.reply(
      `🔄 *محول الملفات*\n\n` +
        `> رد على ملف مع صيغة الهدف\n\n` +
        `*الصيغ:*\n` +
        `> \`${m.prefix}محول <الصيغة>\`\n\n` +
        `*مثال:*\n` +
        `> \`${m.prefix}محول mp3\`\n` +
        `> \`${m.prefix}محول mp4\`\n` +
        `> \`${m.prefix}محول png\`\n\n` +
        `*طريقة الاستخدام:*\n` +
        `> 1. رد على الملف المراد تحويله\n` +
        `> 2. اكتب \`${m.prefix}محول <الصيغة>\``,
    );
  }

  if (!targetFormat) {
    return m.reply(
      `❌ أدخل صيغة الهدف!\n\n> مثال: \`${m.prefix}محول mp3\``,
    );
  }

  const quoted = m.quoted;
  let mediaMessage = null;
  let filename = "ملف";

  if (quoted?.isMedia) {
    mediaMessage = quoted;
    filename = quoted.message?.[quoted.type]?.fileName || `ملف_${Date.now()}`;
  } else if (m.isMedia) {
    mediaMessage = m;
    filename = m.message?.[m.type]?.fileName || `ملف_${Date.now()}`;
  }

  if (!mediaMessage) {
    return m.reply(`❌ رد على الملف المراد تحويله!`);
  }

  m.react("🕕");
  await m.reply(`🕕 *جاري تحميل الملف...*`);

  try {
    const stream = await downloadContentFromMessage(
      mediaMessage.message[mediaMessage.type],
      mediaMessage.type.replace("Message", ""),
    );

    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const ext = filename.split(".").pop() || "bin";
    const tempFile = path.join(tempDir, `تحويل_${Date.now()}.${ext}`);
    fs.writeFileSync(tempFile, buffer);

    await m.reply(`🔄 *جاري التحويل...*\n\n> ${ext} → ${targetFormat}`);

    const result = await mconverter.convert(tempFile, targetFormat);

    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }

    if (result.error) {
      m.react("❌");
      return m.reply(`❌ *فشل التحويل*\n\n> ${result.error}`);
    }

    const saluranId = config.saluran?.id || "120363400911374213@newsletter";
    const saluranName = config.saluran?.name || config.bot?.name || "Maro-AI";

    await sock.sendMessage(
      m.chat,
      {
        document: { url: result.url },
        fileName: `محول_${Date.now()}.${targetFormat}`,
        mimetype: `application/${targetFormat}`,
        contextInfo: {
          forwardingScore: 9999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127,
          },
        },
      },
      { quoted: m },
    );

    m.react("✅");
  } catch (err) {
    console.error("[Converter] Error:", err.message);
    m.react("☢");
    return m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };