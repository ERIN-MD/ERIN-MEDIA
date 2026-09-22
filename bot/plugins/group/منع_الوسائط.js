import { getDatabase } from "../../src/lib/maro-database.js";
import config from "../../config.js";
const pluginConfig = {
  name: "منع_الوسائط",
  alias: ["antimedia"],
  category: "group",
  description: "منع الوسائط في المجموعة (صور/فيديو/صوت/مستندات)",
  usage: ".منع_الوسائط <تشغيل/إيقاف>",
  example: ".منع_الوسائط تشغيل",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  isAdmin: true,
  isBotAdmin: true,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

function gpMsg(key, replacements = {}) {
  const defaults = {
    antimedia: "⚠ *منع الوسائط* — وسائط من @%user% تم حذفها.",
  };
  let text = config.groupProtection?.[key] || defaults[key] || "";
  for (const [k, v] of Object.entries(replacements)) {
    text = text.replace(new RegExp(`%${k}%`, "g"), v);
  }
  return text;
}

async function checkAntimedia(m, sock, db) {
  if (!m.isGroup) return false;
  if (m.isAdmin || m.isOwner || m.fromMe) return false;

  const groupData = db.getGroup(m.chat) || {};
  if (!groupData.antimedia) return false;

  const isMedia = m.isImage || m.isVideo || m.isGif || m.isAudio || m.isDocument;
  if (!isMedia) return false;

  try {
    await sock.sendMessage(m.chat, { delete: m.key });
  } catch {}

  await sock.sendMessage(m.chat, {
    text: gpMsg("antimedia", { user: m.sender.split("@")[0] }),
    mentions: [m.sender],
  });

  return true;
}

async function handler(m, { sock }) {
  const db = getDatabase();
  const action = (m.args || [])[0]?.toLowerCase();
  const groupData = db.getGroup(m.chat) || {};

  if (!action) {
    const status = groupData.antimedia ? "✅ مفعل" : "❌ معطل";
    await m.reply(`🖼️ *منع الوسائط*\n\n> الحالة: *${status}*\n\n> \`.منع_الوسائط تشغيل/إيقاف\``);
    return;
  }

  if (action === "تشغيل" || action === "on") {
    db.setGroup(m.chat, { antimedia: true });
    m.react("✅");
    await m.reply(`✅ *تم تفعيل منع الوسائط*`);
    return;
  }

  if (action === "ايقاف" || action === "off") {
    db.setGroup(m.chat, { antimedia: false });
    m.react("❌");
    await m.reply(`❌ *تم تعطيل منع الوسائط*`);
    return;
  }

  await m.reply(`❌ استخدم \`.منع_الوسائط تشغيل\` أو \`.منع_الوسائط إيقاف\``);
}

export { pluginConfig as config, handler, checkAntimedia };