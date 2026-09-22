import { getDatabase } from "../../src/lib/maro-database.js";
import { decodeAndNormalize } from "../../src/lib/maro-lid.js";
import config from "../../config.js";

const pluginConfig = {
  name: "نشر_خاص",
  alias: ["bcpc"],
  category: "owner",
  description: "نشر رسالة إلى جميع جهات الاتصال في الخاص",
  usage: ".نشر_خاص <رسالة>",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
};

function getBcContextInfo() {
  const saluranId = config.saluran?.id || "";
  const saluranName = config.saluran?.name || config.bot?.name || "";
  const ctx = {
    forwardingScore: 1,
    isForwarded: true,
  };
  if (saluranId && saluranId !== "-@newsletter") {
    ctx.forwardedNewsletterMessageInfo = {
      newsletterJid: saluranId,
      newsletterName: saluranName,
      serverMessageId: Math.floor(Math.random() * 1000) + 1,
    };
  }
  return ctx;
}

async function handler(m, { sock }) {
  const db = getDatabase();
  const input = m.fullArgs?.trim() || m.text?.trim() || "";

  if (!input) {
    const jeda = db.setting("jedaBcpc") || 5000;
    return m.reply(
      `📱 *نشر خاص*\n\n` +
        `التأخير: ${jeda}ms (${(jeda / 1000).toFixed(1)}s)\n\n` +
        `*الاستخدام:*\n` +
        `• \`${m.prefix}نشر_خاص <رسالة>\` — إرسال إلى جميع جهات الاتصال\n` +
        `• \`${m.prefix}نشر_خاص (رد على وسائط)\` — إرسال مع وسائط\n\n` +
        `⚠️ *تحذير:* البوت سيرسل الرسالة إلى جميع جهات الاتصال المحفوظة!\n\n` +
        `ℹ️ *ملاحظة:* جهات الاتصال تظهر فقط إذا سبق لها مراسلة البوت. جهات الاتصال المحفوظة فقط بدون محادثة سابقة لن تظهر.`,
    );
  }

  if (global.statusBcpc) {
    return m.reply(
      `❌ النشر الخاص قيد التشغيل.\nاكتب \`${m.prefix}stopbcpc\` للإيقاف.`,
    );
  }

  m.react("📱");

  try {
    let mediaBuffer = null;
    let mediaType = null;
    const qmsg = m.quoted || m;

    if (qmsg.isImage) {
      try {
        mediaBuffer = await qmsg.download();
        mediaType = "image";
      } catch {}
    } else if (qmsg.isVideo) {
      try {
        mediaBuffer = await qmsg.download();
        mediaType = "video";
      } catch {}
    }

    const privateJids = new Set();
    const botNum = sock.user?.id?.split(":")[0] || "";

    const chatsMap = sock.store?.chats;
    if (chatsMap) {
      for (const [jid] of chatsMap.entries()) {
        const decoded = decodeAndNormalize(jid);
        if (decoded && decoded.endsWith("@s.whatsapp.net")) {
          const num = decoded.split("@")[0];
          if (num !== botNum) privateJids.add(decoded);
        }
      }
    }

    const messagesMap = sock.store?.messages;
    if (messagesMap) {
      for (const [jid] of messagesMap.entries()) {
        const decoded = decodeAndNormalize(jid);
        if (decoded && decoded.endsWith("@s.whatsapp.net")) {
          const num = decoded.split("@")[0];
          if (num !== botNum) privateJids.add(decoded);
        }
      }
    }

    const contactsObj = sock.store?.contacts;
    if (contactsObj) {
      for (const jid of Object.keys(contactsObj)) {
        const decoded = decodeAndNormalize(jid);
        if (decoded && decoded.endsWith("@s.whatsapp.net")) {
          const num = decoded.split("@")[0];
          if (num !== botNum) privateJids.add(decoded);
        }
      }
    }

    if (privateJids.size === 0) {
      m.react("❌");
      return m.reply(
        "❌ لا توجد جهات اتصال.\n\nتأكد من أن البوت قد استقبل رسائل من جهات الاتصال تلك.",
      );
    }

    const filtered = [...privateJids];

    const jeda = db.setting("jedaBcpc") || 5000;
    const ctx = getBcContextInfo();

    await sock.sendMessage(
      m.chat,
      {
        text:
          `📱 *نشر خاص*\n\n` +
          `╭┈┈⬡「 📋 *التفاصيل* 」\n` +
          `┃ 📝 الرسالة: \`${input.substring(0, 50)}${input.length > 50 ? "..." : ""}\`\n` +
          `┃ 📷 الوسائط: \`${mediaBuffer ? mediaType : "لا"}\`\n` +
          `┃ 👥 المستهدفين: \`${filtered.length}\` جهة اتصال\n` +
          `┃ ⏱️ التأخير: \`${jeda}ms\`\n` +
          `┃ 📊 التقدير: \`${Math.ceil((filtered.length * jeda) / 60000)} دقيقة\`\n` +
          `╰┈┈⬡\n\n` +
          `> جاري بدء النشر...`,
        contextInfo: ctx,
      },
      { quoted: m },
    );

    global.statusBcpc = true;
    let success = 0;
    let failed = 0;

    for (const jid of filtered) {
      if (global.stopBcpc) {
        delete global.stopBcpc;
        break;
      }
      try {
        if (mediaBuffer) {
          await sock.sendMedia(jid, mediaBuffer, input, null, {
            type: mediaType,
            contextInfo: ctx,
          });
        } else {
          await sock.sendText(jid, input, null, { contextInfo: ctx });
        }
        success++;
      } catch {
        failed++;
      }
      await new Promise((r) => setTimeout(r, jeda));
    }

    delete global.statusBcpc;
    m.react("✅");

    await sock.sendMessage(
      m.chat,
      {
        text:
          `✅ *اكتمل النشر الخاص*\n\n` +
          `╭┈┈⬡「 📊 *النتيجة* 」\n` +
          `┃ ✅ ناجح: \`${success}\`\n` +
          `┃ ❌ فاشل: \`${failed}\`\n` +
          `┃ 📊 المجموع: \`${filtered.length}\`\n` +
          `╰┈┈⬡`,
        contextInfo: ctx,
      },
      { quoted: m },
    );
  } catch (e) {
    delete global.statusBcpc;
    m.react("❌");
    m.reply("فشل: " + e.message);
  }
}

export { pluginConfig as config, handler };