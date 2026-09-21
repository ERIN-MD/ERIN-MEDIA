// بوست2 - أمر لنشر حالة/قصة المجموعة V2 إلى مجموعة مختارة مع دعم الألوان

import { getAssetBuffer } from "../../src/lib/maro-asset-manager.js";
import { fileTypeFromBuffer } from "file-type";
import fs from "fs";
import path from "path";
import { config } from "../../config.js";
import te from "../../src/lib/maro-error.js";
import { handleAntiSwGc } from "../../src/lib/maro-group-protection.js";
import { saluranCtx } from "../../src/lib/maro-context.js";
import { generateWAMessage } from "maro";

const botConfig = config;

// قائمة الألوان المدعومة للخلفية
const COLORS = {
  ابيض: "#FFFFFF",
  اسود: "#000000",
  احمر: "#FF0000",
  اخضر: "#00FF00",
  ازرق: "#0000FF",
  اصفر: "#FFFF00",
  بنفسجي_2: "#800080",
  برتقالي: "#FFA500",
  وردي_2: "#FFC0CB",
  بني: "#A52A2A",
  رمادي: "#808080",
  كحلي: "#000080",
  تركواز: "#00FFFF",
  فضي: "#C0C0C0",
  ذهبي: "#FFD700",
  كستنائي: "#800000",
  زيتوني: "#808000",
  فيروزي_2: "#008080",
  خزامي: "#E6E6FA",
  مرجاني: "#FF7F50",
  سلموني: "#FA8072",
  سيان: "#00FFFF",
  ماجنتا: "#FF00FF",
  ليموني: "#00FF00",
  نيلي: "#4B0082",
  بنفسجي: "#EE82EE",
  فيروزي: "#40E0D0",
  وردي: "#FF007F",
  شوكولاتي: "#D2691E",
  قرمزي: "#DC143C",
  ازرق_ملكي: "#4169E1",
  ازرق_سماوي: "#87CEEB",
  اخضر_فاتح: "#90EE90",
  اخضر_غامق: "#006400",
  ازرق_غامق: "#00008B",
  ازرق_متوسط_2: "#0000CD",
  ازرق_منتصف_الليل: "#191970",
  ازرق_اردوازي_غامق_2: "#483D8B",
  ازرق_اردوازي_2: "#6A5ACD",
  ازرق_اردوازي_متوسط_2: "#7B68EE",
  اخضر_ربيعي: "#00FF7F",
  اخضر_ربيعي_متوسط: "#00FA9A",
  اخضر_عشبي: "#7CFC00",
  شارتروز: "#7FFF00",
  اصفر_مخضر_2: "#ADFF2F",
  اصفر_مخضر: "#9ACD32",
  برتقالي_غامق: "#FF8C00",
  برتقالي_محمر: "#FF4500",
  طماطمي: "#FF6347",
  وردي_ساخن: "#FF69B4",
  وردي_غامق: "#FF1493",
  احمر_بنفسجي_متوسط: "#C71585",
  احمر_بنفسجي_باهت: "#DB7093",
  وردي_فاتح: "#FFB6C1",
  شوك: "#D8BFD8",
  برقوق: "#DDA0DD",
  اوركيد: "#DA70D6",
  فوشيا: "#FF00FF",
  اوركيد_متوسط: "#BA55D3",
  اوركيد_غامق: "#9932CC",
  بنفسجي_غامق: "#9400D3",
  بنفسجي_مزرق: "#8A2BE2",
  ارجواني_غامق: "#8B008B",
  ارجواني_متوسط: "#9370DB",
  ازرق_اردوازي: "#6A5ACD",
  ازرق_اردوازي_غامق: "#483D8B",
  ازرق_اردوازي_متوسط: "#7B68EE",
  ازرق_متوسط: "#0000CD",
};

function buildSyntheticSwGcRawMessage(sock, remoteJid, innerMessage, messageId) {
  const botJid = sock.user?.id?.split(":")[0] + "@s.whatsapp.net";
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
  name: "بوست2",
  alias: ["swgcv2"],
  category: "owner",
  description: "نشر حالة/قصة المجموعة V2 إلى مجموعة مختارة مع دعم الألوان",
  usage: ".بوست2 <نص> [--لون <اللون>] أو رد على ملف",
  example: ".بوست2 مرحباً جميعاً! --لون ازرق",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
};

const pendingSwgcV2 = new Map();

// دالة لاستخراج اللون من النص
function extractColor(text) {
  const colorMatch = text.match(/--لون\s+(\S+)/i);
  if (colorMatch) {
    const colorName = colorMatch[1].toLowerCase();
    if (COLORS[colorName]) {
      return { color: COLORS[colorName], cleanedText: text.replace(/--لون\s+\S+/i, "").trim() };
    }
  }
  return { color: null, cleanedText: text };
}

async function handler(m, { sock, db }) {
  const args = m.args || [];
  const text = m.text || "";

  if (args[0] === "--تأكيد" && args[1]) {
    const targetGroupId = args[1];
    const pendingData = pendingSwgcV2.get(m.sender);

    if (!pendingData) {
      await m.reply(
        `⚠️ *لا توجد بيانات معلقة. يرجى إعادة إرسال الملف + .بوست2*`,
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
      const bgColor = pendingData.bgColor || "#128C7E";

      let baseContent = {};
      if (rawContent.image) {
        baseContent = { image: rawContent.image, caption: rawContent.caption || "" };
      } else if (rawContent.video) {
        baseContent = { video: rawContent.video, caption: rawContent.caption || "" };
      } else if (rawContent.audio) {
        baseContent = { audio: rawContent.audio, mimetype: rawContent.mimetype || "audio/mpeg", ptt: rawContent.ptt || false };
      } else if (rawContent.text) {
        baseContent = { 
          text: rawContent.text,
          backgroundColor: bgColor,
          font: 0
        };
      }

      const genMsg = await generateWAMessage(targetGroupId, baseContent, {
        userJid: sock.user.id,
        upload: sock.waUploadToServer
      });

      const msgType = Object.keys(genMsg.message).find(k => k.endsWith('Message') && k !== 'senderKeyDistributionMessage');

      let mediaMessage = {};
      if (msgType) {
        mediaMessage[msgType] = genMsg.message[msgType];
        const newContextInfo = {
          isGroupStatus: true,
          statusSourceType: rawContent.text ? 4 : rawContent.audio ? 3 : rawContent.video ? 1 : 0,
          featureEligibilities: {
            canBeReshared: true,
            canReceiveMultiReact: false
          },
          statusAttributions: [
            {
              type: 10
            }
          ],
          statusAudienceMetadata: {
            audienceType: 1
          }
        };

        if (mediaMessage[msgType].contextInfo) {
          Object.assign(mediaMessage[msgType].contextInfo, newContextInfo);
        } else {
          mediaMessage[msgType].contextInfo = newContextInfo;
        }
      }

      const payload = {
        groupStatusMessageV2: {
          message: mediaMessage
        }
      };

      const messageId = genMsg.key.id;

      await sock.relayMessage(targetGroupId, payload, { messageId });

      const syntheticRawMsg = buildSyntheticSwGcRawMessage(sock, targetGroupId, mediaMessage, messageId);
      await handleAntiSwGc(syntheticRawMsg, sock, db);

      const mediaType = pendingData.rawContent.text
        ? "نص"
        : pendingData.rawContent.image
          ? "صورة"
          : pendingData.rawContent.video
            ? "فيديو"
            : pendingData.rawContent.audio
              ? "صوت"
              : "وسائط";

      const colorInfo = bgColor !== "#128C7E" ? `\n🎨 اللون: *${bgColor}*` : "";

      const successMsg = `✅ تم النشر (V2) بنجاح إلى مجموعة ${groupName}${colorInfo}`;

      await m.reply(successMsg);
      pendingSwgcV2.delete(m.sender);

      if (pendingData.tempFile && fs.existsSync(pendingData.tempFile)) {
        setTimeout(() => {
          try {
            fs.unlinkSync(pendingData.tempFile);
          } catch (e) {}
        }, 5000);
      }
    } catch (error) {
      await m.reply(
        `❌ *خطأ*\n\n` + `> فشل نشر الحالة V2.\n` + `> _${error.message}_`,
      );
    }
    return;
  }

  let rawContent = {};
  let buffer, ext, tempFile;
  const tempDir = path.join(process.cwd(), "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  // استخراج اللون من النص
  const { color, cleanedText } = extractColor(text);
  const bgColor = color || "#128C7E";

  // التحقق من وجود وسائط
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
      tempFile = path.join(tempDir, `swgcv2_${Date.now()}.${ext}`);
      fs.writeFileSync(tempFile, buffer);

      if (m.quoted.isImage) {
        rawContent.image = buffer;
        rawContent.caption = cleanedText || "";
      } else if (m.quoted.isVideo) {
        rawContent.video = buffer;
        rawContent.caption = cleanedText || "";
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
      tempFile = path.join(tempDir, `swgcv2_${Date.now()}.${ext}`);
      fs.writeFileSync(tempFile, buffer);

      if (m.isImage) {
        rawContent.image = buffer;
        rawContent.caption = cleanedText || "";
      } else if (m.isVideo) {
        rawContent.video = buffer;
        rawContent.caption = cleanedText || "";
      } else if (m.isAudio || m.mimetype?.startsWith("audio")) {
        rawContent.audio = buffer;
        rawContent.mimetype = fileType?.mime || m.mimetype || "audio/mpeg";
        rawContent.ptt = m.msg?.ptt || false;
      }
    } catch (e) {
      await m.reply(te(m.prefix, m.command, m.pushName));
      return;
    }
  } else if (cleanedText && cleanedText.trim()) {
    rawContent.text = cleanedText;
    rawContent.font = 0;
    rawContent.backgroundColor = bgColor;
  } else {
    // عرض قائمة الألوان المتاحة
    const colorList = Object.keys(COLORS).map(c => `• ${c}`).join('\n');
    await m.reply(
      `⚠️ *طريقة الاستخدام*\n\n` +
        `> \`${m.prefix}بوست2 نص\` - حالة نصية V2\n` +
        `> \`${m.prefix}بوست2 نص --لون <اللون>\` - حالة نصية بلون محدد\n` +
        `> رد على صورة/فيديو/صوت + \`${m.prefix}بوست2\`\n` +
        `> أرسل صورة/فيديو مع تعليق \`${m.prefix}بوست2\`\n\n` +
        `*الألوان المتاحة:*\n${colorList}`,
    );
    return;
  }

  pendingSwgcV2.set(m.sender, {
    rawContent: rawContent,
    tempFile: tempFile,
    bgColor: bgColor,
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
      id: `${m.prefix}بوست2 --تأكيد ${id}`,
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

    const colorPreview = bgColor !== "#128C7E" ? `\n🎨 اللون المختار: *${bgColor}*` : "";

    await sock.sendMessage(m.chat, {
      text:
        `📋 *اختر المجموعة لنشر الحالة V2*\n\n` +
        `> الوسائط: *${mediaType}*${colorPreview}\n` +
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
            id: `${prefix}cancelswgcv2`,
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
    pendingSwgcV2.delete(m.sender);
  }
}

export { pluginConfig as config, handler, pendingSwgcV2 };