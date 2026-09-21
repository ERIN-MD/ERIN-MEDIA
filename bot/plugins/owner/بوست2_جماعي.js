// بوست2_جماعي - أمر لنشر حالة/قصة المجموعة V2 إلى جميع المجموعات دفعة واحدة مع دعم الألوان

import { getAssetBuffer } from "../../src/lib/maro-asset-manager.js";
import { fileTypeFromBuffer } from "file-type";
import { config } from "../../config.js";
import te from "../../src/lib/maro-error.js";
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

const pluginConfig = {
  name: "بوست2_جماعي",
  alias: ["swgcv2all"],
  category: "owner",
  description: "نشر حالة/قصة المجموعة V2 إلى جميع المجموعات دفعة واحدة مع دعم الألوان",
  usage: ".بوست2_جماعي <نص> [--لون <اللون>] أو رد على ملف",
  example: ".بوست2_جماعي مرحباً جميعاً! --لون ازرق",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 30,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const text = m.text || "";

  // استخراج اللون من النص
  const { color, cleanedText } = extractColor(text);
  const bgColor = color || "#128C7E";

  let rawContent = null;
  let mediaCaption = cleanedText;

  if (m.isMedia || (m.quoted && m.quoted.isMedia)) {
    let buffer;
    if (m.quoted && m.quoted.isMedia) {
      buffer = await m.quoted.download();
    } else if (m.isMedia) {
      buffer = await m.download();
    }

    if (!buffer) {
      return m.reply("❌ فشل تحميل الوسائط. يرجى المحاولة مرة أخرى.");
    }

    const fileType = await fileTypeFromBuffer(buffer);
    const mime = fileType ? fileType.mime : "application/octet-stream";

    if (mime.startsWith("image/")) {
      rawContent = { image: buffer, caption: mediaCaption || "" };
    } else if (mime.startsWith("video/")) {
      rawContent = { video: buffer, caption: mediaCaption || "" };
    } else if (mime.startsWith("audio/")) {
      rawContent = {
        audio: buffer,
        mimetype: "audio/mpeg",
        ptt: m.quoted?.ptt || m.ptt || false,
      };
    } else {
      return m.reply("❌ تنسيق الوسائط غير مدعوم لحالة المجموعة.");
    }
  } else if (mediaCaption) {
    rawContent = { text: mediaCaption, backgroundColor: bgColor, font: 0 };
  } else {
    // عرض قائمة الألوان المتاحة
    const colorList = Object.keys(COLORS).map(c => `• ${c}`).join('\n');
    return m.reply(
      `👋 *بوست2_جماعي*\n\n` +
      `> إرسال حالة مجموعة V2 إلى جميع المجموعات دفعة واحدة.\n\n` +
      `╭┈┈⬡「 📋 *طريقة الاستخدام* 」\n` +
      `┃ ${m.prefix}بوست2_جماعي نص --لون ازرق\n` +
      `┃ أو رد على صورة/فيديو مع تعليق ${m.prefix}بوست2_جماعي --لون احمر\n` +
      `╰┈┈┈┈┈┈┈┈⬡\n\n` +
      `*الألوان المتاحة:*\n${colorList}`
    );
  }

  await m.react("🕕");

  try {
    const groups = await sock.groupFetchAllParticipating();
    const groupIds = Object.keys(groups);

    if (groupIds.length === 0) {
      await m.react("❌");
      return m.reply("❌ البوت ليس في أي مجموعة.");
    }

    const mediaType = rawContent.text ? "نص" : rawContent.image ? "صورة" : rawContent.video ? "فيديو" : "صوت";
    const colorPreview = bgColor !== "#128C7E" ? `\n🎨 اللون: *${bgColor}*` : "";

    await m.reply(`⏳ *جاري بث الحالة V2 إلى ${groupIds.length} مجموعة...*\n\n> الوسائط: *${mediaType}*${colorPreview}\n> قد تستغرق هذه العملية بعض الوقت.`);

    let successCount = 0;
    let failCount = 0;
    let failedGroups = [];

    for (const targetGroupId of groupIds) {
      try {
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
            backgroundColor: rawContent.backgroundColor || bgColor,
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
              canBeSentToParticipants: true
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

        const messageId = genMsg.key.id;
        const finalMessage = buildSyntheticSwGcRawMessage(
          sock,
          targetGroupId,
          mediaMessage,
          messageId
        );

        await sock.relayMessage(targetGroupId, finalMessage.message, {
          messageId: messageId,
        });
        
        successCount++;
      } catch (err) {
        failCount++;
        try {
          const meta = await sock.groupMetadata(targetGroupId);
          failedGroups.push(meta.subject || targetGroupId);
        } catch {
          failedGroups.push(targetGroupId);
        }
      }
    }

    await m.react("✅");
    
    let resultMsg =
      `✅ *اكتمل بث الحالة V2*\n\n` +
      `╭┈┈⬡「 📊 *النتيجة* 」\n` +
      `┃ 🌐 إجمالي المجموعات: *${groupIds.length}*\n` +
      `┃ ✅ نجاح: *${successCount}*\n` +
      `┃ ❌ فشل: *${failCount}*\n` +
      `╰┈┈┈┈┈┈┈┈⬡\n\n` +
      `> الوسائط: *${mediaType}*${colorPreview}`;

    if (failedGroups.length > 0) {
      resultMsg += `\n\n*المجموعات الفاشلة:*\n` + failedGroups.map(g => `> • ${g}`).join("\n");
    }

    await m.reply(resultMsg);

  } catch (error) {
    console.error("[بوست2_جماعي] خطأ:", error.message);
    await m.react("☢");
    await m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };