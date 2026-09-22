const pluginConfig = {
  name: ["ارشيف", "archive"],
  alias: [],
  category: "owner",
  description: "أرشفة/فك أرشفة المحادثات",
  usage: ".ارشيف <رقم/رد> أو .ارشيف فتح <رقم>",
  example: ".ارشيف 628xxx",
  isOwner: true,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const action = m.args[0]?.toLowerCase();
  let targetJid = null;
  let archive = true;

  if (action === "فتح" || action === "buka" || action === "unarchive") {
    archive = false;
    const num = (m.args[1] || "").replace(/[^0-9]/g, "");
    if (num) {
      targetJid = num + "@s.whatsapp.net";
    } else if (m.quoted) {
      targetJid = m.quoted.sender || m.quoted.participant;
    } else if (!m.isGroup) {
      targetJid = m.chat;
    }
  } else if (action === "الكل" || action === "semua") {
    try {
      await m.react("🕕");
      global.isFetchingGroups = true;
      const groups = await sock.groupFetchAllParticipating();
      global.isFetchingGroups = false;
      const groupIds = Object.keys(groups);
      let count = 0;
      for (const jid of groupIds) {
        try {
          await sock.chatModify({ archive: true, lastMessages: [] }, jid);
          count++;
        } catch {}
      }
      await m.react("✅");
      return m.reply(
        `📁 *${count} مجموعة تم أرشفتها*\n\n> المحادثات الخاصة لا يمكن أرشفتها دفعة واحدة (لا توجد قائمة محادثات)`,
      );
    } catch (err) {
      global.isFetchingGroups = false;
      return m.reply(`❌ فشل: ${err.message}`);
    }
  } else {
    if (m.mentionedJid?.length > 0) {
      targetJid = m.mentionedJid[0];
    } else if (m.quoted) {
      targetJid = m.quoted.sender || m.quoted.participant;
    } else if (m.args[0]) {
      const num = m.args[0].replace(/[^0-9]/g, "");
      if (num) targetJid = num + "@s.whatsapp.net";
    } else if (!m.isGroup) {
      targetJid = m.chat;
    }
  }

  if (!targetJid) {
    return m.reply(
      "📁 *أرشفة المحادثات*\n\n" +
        "> `.ارشيف 628xxx` — أرشفة محادثة\n" +
        "> `.ارشيف` (في الخاص) — أرشفة هذه المحادثة\n" +
        "> `.ارشيف` (رد على رسالة) — أرشفة محادثة المرسل\n" +
        "> `.ارشيف فتح 628xxx` — فك أرشفة محادثة\n" +
        "> `.ارشيف الكل` — أرشفة جميع المحادثات",
    );
  }

  try {
    await sock.chatModify({ archive, lastMessages: [] }, targetJid);
    await m.react("✅");
    const target = targetJid.split("@")[0];
    return m.reply(
      archive
        ? `📁 *تمت أرشفة المحادثة*\n\n> الهدف: ${target}\n> استخدم \`.ارشيف فتح ${target}\` لفك الأرشفة`
        : `📂 *تم فك الأرشفة*\n\n> الهدف: ${target}`,
    );
  } catch (err) {
    return m.reply(`❌ فشل: ${err.message}`);
  }
}

export { pluginConfig as config, handler };