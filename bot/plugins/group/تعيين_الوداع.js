import { getDatabase } from "../../src/lib/maro-database.js";
const pluginConfig = {
  name: "تعيين_الوداع",
  alias: ["setgoodbye"],
  category: "group",
  description: "تعيين رسالة وداع مخصصة",
  usage: ".تعيين_الوداع <رسالة>",
  example: ".تعيين_الوداع وداعاً {user}، إلى اللقاء!",
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
  const text = m.text || m.args.join(" ");

  if (!text) {
    return m.reply(
      `📝 *تعيين الوداع*\n\n` +
        `╭┈┈⬡「 📋 *المتغيرات* 」\n` +
        `┃ ◦ \`{user}\` - اسم العضو\n` +
        `┃ ◦ \`{number}\` - رقم العضو\n` +
        `┃ ◦ \`{group}\` - اسم المجموعة\n` +
        `┃ ◦ \`{desc}\` - وصف المجموعة\n` +
        `┃ ◦ \`{count}\` - عدد الأعضاء المتبقين\n` +
        `┃ ◦ \`{owner}\` - اسم مالك المجموعة\n` +
        `┃ ◦ \`{date}\` - التاريخ (DD/MM/YYYY)\n` +
        `┃ ◦ \`{time}\` - الوقت (HH:mm)\n` +
        `┃ ◦ \`{day}\` - اليوم (أحد، إثنين...)\n` +
        `┃ ◦ \`{bot}\` - اسم البوت\n` +
        `┃ ◦ \`{prefix}\` - بادئة البوت\n` +
        `╰┈┈⬡\n\n` +
        `\`مثال:\`\n` +
        `\`${m.prefix}تعيين_الوداع وداعاً {user}! 👋\`\n` +
        `\`إلى اللقاء يوم {day}، {date}\``,
    );
  }

  db.setGroup(m.chat, { goodbyeMsg: text, goodbye: true, leave: true });
  db.save();

  m.react("✅");

  await m.reply(
    `✅ تم تعيين الوداع إلى *${text}*\nللمسح اكتب ${m.prefix}مسح_الوداع`,
  );
}

export { pluginConfig as config, handler };