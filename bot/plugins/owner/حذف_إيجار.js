// حذف الإيجار - أمر لحذف المجموعة من قائمة الإيجار البيضاء

import { getDatabase } from "../../src/lib/maro-database.js";
import { saluranCtx } from "../../src/lib/maro-context.js";

const pluginConfig = {
  name: "حذف_إيجار",
  alias: ["delsewa"],
  category: "owner",
  description: "حذف المجموعة من قائمة الإيجار البيضاء",
  usage: ".حذف_إيجار <رابط/معرف المجموعة>",
  example: ".حذف_إيجار https://chat.whatsapp.com/xxx",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

async function resolveGroupId(sock, input) {
  if (input.includes("chat.whatsapp.com/")) {
    const inviteCode = input.split("chat.whatsapp.com/")[1]?.split(/[\s?]/)[0];
    try {
      const metadata = await sock.groupGetInviteInfo(inviteCode);
      if (metadata?.id) return { id: metadata.id, name: metadata.subject };
    } catch {}
    return null;
  }
  return { id: input.includes("@g.us") ? input : input + "@g.us", name: null };
}

async function handler(m, { sock }) {
  const db = getDatabase();
  const input = m.text?.trim();

  if (!db.db.data.sewa) {
    db.db.data.sewa = { enabled: false, groups: {} };
    db.db.write();
  }

  let groupId = null;
  let groupName = null;

  if (!input) {
    if (!m.isGroup) {
      return m.reply(
        `📝 *حذف الإيجار*\n\n` +
          `من الخاص: *${m.prefix}حذف_إيجار <رابط/معرف>*\n` +
          `من المجموعة: اكتب *${m.prefix}حذف_إيجار* مباشرة في المجموعة\n\n` +
          `مثال:\n` +
          `• ${m.prefix}حذف_إيجار https://chat.whatsapp.com/xxx\n` +
          `• ${m.prefix}حذف_إيجار 120363xxx\n\n` +
          `⚠️ إذا كان نظام الإيجار نشطاً، سيغادر البوت المجموعة تلقائياً بعد الحذف`,
      );
    }
    groupId = m.chat;
  } else {
    const result = await resolveGroupId(sock, input);
    if (!result)
      return m.reply(`❌ الرابط غير صالح أو المجموعة غير موجودة`);
    groupId = result.id;
    groupName = result.name;
  }

  if (!groupId) return m.reply(`❌ لا يمكن تحديد المجموعة`);

  const sewaData = db.db.data.sewa.groups[groupId];
  if (!sewaData)
    return m.reply(
      `❌ المجموعة غير مسجلة في نظام الإيجار\n\nعرض القائمة: *${m.prefix}قائمة_الإيجار*`,
    );

  groupName = groupName || sewaData.name || groupId.split("@")[0];

  delete db.db.data.sewa.groups[groupId];
  db.db.write();

  await m.react("✅");
  await m.reply(
    `✅ *تم حذف الإيجار*\n\nالمجموعة: *${groupName}*\nالمعرف: ${groupId.split("@")[0]}`,
  );

  if (db.db.data.sewa.enabled) {
    try {
      await sock.sendText(
        groupId,
        `⛔ تم حذف هذه المجموعة من قائمة الإيجار البيضاء.\nسيغادر البوت المجموعة.\n\nتواصل مع المالك لإعادة الإيجار.`,
        null,
        {
          contextInfo: saluranCtx(),
        },
      );
      await new Promise((r) => setTimeout(r, 2000));
      await sock.groupLeave(groupId);
    } catch {}
  }
}

export { pluginConfig as config, handler };