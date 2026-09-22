// دافونت - أمر للبحث عن الخطوط وتحميلها من DaFont

import { DaFont } from "../../src/scraper/dafont.js";

if (!global.dafontSessions) global.dafontSessions = {};

const SESSION_TIMEOUT = 120000;

function getSessionKey(jid) {
  return String(jid || "").replace(/[^0-9]/g, "") || String(jid).toLowerCase();
}

function getSession(jid) {
  const key = getSessionKey(jid);
  return global.dafontSessions[key] || null;
}

function setSession(jid, data) {
  const key = getSessionKey(jid);
  clearSession(jid);
  global.dafontSessions[key] = {
    data,
    chat: null,
    startedAt: Date.now(),
    timeout: setTimeout(() => {
      delete global.dafontSessions[key];
    }, SESSION_TIMEOUT),
  };
  return global.dafontSessions[key];
}

function clearSession(jid) {
  const key = getSessionKey(jid);
  const session = global.dafontSessions[key];
  if (session?.timeout) clearTimeout(session.timeout);
  delete global.dafontSessions[key];
}

const pluginConfig = {
  name: "دافونت",
  alias: ["dafont"],
  category: "tools",
  description: "البحث عن الخطوط وتحميلها من DaFont",
  usage: ".دافونت <اسم الخط>",
  example: ".دافونت arial",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const text = m.args.join(" ");
  if (!text) {
    m.react("❌");
    return m.reply(
      `🔤 *البحث في DaFont*\n\n` +
        `ابحث عن خطوط من DaFont، ثم رد بالرقم لتحميل الخط.\n\n` +
        `*طريقة الاستخدام:*\n` +
        `> *${m.prefix}دافونت <اسم الخط>*\n\n` +
        `*مثال:*\n` +
        `> *${m.prefix}دافونت arial*\n` +
        `> *${m.prefix}دافونت رعب*\n\n` +
        `_بعد ظهور القائمة، رد على رسالة البوت برقم الخط للتحميل_`
    );
  }

  m.react("🕕");

  try {
    const result = await DaFont(text);

    if (!result.status) {
      m.react("☢");
      return m.reply(`❌ *فشل البحث في DaFont*\n\n> ${result.error}`);
    }

    const items = result.results.slice(0, 10);

    let txt = `🔤 *DaFont — تم العثور على ${result.count} خط*\n\n`;
    txt += `> البحث: *${text}*\n\n`;

    items.forEach((v, i) => {
      txt += `*${i + 1}.* ${v.name}\n`;
      txt += `   ├ 👤 المؤلف: ${v.author}\n`;
      txt += `   ├ 📥 التنزيلات: ${v.downloads || "-"}\n`;
      txt += `   └ 📜 الترخيص: ${v.license || "-"}\n`;
    });

    txt += `\n_رد على هذه الرسالة برقم الخط لتحميل الملف_`;

    const session = setSession(m.sender, items);
    session.chat = m.chat;

    await m.reply(txt);
    m.react("✅");
  } catch (e) {
    console.error(e);
    m.react("☢");
    m.reply("❌ فشل البحث عن الخط، حاول مرة أخرى لاحقاً");
  }
}

async function dafontAnswerHandler(m, sock) {
  const session = getSession(m.sender);
  if (!session) return false;
  if (m.chat !== session.chat) return false;

  const text = (m.body || m.text || "").trim();
  const index = parseInt(text) - 1;

  if (isNaN(index) || index < 0 || index >= session.data.length) return false;

  const v = session.data[index];

  let detail = `🔤 *${v.name}*\n\n` +
    `> 👤 المؤلف: ${v.author}\n` +
    `> 📥 التنزيلات: ${v.downloads || "-"}\n` +
    `> 📜 الترخيص: ${v.license || "-"}`;

  if (v.preview) {
    await sock.sendMedia(m.chat, v.preview, detail, m, { type: "image" });
  } else {
    await m.reply(detail);
  }

  if (v.download) {
    await sock.sendMessage(
      m.chat,
      {
        document: { url: v.download },
        fileName: v.name + ".zip",
        mimetype: "application/zip",
      },
      { quoted: m },
    );
  }

  clearSession(m.sender);
  return true;
}

export { pluginConfig as config, handler, dafontAnswerHandler, clearSession };