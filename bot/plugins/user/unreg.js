import { getDatabase } from "../../src/lib/maro-database.js";
import config from "../../config.js";

const pluginConfig = {
  name: "unreg",
  alias: ["unregister"],
  category: "user",
  description: "حذف بيانات تسجيلك من البوت",
  usage: ".unreg",
  example: ".unreg",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 30,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user?.isRegistered) {
    return m.reply(
      `❌ أنت غير مسجل!\n\n` + `> سجل بـ \`${m.prefix}daftar\``,
    );
  }

  const saluranId = config.saluran?.id || "120363400911374213@newsletter";
  const saluranName = config.saluran?.name || config.bot?.name || "Maro-AI";
  const unregisteredAt = new Date().toISOString();

  db.setUser(m.sender, {
    isRegistered: false,
    regName: null,
    regAge: null,
    regGender: null,
    unregisteredAt,
  });

  await db.save();

  await sock.sendMessage(
    m.chat,
    {
      text:
        `✅ *تم إلغاء التسجيل بنجاح!*\n\n` +
        `تم حذف بيانات تسجيلك.\n\n` +
        `> للتسجيل مرة أخرى: \`${m.prefix}daftar\``,
      contextInfo: {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: saluranId,
          newsletterName: saluranName,
          serverMessageId: 127,
        },
      },
    },
    { quoted: m },
  );

  m.react("✅");
}

export { pluginConfig as config, handler };