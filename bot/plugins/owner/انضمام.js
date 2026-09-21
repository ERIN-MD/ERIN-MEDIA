// انضمام - أمر لانضمام البوت إلى المجموعة عبر رابط الدعوة، يدعم الرد على الرسائل التي تحتوي على رابط

import config from "../../config.js";
import { saluranCtx } from "../../src/lib/maro-context.js";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "انضمام",
  alias: ["join"],
  category: "owner",
  description: "انضمام البوت إلى المجموعة عبر رابط الدعوة، يدعم الرد على الرسائل التي تحتوي على رابط",
  usage: ".انضمام <الرابط> / .انضمام (رد على رسالة تحتوي على رابط)",
  example: ".انضمام https://chat.whatsapp.com/xxx",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
};

function extractAllInviteCodes(text) {
  if (!text) return [];
  const codes = [];
  const seen = new Set();

  const patterns = [
    /chat\.whatsapp\.com\/([a-zA-Z0-9]{20,})/gi,
    /invite\.whatsapp\.com\/([a-zA-Z0-9]{20,})/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const code = match[1];
      if (!seen.has(code)) {
        seen.add(code);
        codes.push(code);
      }
    }
  }

  return codes;
}

async function joinGroup(sock, inviteCode) {
  try {
    const groupInfo = await sock.groupGetInviteInfo(inviteCode);
    if (!groupInfo) return { success: false, error: "لا يمكن الحصول على معلومات المجموعة" };

    const botJid = sock.user?.id?.replace(/:.*@/, "@") || "";
    const isMember = groupInfo.participants?.some(
      (p) => p.id === botJid || p.id?.includes(sock.user?.id?.split(":")[0]),
    );

    if (isMember) {
      return {
        success: false,
        alreadyMember: true,
        subject: groupInfo.subject || "غير معروف",
      };
    }

    await sock.groupAcceptInvite(inviteCode);
    return {
      success: true,
      subject: groupInfo.subject || "غير معروف",
      members: groupInfo.size || groupInfo.participants?.length || 0,
      owner: groupInfo.owner?.split("@")[0] || "غير معروف",
    };
  } catch (error) {
    let errorMsg = error.message || "الرابط غير صالح";
    if (errorMsg.includes("not-authorized")) errorMsg = "الرابط غير صالح أو منتهي الصلاحية";
    else if (errorMsg.includes("gone") || errorMsg.includes("item-not-found") || errorMsg.includes("404")) errorMsg = "المجموعة غير موجودة (رابط غير صحيح/تم إلغاؤه)";
    else if (errorMsg.includes("conflict")) errorMsg = "البوت عضو بالفعل";
    else errorMsg = "الرابط غير صالح أو البوت ممنوع من الانضمام";
    return { success: false, error: errorMsg };
  }
}

async function handler(m, { sock }) {
  const input = m.args.join(" ").trim();
  let sourceText = input;

  if (!input && m.quoted) {
    sourceText = m.quoted.body || m.quoted.text || m.quoted.contentText || "";
  }

  if (!sourceText) {
    return m.reply(
      `🔗 *انضمام إلى المجموعة*\n\n` +
        `سينضم البوت إلى المجموعة بناءً على رابط الدعوة الذي تقدمه.\n\n` +
        `*طريقة الاستخدام:*\n` +
        `> *${m.prefix}انضمام <الرابط>* — انضمام عبر الرابط مباشرة\n` +
        `> *${m.prefix}انضمام* (رد على رسالة) — انضمام من الرابط الموجود في الرسالة المردود عليها\n\n` +
        `*مثال:*\n` +
        `> *${m.prefix}انضمام https://chat.whatsapp.com/xxx*\n` +
        `> رد على رسالة تحتوي على رابط ثم اكتب *${m.prefix}انضمام*\n\n` +
        `_سيكتشف البوت جميع روابط المجموعة في الرسالة وينضم واحدة تلو الأخرى_`
    );
  }

  const inviteCodes = extractAllInviteCodes(sourceText);

  if (inviteCodes.length === 0) {
    return m.reply(
      `❌ *لا يوجد رابط مجموعة*\n\n` +
        `> لم يجد البوت رابط دعوة للمجموعة في هذه الرسالة.\n\n` +
        `*صيغ الرابط المدعومة:*\n` +
        `> *https://chat.whatsapp.com/xxx*\n` +
        `> *https://invite.whatsapp.com/xxx*`
    );
  }

  m.react("🕕");

  if (inviteCodes.length === 1) {
    const result = await joinGroup(sock, inviteCodes[0]);

    if (result.alreadyMember) {
      m.react("❌");
      return m.reply(
        `❌ *عضو بالفعل*\n\n> البوت موجود بالفعل في مجموعة *${result.subject}*`
      );
    }

    if (!result.success) {
      m.react("❌");
      return m.reply(`❌ *فشل الانضمام*\n\n> ${result.error}`);
    }

    m.react("✅");
    const ctx = saluranCtx();
    return m.reply(
      `✅ *تم الانضمام بنجاح!*\n\n` +
        `> 🏠 الاسم: *${result.subject}*\n` +
        `> 👥 الأعضاء: *${result.members}*\n` +
        `> 👤 المالك: *${result.owner}*`,
      { contextInfo: ctx }
    );
  }

  let resultText =
    `🔗 *انضمام متعدد — تم اكتشاف ${inviteCodes.length} رابط*\n\n` +
    `سينضم البوت إلى جميع المجموعات واحدة تلو الأخرى.\n\n`;

  let successCount = 0;
  let alreadyCount = 0;
  let failedCount = 0;

  for (let i = 0; i < inviteCodes.length; i++) {
    const result = await joinGroup(sock, inviteCodes[i]);

    if (result.alreadyMember) {
      alreadyCount++;
      resultText += `*${i + 1}.* ${result.subject} — ⚠️ عضو بالفعل\n`;
    } else if (result.success) {
      successCount++;
      resultText += `*${i + 1}.* ${result.subject} — ✅ تم الانضمام بنجاح\n`;
    } else {
      failedCount++;
      resultText += `*${i + 1}.* ${inviteCodes[i].substring(0, 12)}... — ❌ ${result.error}\n`;
    }

    if (i < inviteCodes.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  resultText +=
    `\n*النتيجة:*\n` +
    `> ✅ نجاح: *${successCount}*\n` +
    `> ⚠️ عضو بالفعل: *${alreadyCount}*\n` +
    `> ❌ فشل: *${failedCount}*\n` +
    `> 📊 الإجمالي: *${inviteCodes.length}*`;

  m.react(successCount > 0 ? "✅" : "❌");
  return m.reply(resultText);
}

export { pluginConfig as config, handler };