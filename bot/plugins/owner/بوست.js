// بوست - أمر لنشر حالة/قصة المجموعة إلى مجموعة مختارة (حد أخضر)

import { getAssetBuffer } from "../../src/lib/maro-asset-manager.js";
import { fileTypeFromBuffer } from "file-type";
import fs from "fs";
import path from "path";
import { config } from "../../config.js";
import te from "../../src/lib/maro-error.js";
import { handleAntiSwGc } from "../../src/lib/maro-group-protection.js";
import { saluranCtx } from "../../src/lib/maro-context.js";

const botConfig = config;

function buildSyntheticSwGcRawMessage(sock, remoteJid, content, messageId) {
  const botJid = sock.user?.id?.split(":")[0] + "@s.whatsapp.net";
  const innerMessage = content.text
    ? {
        extendedTextMessage: {
          text: content.text,
          contextInfo: {
            isGroupStatus: true,
            statusSourceType: 4,
          },
        },
      }
    : content.image
      ? {
          imageMessage: {
            caption: content.caption || "",
            contextInfo: {
              isGroupStatus: true,
              statusSourceType: 0,
            },
          },
        }
      : content.video
        ? {
            videoMessage: {
              caption: content.caption || "",
              contextInfo: {
                isGroupStatus: true,
                statusSourceType: 1,
              },
            },
          }
        : content.audio
          ? {
              audioMessage: {
                mimetype: content.mimetype || "audio/mpeg",
                ptt: Boolean(content.ptt),
                contextInfo: {
                  isGroupStatus: true,
                  statusSourceType: 3,
                },
              },
            }
          : {
              extendedTextMessage: {
                text: "",
                contextInfo: {
                  isGroupStatus: true,
                  statusSourceType: 4,
                },
              },
            };

  return {
    key: {
      remoteJid,
      fromMe: true,
      id: messageId,
      participant: botJid,
    },
    message: {
      groupStatusMessageV2: {
        message: innerMessage,
      },
    },
    messageTimestamp: Math.floor(Date.now() / 1000),
  };
}

const pluginConfig = {
  name: "بوست",
  alias: ["swgc"],
  category: "owner",
  description: "نشر حالة/قصة المجموعة إلى مجموعة مختارة (حد أخضر)",
  usage: ".بوست <نص> أو رد على ملف",
  example: ".بوست مرحباً جميعاً!",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
};

const pendingSwgc = new Map();

async function sendGroupStatus(sock, jid, content) {
  return await sock.sendMessage(jid, { groupStatusMessage: content });
}

async function handler(m, { sock, db }) {
  const args = m.args || [];
  const text = m.text || "";

  if (args[0] === "--confirm" && args[1]) {
    const targetGroupId = args[1];
    const pendingData = pendingSwgc.get(m.sender);

    if (!pendingData) {
      await m.reply(
        `⚠️ *لا توجد بيانات معلقة. يرجى إعادة إرسال الملف + .بوست*`,
      );
      return;
    }

    try {
      let groupName = "المجموعة";
      try {
        const meta = await sock.groupMetadata(targetGroupId);
        groupName = meta.subject;
      } catch (e) {}

      await m.react("🕕");

      const rawContent = pendingData.rawContent;
      let content = {};

      if (rawContent.image) {
        content = {
          image: rawContent.image,
          caption: rawContent.caption || "",
        };
      } else if (rawContent.video) {
        content = {
          video: rawContent.video,
          caption: rawContent.caption || "",
        };
      } else if (rawContent.audio) {
        content = {
          audio: rawContent.audio,
          mimetype: rawContent.mimetype || "audio/mpeg",
          ptt: rawContent.ptt || false,
        };
      } else if (rawContent.text) {
        content = { text: rawContent.text };
      }

      const sendResult = await sendGroupStatus(sock, targetGroupId, content);
      if (typeof sendResult === "string") {
        const syntheticRawMsg = buildSyntheticSwGcRawMessage(
          sock,
          targetGroupId,
          content,
          sendResult,
        );
        await handleAntiSwGc(syntheticRawMsg, sock, db);
      }

      const mediaType = pendingData.rawContent.text
        ? "نص"
        : pendingData.rawContent.image
          ? "صورة"
          : pendingData.rawContent.video
            ? "فيديو"
            : pendingData.rawContent.audio
              ? "صوت"
              : "وسائط";

      const successMsg = `✅ تم النشر بنجاح إلى مجموعة ${groupName}`;

      await m.reply(successMsg);
      pendingSwgc.delete(m.sender);

      if (pendingData.tempFile && fs.existsSync(pendingData.tempFile)) {
        setTimeout(() => {
          try {
            fs.unlinkSync(pendingData.tempFile);
          } catch (e) {}
        }, 5000);
      }
    } catch (error) {
      await m.reply(
        `❌ *خطأ*\n\n` + `> فشل النشر.\n` + `> _${error.message}_`,
      );
    }
    return;
  }

  let rawContent = {};
  let buffer, ext, tempFile;
  const tempDir = path.join(process.cwd(), "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  if (
    m.quoted &&
    (m.quoted.isImage ||
      m.quoted.isVideo ||
      m.quoted.isAudio ||
      m.quoted.mimetype?.startsWith("audio"))
  ) {
    try {
      buffer = await m.quoted.download();
      if (!buffer) {
        await m.reply(`❌ فشل تحميل الوسائط.`);
        return;
      }
      const fileType = await fileTypeFromBuffer(buffer);
      ext = fileType?.ext || "bin";
      tempFile = path.join(tempDir, `swgc_${Date.now()}.${ext}`);
      fs.writeFileSync(tempFile, buffer);

      if (m.quoted.isImage) {
        rawContent.image = buffer;
        rawContent.caption = text || "";
      } else if (m.quoted.isVideo) {
        rawContent.video = buffer;
        rawContent.caption = text || "";
      } else if (m.quoted.isAudio || m.quoted.mimetype?.startsWith("audio")) {
        rawContent.audio = buffer;
        rawContent.mimetype =
          fileType?.mime || m.quoted.mimetype || "audio/mpeg";
        rawContent.ptt = m.quoted.msg?.ptt || false;
      }
    } catch (e) {
      await m.reply(te(m.prefix, m.command, m.pushName));
      return;
    }
  } else if (
    m.isImage ||
    m.isVideo ||
    m.isAudio ||
    m.mimetype?.startsWith("audio")
  ) {
    try {
      buffer = await m.download();
      if (!buffer) {
        await m.reply(`❌ فشل تحميل الوسائط.`);
        return;
      }
      const fileType = await fileTypeFromBuffer(buffer);
      ext = fileType?.ext || "bin";
      tempFile = path.join(tempDir, `swgc_${Date.now()}.${ext}`);
      fs.writeFileSync(tempFile, buffer);

      if (m.isImage) {
        rawContent.image = buffer;
        rawContent.caption = text || "";
      } else if (m.isVideo) {
        rawContent.video = buffer;
        rawContent.caption = text || "";
      } else if (m.isAudio || m.mimetype?.startsWith("audio")) {
        rawContent.audio = buffer;
        rawContent.mimetype = fileType?.mime || m.mimetype || "audio/mpeg";
        rawContent.ptt = m.msg?.ptt || false;
      }
    } catch (e) {
      await m.reply(te(m.prefix, m.command, m.pushName));
      return;
    }
  } else if (text && text.trim()) {
    rawContent.text = text;
    rawContent.font = 0;
    rawContent.backgroundColor = "#128C7E";
  } else {
    await m.reply(
      `⚠️ *طريقة الاستخدام*\n\n` +
        `> \`${m.prefix}بوست نص\` - بوست نصي\n` +
        `> رد على صورة/فيديو/صوت + \`${m.prefix}بوست\`\n` +
        `> أرسل صورة/فيديو مع تعليق \`${m.prefix}بوست\``,
    );
    return;
  }

  pendingSwgc.set(m.sender, {
    rawContent: rawContent,
    tempFile: tempFile,
    timestamp: Date.now(),
  });

  try {
    global.isFetchingGroups = true;
    const groups = await sock.groupFetchAllParticipating();
    global.isFetchingGroups = false;
    const groupList = Object.entries(groups);

    if (groupList.length === 0) {
      await m.reply(`⚠️ *البوت ليس في أي مجموعة.*`);
      return;
    }

    const groupRows = groupList.map(([id, meta]) => ({
      title: meta.subject || "مجموعة غير معروفة",
      description: id,
      id: `${m.prefix}بوست --confirm ${id}`,
    }));

    const prefix = m.prefix || ".";
    const mediaType = rawContent.text
      ? "نص"
      : rawContent.image
        ? "صورة"
        : rawContent.video
          ? "فيديو"
          : rawContent.audio
            ? "صوت"
            : "وسائط";

    let thumbnail = null;
    try {
      thumbnail = getAssetBuffer("maro2");
    } catch (e) {}

    await sock.sendMessage(m.chat, {
      text:
        `📋 *اختر المجموعة للنشر*\n\n` +
        `> الوسائط: *${mediaType}*\n` +
        `> إجمالي المجموعات: *${groupList.length}*\n\n` +
        `_اختر المجموعة من القائمة أدناه:_`,
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
          name: "single_select",
          buttonParamsJson: JSON.stringify({
            title: "🏠 اختر المجموعة",
            sections: [
              {
                title: "قائمة المجموعات",
                rows: groupRows,
              },
            ],
          }),
        },
        {
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: "❌ إلغاء",
            id: `${prefix}cancelswgc`,
          }),
        },
      ],
    });
  } catch (error) {
    await m.reply(
      `❌ *خطأ*\n\n` +
        `> فشل الحصول على قائمة المجموعات.\n` +
        `> _${error.message}_`,
    );
    if (tempFile && fs.existsSync(tempFile)) {
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {}
    }
    pendingSwgc.delete(m.sender);
  }
}

export { pluginConfig as config, handler, sendGroupStatus, pendingSwgc };