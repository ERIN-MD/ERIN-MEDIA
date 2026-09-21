// اخرج - أمر لمغادرة البوت من المجموعة

import config from "../../config.js";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "اخرج",
  alias: ["leave"],
  category: "owner",
  description: "مغادرة البوت من المجموعة",
  usage: ".اخرج [الرابط]",
  example: ".اخرج",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
};

function extractInviteCode(text) {
  const patterns = [
    /chat\.whatsapp\.com\/([a-zA-Z0-9]{20,})/i,
    /wa\.me\/([a-zA-Z0-9]{20,})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }

  return null;
}

async function handler(m, { sock }) {
  const input = m.args.join(" ").trim();

  let targetGroupJid = null;
  let groupName = "";

  if (!input && m.isGroup) {
    targetGroupJid = m.chat;
    try {
      const meta = m.groupMetadata;
      groupName = meta.subject || "هذه المجموعة";
    } catch {
      groupName = "هذه المجموعة";
    }
  } else if (input) {
    const inviteCode = await extractInviteCode(input);

    if (!inviteCode) {
      return m.reply(`❌ *فشل*\n\n> رابط الدعوة غير صالح`);
    }

    try {
      const groupInfo = await sock.groupGetInviteInfo(inviteCode);
      targetGroupJid = groupInfo.id;
      groupName = groupInfo.subject || "غير معروف";
    } catch (error) {
      return m.reply(
        `❌ *فشل*\n\n> لا يمكن الحصول على معلومات المجموعة من الرابط`,
      );
    }
  } else {
    return m.reply(
      `🚪 *اخرج*\n\n` +
        `╭┈┈⬡「 📋 *طريقة الاستخدام* 」\n` +
        `┃ ◦ داخل المجموعة: \`.اخرج\`\n` +
        `┃ ◦ عبر الرابط: \`.اخرج <الرابط>\`\n` +
        `╰┈┈⬡\n\n` +
        `\`مثال: ${m.prefix}اخرج https://chat.whatsapp.com/xxx\``,
    );
  }

  if (!targetGroupJid) {
    return m.reply(`❌ *فشل*\n\n> المجموعة غير موجودة`);
  }

  await m.react("🕕");

  try {
    global.sewaLeaving = true;

    const saluranId = config.saluran?.id || "120363400911374213@newsletter";
    const saluranName = config.saluran?.name || config.bot?.name || "Maro-AI";

    if (m.isGroup && targetGroupJid === m.chat) {
      await sock.sendMessage(m.chat, {
        text:
          `👋 *وداعاً*\n\n` +
          `> سيغادر البوت هذه المجموعة.\n` +
          `> شكراً لاستخدامك البوت!`,
        contextInfo: {
          forwardingScore: 9999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127,
          },
        },
      });
    }

    await sock.groupLeave(targetGroupJid);

    global.sewaLeaving = false;

    if (!m.isGroup || targetGroupJid !== m.chat) {
      await m.react("✅");
      await m.reply(
        `✅ *تم المغادرة بنجاح*\n\n` + `> غادر البوت من: *${groupName}*`,
      );
    }
  } catch (error) {
    global.sewaLeaving = false;
    await m.react("☢");
    await m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };