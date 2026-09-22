// تجديد الإيجار - أمر لتجديد مدة إيجار المجموعة

import { getDatabase } from "../../src/lib/maro-database.js";
import * as timeHelper from "../../src/lib/maro-time.js";
import fs from "fs";
import te from "../../src/lib/maro-error.js";
import { saluranCtx } from "../../src/lib/maro-context.js";

const pluginConfig = {
  name: "تجديد_الإيجار",
  alias: ["renewsewa"],
  category: "owner",
  description: "تجديد مدة إيجار المجموعة",
  usage: ".تجديد_الإيجار <رابط/معرف المجموعة> <المدة>",
  example: ".تجديد_الإيجار https://chat.whatsapp.com/xxx 30d",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

function parseDurationMs(str) {
  if (
    ["lifetime", "permanent", "forever", "unlimited", "دائم", "لانهائي"].includes(
      str.toLowerCase(),
    )
  )
    return Infinity;
  const match = str.match(/^(\d+)([iIdDmMyYhH])$/);
  if (!match) return null;
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const multiplier = {
    i: 60000,
    h: 3600000,
    d: 86400000,
    m: 2592000000,
    y: 31536000000,
  };
  return multiplier[unit] ? value * multiplier[unit] : null;
}

function formatDuration(str) {
  if (
    ["lifetime", "permanent", "forever", "unlimited", "دائم", "لانهائي"].includes(
      str.toLowerCase(),
    )
  )
    return "دائم";
  const match = str.match(/^(\d+)([iIdDmMyYhH])$/);
  if (!match) return str;
  const units = { i: "دقيقة", h: "ساعة", d: "يوم", m: "شهر", y: "سنة" };
  return `${match[1]} ${units[match[2].toLowerCase()] || match[2]}`;
}

async function resolveGroupId(sock, input) {
  if (input.includes("chat.whatsapp.com/")) {
    const inviteCode = input.split("chat.whatsapp.com/")[1]?.split(/[\s?]/)[0];
    if (!inviteCode) return null;
    try {
      const metadata = await sock.groupGetInviteInfo(inviteCode);
      if (!metadata?.id) return null;
      return { id: metadata.id, name: metadata.subject || "غير معروف" };
    } catch {
      return null;
    }
  }
  const groupId = input.includes("@g.us") ? input : input + "@g.us";
  return { id: groupId, name: null };
}

async function handler(m, { sock }) {
  const db = getDatabase();
  if (!db.db.data.sewa) {
    db.db.data.sewa = { enabled: false, groups: {} };
    db.db.write();
  }

  const args = m.args;
  if (args.length < 2) {
    return m.reply(
      `📝 *تجديد الإيجار*\n\n` +
        `الصيغة: *${m.prefix}تجديد_الإيجار <رابط/معرف> <المدة>*\n\n` +
        `*صيغ المدة:*\n` +
        `• 30i = 30 دقيقة\n` +
        `• 12h = 12 ساعة\n` +
        `• 7d = 7 أيام\n` +
        `• 1m = 1 شهر\n` +
        `• 1y = 1 سنة\n` +
        `• دائم = دائم\n\n` +
        `*مثال:*\n` +
        `• ${m.prefix}تجديد_الإيجار https://chat.whatsapp.com/xxx 30d\n` +
        `• ${m.prefix}تجديد_الإيجار 120363xxx 1m\n\n` +
        `💡 يتم إضافة المدة إلى الوقت المتبقي، وليس إعادة تعيينه`,
    );
  }

  const input = args[0];
  const durationStr = args[1];
  const durationMs = parseDurationMs(durationStr);

  if (!durationMs)
    return m.reply(
      `❌ صيغة المدة غير صالحة\nمثال: 7d, 1m, 1y, دائم`,
    );

  await m.react("🕕");

  try {
    const result = await resolveGroupId(sock, input);
    if (!result) {
      await m.react("❌");
      return m.reply(`❌ المجموعة غير موجودة`);
    }

    const { id: groupId } = result;
    const existing = db.db.data.sewa.groups[groupId];

    if (!existing) {
      await m.react("❌");
      return m.reply(
        `❌ المجموعة غير مسجلة\nاستخدم *${m.prefix}إضافة_الإيجار* للإضافة`,
      );
    }

    if (durationMs === Infinity) {
      existing.expiredAt = 0;
      existing.isLifetime = true;
    } else {
      if (existing.isLifetime) {
        await m.react("❌");
        return m.reply(`❌ هذه المجموعة دائمة بالفعل، لا تحتاج إلى تجديد`);
      }
      const baseTime =
        existing.expiredAt > Date.now() ? existing.expiredAt : Date.now();
      existing.expiredAt = baseTime + durationMs;
      existing.isLifetime = false;
    }

    existing.renewedAt = Date.now();
    existing.renewedBy = m.sender;
    if (existing.status) delete existing.status;
    db.db.write();

    const groupName = existing.name || groupId.split("@")[0];
    const expiredStr = existing.isLifetime
      ? "دائم"
      : timeHelper.fromTimestamp(existing.expiredAt, "D MMMM YYYY HH:mm");

    await m.react("✅");

    let text = `✅ *تم تجديد الإيجار*\n\n`;
    text += `المجموعة: *${groupName}*\n`;
    text += `الإضافة: *${formatDuration(durationStr)}*\n`;
    text += `الانتهاء الجديد: *${expiredStr}*`;

    try {
      await sock.sendText(
        groupId,
        `📢 تم تجديد إيجار البوت!\n\nالإضافة: *${formatDuration(durationStr)}*\nالانتهاء الجديد: *${expiredStr}*`,
        null,
        {
          contextInfo: saluranCtx(),
        },
      );
    } catch {}

    return m.reply(text);
  } catch (error) {
    await m.react("☢");
    await m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };