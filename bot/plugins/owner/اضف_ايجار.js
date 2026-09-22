import config from "../../config.js";
import { getDatabase } from "../../src/lib/maro-database.js";
import * as timeHelper from "../../src/lib/maro-time.js";
import fs from "fs";
import te from "../../src/lib/maro-error.js";
import { saluranCtx } from "../../src/lib/maro-context.js";

const pluginConfig = {
  name: "اضف_ايجار",
  alias: ["addsewa"],
  category: "owner",
  description: "إضافة مجموعة إلى قائمة الإيجار + انضمام تلقائي",
  usage: ".اضف_ايجار <رابط/معرف المجموعة> <المدة>",
  example: ".اضف_ايجار https://chat.whatsapp.com/xxx 30d",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

function parseDuration(str) {
  if (
    ["lifetime", "permanent", "forever", "unlimited", "دائم", "مدى_الحياة"].includes(
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
  return multiplier[unit] ? Date.now() + value * multiplier[unit] : null;
}

function formatDuration(str) {
  if (
    ["lifetime", "permanent", "forever", "unlimited", "دائم", "مدى_الحياة"].includes(
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
      console.log(metadata);
      if (!metadata?.id) return null;
      return {
        id: metadata.id,
        name: metadata.subject || "غير معروف",
        inviteCode,
      };
    } catch {
      return null;
    }
  }
  const groupId = input.includes("@g.us") ? input : input + "@g.us";
  try {
    const metadata = await sock.groupMetadata(groupId);
    return {
      id: groupId,
      name: metadata?.subject || "غير معروف",
      inviteCode: null,
    };
  } catch {
    return { id: groupId, name: "غير معروف", inviteCode: null };
  }
}

async function tryJoinGroup(sock, inviteCode, groupId) {
  if (!inviteCode)
    return {
      joined: false,
      reason: "لا يوجد رابط دعوة، أضف البوت يدوياً",
    };
  try {
    const botJid = sock.user?.id?.split(":")[0] + "@s.whatsapp.net";
    const metadata = await sock.groupMetadata(groupId).catch(() => null);
    if (metadata) {
      const isMember = metadata.participants?.some((p) => {
        const pJid = p.id?.split(":")[0] + "@s.whatsapp.net";
        return pJid === botJid || p.id === botJid;
      });
      if (isMember) return { joined: true, reason: "البوت موجود مسبقاً في المجموعة" };
    }
    await sock.groupAcceptInvite(inviteCode);
    return { joined: true, reason: "تم انضمام البوت للمجموعة بنجاح" };
  } catch (e) {
    return { joined: false, reason: e.message || "فشل في الانضمام للمجموعة" };
  }
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
      `📝 *إضافة إيجار*\n\n` +
        `الصيغة: *${m.prefix}اضف_ايجار <رابط/معرف> <المدة>*\n\n` +
        `*صيغ المدة:*\n` +
        `• 30i = 30 دقيقة\n` +
        `• 12h = 12 ساعة\n` +
        `• 7d = 7 أيام\n` +
        `• 1m = 1 شهر (30 يوم)\n` +
        `• 1y = 1 سنة\n` +
        `• دائم = مدى الحياة\n\n` +
        `*إدخال المجموعة:*\n` +
        `• رابط: https://chat.whatsapp.com/xxx\n` +
        `• معرف: 120363xxx@g.us\n\n` +
        `*مثال:*\n` +
        `• ${m.prefix}اضف_ايجار https://chat.whatsapp.com/xxx 30d\n` +
        `• ${m.prefix}اضف_ايجار 120363xxx 1m\n\n` +
        `💡 إذا استخدمت الرابط، سينضم البوت تلقائياً إلى المجموعة!`,
    );
  }

  const input = args[0];
  const durationStr = args[1];
  const expiredAt = parseDuration(durationStr);

  if (!expiredAt)
    return m.reply(
      `❌ صيغة المدة غير صالحة\n\nمثال: 7d, 1m, 1y, دائم`,
    );

  await m.react("🕕");

  try {
    const result = await resolveGroupId(sock, input);
    if (!result) {
      await m.react("❌");
      return m.reply(`❌ المجموعة غير موجودة أو الرابط غير صالح`);
    }

    const { id: groupId, name: groupName, inviteCode } = result;
    const isLifetime = expiredAt === Infinity;

    db.db.data.sewa.groups[groupId] = {
      name: groupName,
      addedAt: Date.now(),
      expiredAt: isLifetime ? 0 : expiredAt,
      isLifetime,
      addedBy: m.sender,
    };
    db.db.write();

    const expiredStr = isLifetime
      ? "دائم"
      : timeHelper.fromTimestamp(expiredAt, "D MMMM YYYY HH:mm");

    let text = `✅ *تمت إضافة الإيجار بنجاح*\n\n`;
    text += `المجموعة: *${groupName}*\n`;
    text += `المعرف: ${groupId.split("@")[0]}\n`;
    text += `المدة: *${formatDuration(durationStr)}*\n`;
    text += `تاريخ الانتهاء: *${expiredStr}*\n\n`;

    const joinResult = await tryJoinGroup(sock, inviteCode, groupId);

    if (joinResult.joined) {
      text += `✅ ${joinResult.reason}`;
      try {
        await new Promise((r) => setTimeout(r, 2000));
        await sock.sendText(
          groupId,
          `👋 *مرحباً بالجميع!*، اسمي ${config.bot?.name}\n\n- مدة الإيجار: *${formatDuration(durationStr)}*\n- سأغادر في: *${expiredStr}*\n\nاكتب *${m.prefix}menu* لرؤية ميزات هذا البوت.`,
          null,
          {
            contextInfo: saluranCtx(),
          },
        );
      } catch {}
    } else {
      text += `⚠️ فشل الانضمام التلقائي: ${joinResult.reason}\nأضف البوت إلى المجموعة يدوياً.`;
    }

    await m.react("✅");
    return m.reply(text);
  } catch (error) {
    await m.react("☢");
    await m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };