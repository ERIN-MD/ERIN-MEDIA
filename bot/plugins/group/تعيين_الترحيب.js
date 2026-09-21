import { getDatabase } from "../../src/lib/maro-database.js";
const pluginConfig = {
  name: "تعيين_الترحيب",
  alias: ["setwelcome"],
  category: "group",
  description: "تعيين رسالة ترحيب مخصصة",
  usage: ".تعيين_الترحيب <رسالة>",
  example: ".تعيين_الترحيب أهلاً {user}، نورت {group}!",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  isAdmin: true,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const text = m.fullArgs?.trim() || m.args.join(" ");

  if (!text) {
    return m.reply(
      `📝 *تعيين الترحيب*\n\n` +
        `╭┈┈⬡「 📋 *المتغيرات* 」\n` +
        `┃ ◦ \`{user}\` - اسم العضو\n` +
        `┃ ◦ \`{number}\` - رقم العضو\n` +
        `┃ ◦ \`{group}\` - اسم المجموعة\n` +
        `┃ ◦ \`{desc}\` - وصف المجموعة\n` +
        `┃ ◦ \`{count}\` - عدد الأعضاء\n` +
        `┃ ◦ \`{owner}\` - اسم مالك المجموعة\n` +
        `┃ ◦ \`{date}\` - التاريخ (DD/MM/YYYY)\n` +
        `┃ ◦ \`{time}\` - الوقت (HH:mm)\n` +
        `┃ ◦ \`{day}\` - اليوم (أحد، إثنين...)\n` +
        `┃ ◦ \`{bot}\` - اسم البوت\n` +
        `┃ ◦ \`{prefix}\` - بادئة البوت\n` +
        `╰┈┈⬡\n\n` +
        `\`مثال:\`\n` +
        `\`${m.prefix}تعيين_الترحيب أهلاً {user}! 👋\`\n` +
        `\`نورت {group} يوم {day}، {date}\``,
    );
  }

  db.setGroup(m.chat, { welcomeMsg: text, welcome: true });
  db.save();

  m.react("✅");

  await m.reply(
    `✅ تم تعيين الترحيب إلى *${text}*\nللمسح اكتب ${m.prefix}مسح_الترحيب`,
  );
}

export { pluginConfig as config, handler };