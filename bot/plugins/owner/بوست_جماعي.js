// بوست جماعي - أمر لنشر حالة/قصة المجموعة إلى جميع المجموعات دفعة واحدة (حد أخضر)

import { getAssetBuffer } from "../../src/lib/maro-asset-manager.js";
import { fileTypeFromBuffer } from "file-type";
import fs from "fs";
import path from "path";
import { config } from "../../config.js";
import te from "../../src/lib/maro-error.js";
import { saluranCtx } from "../../src/lib/maro-context.js";

const botConfig = config;

const pluginConfig = {
  name: "بوست_جماعي",
  alias: ["swgcall"],
  category: "owner",
  description: "نشر حالة/قصة المجموعة إلى جميع المجموعات دفعة واحدة (حد أخضر)",
  usage: ".بوست_جماعي <نص> أو رد على ملف",
  example: ".بوست_جماعي إعلان مهم!",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 30,
  energi: 0,
  isEnabled: true,
};

async function sendGroupStatus(sock, jid, content) {
  return await sock.sendMessage(jid, { groupStatusMessage: content });
}

async function handler(m, { sock, db }) {
  const args = m.args || [];
  const text = m.text || "";

  if (args[0] === "--yes") {
    const pending = global._swgcallPending?.get(m.sender);
    if (!pending) {
      return m.reply(
        `⚠️ *لا توجد بيانات معلقة. أعد إرسال الملف + .بوست_جماعي*`,
      );
    }

    const { rawContent, groups, tempFile } = pending;

    await m.react("🔄");

    let content = {};
    if (rawContent.image)
      content = { image: rawContent.image, caption: rawContent.caption || "" };
    else if (rawContent.video)
      content = { video: rawContent.video, caption: rawContent.caption || "" };
    else if (rawContent.audio)
      content = {
        audio: rawContent.audio,
        mimetype: rawContent.mimetype || "audio/mpeg",
        ptt: rawContent.ptt || false,
      };
    else if (rawContent.text) content = { text: rawContent.text };

    let success = 0;
    let failed = 0;
    const failedGroups = [];
    const total = groups.length;
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));

    for (let i = 0; i < groups.length; i++) {
      const [groupId, meta] = groups[i];
      try {
        await sendGroupStatus(sock, groupId, content);
        success++;
      } catch (e) {
        failed++;
        failedGroups.push(meta.subject || groupId);
      }

      if ((i + 1) % 5 === 0) {
        await delay(2000);
      } else {
        await delay(500);
      }
    }

    global._swgcallPending.delete(m.sender);
    if (tempFile && fs.existsSync(tempFile)) {
      try {
        fs.unlinkSync(tempFile);
      } catch {}
    }

    let report =
      `✅ *اكتمل البوست الجماعي*\n\n` +
      `> الإجمالي: *${total}* مجموعة\n` +
      `> نجاح: *${success}* ✅\n` +
      `> فشل: *${failed}* ❌`;

    if (failedGroups.length > 0) {
      report +=
        `\n\n*المجموعات الفاشلة:*\n` + failedGroups.map((g) => `> • ${g}`).join("\n");
    }

    await m.reply(report);
    await m.react("✅");
    return;
  }

  let rawContent = {};
  let buffer, ext, tempFile;
  const tempDir = path.join(process.cwd(), "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const source =
    m.quoted &&
    (m.quoted.isImage ||
      m.quoted.isVideo ||
      m.quoted.isAudio ||
      m.quoted.mimetype?.startsWith("audio"))
      ? m.quoted
      : m.isImage || m.isVideo || m.isAudio || m.mimetype?.startsWith("audio")
        ? m
        : null;

  if (source) {
    try {
      buffer = await source.download();
      if (!buffer) return m.reply(`❌ فشل تحميل الوسائط.`);

      const fileType = await fileTypeFromBuffer(buffer);
      ext = fileType?.ext || "bin";
      tempFile = path.join(tempDir, `swgcall_${Date.now()}.${ext}`);
      fs.writeFileSync(tempFile, buffer);

      const isImage = source.isImage || fileType?.mime?.startsWith("image");
      const isVideo = source.isVideo || fileType?.mime?.startsWith("video");
      const isAudio =
        source.isAudio ||
        fileType?.mime?.startsWith("audio") ||
        source.mimetype?.startsWith("audio");

      if (isImage) {
        rawContent.image = buffer;
        rawContent.caption = text || "";
      } else if (isVideo) {
        rawContent.video = buffer;
        rawContent.caption = text || "";
      } else if (isAudio) {
        rawContent.audio = buffer;
        rawContent.mimetype = fileType?.mime || source.mimetype || "audio/mpeg";
        rawContent.ptt = source.msg?.ptt || false;
      }
    } catch {
      return m.reply(te(m.prefix, m.command, m.pushName));
    }
  } else if (text && text.trim()) {
    rawContent.text = text;
    rawContent.font = 0;
    rawContent.backgroundColor = "#128C7E";
  } else {
    return m.reply(
      `⚠️ *طريقة الاستخدام*\n\n` +
        `> \`${m.prefix}بوست_جماعي نص\` - بوست نصي لجميع المجموعات\n` +
        `> رد على صورة/فيديو/صوت + \`${m.prefix}بوست_جماعي\`\n` +
        `> أرسل صورة/فيديو مع تعليق \`${m.prefix}بوست_جماعي\`\n\n` +
        `⚠️ _هذه الميزة ستنشر البوست إلى جميع المجموعات!_`,
    );
  }

  try {
    global.isFetchingGroups = true;
    const groups = await sock.groupFetchAllParticipating();
    global.isFetchingGroups = false;
    const groupList = Object.entries(groups);

    if (groupList.length === 0) {
      return m.reply(`⚠️ *البوت ليس في أي مجموعة.*`);
    }

    if (!global._swgcallPending) global._swgcallPending = new Map();
    global._swgcallPending.set(m.sender, {
      rawContent,
      groups: groupList,
      tempFile,
      timestamp: Date.now(),
    });

    const mediaType = rawContent.text
      ? "نص"
      : rawContent.image
        ? "صورة"
        : rawContent.video
          ? "فيديو"
          : rawContent.audio
            ? rawContent.ptt
              ? "رسالة صوتية"
              : "صوت"
            : "غير معروف";

    let thumbnail = null;
    try {
      thumbnail = getAssetBuffer("maro2");
    } catch {}

    const estimatedTime = Math.ceil(groupList.length * 1.5);

    await sock.sendMessage(m.chat, {
      text:
        `📢 *تأكيد البوست الجماعي*\n\n` +
        `> الوسائط: *${mediaType}*\n` +
        `> إجمالي المجموعات: *${groupList.length}*\n` +
        `> الوقت المتوقع: *~${estimatedTime} ثانية*\n\n` +
        `⚠️ _سيتم نشر البوست إلى جميع المجموعات!_\n` +
        `_اضغط تأكيد للمتابعة._`,
      contextInfo: {
        ...saluranCtx(),
        forwardedNewsletterMessageInfo: {
          newsletterJid: botConfig?.saluran?.id,
          newsletterName: botConfig?.saluran?.name,
        },
      },
      footer: "Tarboo Bot MD",
      interactiveButtons: [
        {
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: `✅ إرسال إلى ${groupList.length} مجموعة`,
            id: `${m.prefix}بوست_جماعي --yes`,
          }),
        },
        {
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: "❌ إلغاء",
            id: `${m.prefix}cancelbj`,
          }),
        },
      ],
    });
  } catch (error) {
    await m.reply(
      `❌ *خطأ*\n\n> فشل الحصول على قائمة المجموعات.\n> _${error.message}_`,
    );
    if (tempFile && fs.existsSync(tempFile)) {
      try {
        fs.unlinkSync(tempFile);
      } catch {}
    }
    global._swgcallPending?.delete(m.sender);
  }
}

export { pluginConfig as config, handler };