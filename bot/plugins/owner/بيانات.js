// بيانات — يعرض المعلومات التي تتيحها جلسة البوت عن رقم معروف أو رد أو منشن.
// يدعم تحويل WhatsApp LID إلى JID حقيقي عند وجود خريطة العضو في بيانات المجموعة.

import {
  cacheParticipantLids,
  isLid,
  isLidConverted,
  resolveAnyLidToJid,
} from "../../src/lib/maro-lid.js";

const pluginConfig = {
  name: "بيانات",
  alias: ["data", "info"],
  category: "owner",
  description: "عرض بيانات واتساب المتاحة عن رقم أو رسالة أو منشن، مع دعم LID",
  usage: ".بيانات <رقم> أو بالرد على رسالة أو بمنشن عضو",
  example: ".بيانات 201024211801 أو .بيانات @عضو",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

function bareJid(value = "") {
  return String(value).replace(/^@/, "").split(":")[0].replace(/@.+$/, "");
}

function toJid(value = "") {
  const text = String(value || "").trim().replace(/^@/, "");
  if (!text) return "";
  if (text.includes("@")) return text;

  const digits = text.replace(/\D/g, "");
  return digits ? `${digits}@s.whatsapp.net` : "";
}

function normalizeTarget(value = "", isMention = false) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  // بعض نسخ المكتبة قد تمرر منشن LID على شكل @<lid-number> بلا suffix.
  if (isMention && /^@?\d{12,}$/.test(raw)) {
    return `${raw.replace(/^@/, "")}@lid`;
  }

  return toJid(raw);
}

function directNumberFromText(text = "") {
  const raw = String(text || "").trim();
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 7 ? `${digits}@s.whatsapp.net` : "";
}

async function getParticipants(m, sock) {
  let participants = m.groupMetadata?.participants || m.groupMembers || [];

  if ((!Array.isArray(participants) || participants.length === 0) && m.isGroup) {
    try {
      const metadata = await sock.groupMetadata?.(m.chat);
      participants = metadata?.participants || [];
      if (metadata) m.groupMetadata = metadata;
    } catch {
      participants = [];
    }
  }

  if (Array.isArray(participants) && participants.length) {
    cacheParticipantLids(participants);
  }

  return Array.isArray(participants) ? participants : [];
}

async function resolveTarget(m, sock, text = "") {
  const directTarget = directNumberFromText(text);
  const quotedTarget = m.quoted?.sender || "";
  const mentionedTarget = m.mentionedJid?.[0] || "";
  const senderTarget = m.sender || "";
  const rawTarget = directTarget || quotedTarget || mentionedTarget || senderTarget;
  const participants = await getParticipants(m, sock);

  const normalized = directTarget
    ? directTarget
    : normalizeTarget(rawTarget, Boolean(mentionedTarget || quotedTarget));

  const resolved = resolveAnyLidToJid(normalized, participants);
  const unresolvedLid = isLid(resolved) || isLidConverted(resolved);

  return {
    rawTarget,
    jid: unresolvedLid ? "" : toJid(resolved),
    unresolvedLid,
    participants,
  };
}

async function safely(task, fallback = null) {
  try {
    return await task();
  } catch {
    return fallback;
  }
}

async function getOptionalUsername(sock, jid) {
  if (typeof sock?.executeUSyncQuery !== "function") return null;

  try {
    const { USyncQuery } = await import("maro");
    if (!USyncQuery) return null;

    const query = new USyncQuery();
    query.protocols.push({
      name: "username",
      getQueryElement: () => ({ tag: "username", attrs: {} }),
      getUserElement: () => null,
      parser: (node) => {
        if (!node?.content) return null;
        if (Buffer.isBuffer(node.content)) return node.content.toString();
        if (node.content?.data) return Buffer.from(node.content.data).toString();
        return String(node.content);
      },
    });
    query.users.push({ id: jid });

    const result = await sock.executeUSyncQuery(query);
    return result?.list?.[0]?.username || null;
  } catch {
    return null;
  }
}

function getGroupRole(m, target, participants = []) {
  if (!m.isGroup) return "ليس ضمن مجموعة";

  const targetBare = bareJid(target);
  const member = participants.find((entry) => {
    const candidate = entry?.id || entry?.jid || entry?.phoneNumber || entry;
    return bareJid(candidate) === targetBare;
  });

  if (!member) return "غير ظاهر ضمن بيانات المجموعة الحالية";
  return member.admin === "superadmin"
    ? "مالك المجموعة"
    : member.admin
      ? "مشرف"
      : "عضو";
}

async function handler(m, { sock, text }) {
  const targetInfo = await resolveTarget(m, sock, text);

  if (targetInfo.unresolvedLid) {
    await m.reply(
      "⚠️ *تعذر تحويل منشن العضو إلى رقم صالح حالياً*\n\n" +
      "> أرسل الأمر بالرد على رسالة حديثة من الشخص داخل المجموعة، أو أعد منشنه بعد أن يرسل رسالة جديدة.\n" +
      "> يحافظ البوت على الخصوصية ولا يعرض رقم LID الداخلي كمعلومات حقيقية.\n" +
      "> Tarboo Bot",
    );
    return;
  }

  const target = targetInfo.jid;
  if (!target) {
    await m.reply(
      "⚠️ اكتب رقماً صحيحاً بعد الأمر، أو استخدم الرد على رسالة الشخص أو منشنه.\n" +
      "مثال: `.بيانات 201024211801`",
    );
    return;
  }

  const number = bareJid(target);
  const [onWhatsApp, contactName, status, pictureUrl, business, username] = await Promise.all([
    safely(() => sock.onWhatsApp?.(number), []),
    safely(() => sock.getName?.(target), null),
    safely(() => sock.fetchStatus?.(target), null),
    safely(() => sock.profilePictureUrl?.(target, "image"), null),
    safely(() => sock.getBusinessProfile?.(target), null),
    getOptionalUsername(sock, target),
  ]);

  const waEntry = Array.isArray(onWhatsApp) ? onWhatsApp[0] : null;
  const canonicalJid = waEntry?.jid || target;
  const statusText = Array.isArray(status)
    ? status[0]?.status?.status || status[0]?.status
    : status?.status?.status || status?.status;
  const businessLines = business && Object.keys(business).length
    ? `\n*معلومات الأعمال العامة*\n> الوصف: ${business.description || "غير متاح"}\n> الموقع: ${business.website || "غير متاح"}\n> البريد: ${business.email || "غير متاح"}\n> الفئة: ${business.category || "غير متاح"}`
    : "";

  await m.reply(
    `📋 *بيانات متاحة للبوت*\n\n` +
      `> الاسم المتاح: ${contactName || m.quoted?.pushName || "غير متاح"}\n` +
      `> الرقم: +${number}\n` +
      `> JID: ${canonicalJid}\n` +
      `> مسجل في واتساب: ${waEntry?.exists ? "نعم ✅" : "لم تؤكد الجلسة ذلك"}\n` +
      `> Username اختياري: ${username ? `@${username}` : "غير متاح"}\n` +
      `> الدور في المجموعة: ${getGroupRole(m, target, targetInfo.participants)}\n` +
      `> الصورة العامة: ${pictureUrl ? "متاحة للجلسة ✅" : "غير متاحة أو محمية"}\n` +
      `> النبذة العامة: ${statusText || "غير متاحة"}` +
      `${businessLines}\n\n> يعرض الأمر البيانات المتاحة لجلسة البوت فقط ولا يجمع بيانات من مصادر خارجية.\n> Tarboo Bot`,
  );
}

export { pluginConfig as config, handler };