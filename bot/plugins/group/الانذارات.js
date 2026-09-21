import { getDatabase } from '../../src/lib/maro-database.js'
import * as timeHelper from '../../src/lib/maro-time.js'
const pluginConfig = {
  name: "الانذارات",
  alias: ["listwarn"],
  category: "group",
  description: "عرض قائمة الإنذارات للأعضاء",
  usage: ".الانذارات أو .الانذارات @مستخدم",
  example: ".الانذارات @مستخدم",
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
  let groupData = db.getGroup(m.chat) || {};
  let warnings = groupData.warnings || {};
  const maxWarns = groupData.maxWarnings || 3;

  let targetUser = null;
  if (m.quoted) {
    targetUser = m.quoted.sender;
  } else if (m.mentionedJid && m.mentionedJid.length > 0) {
    targetUser = m.mentionedJid[0];
  }
  if (targetUser) {
    const userWarnings = warnings[targetUser] || [];
    const targetName = targetUser.split("@")[0];

    if (userWarnings.length === 0) {
      await m.reply(`✅ @${targetName} ليس لديه إنذارات.`, { mentions: [targetUser] });
      return;
    }

    let txt = `⚠️ *إنذارات @${targetName}*\n\n`;
    txt += `> المجموع: *${userWarnings.length}/${maxWarns}*\n\n`;

    userWarnings.forEach((w, i) => {
      const date = timeHelper.fromTimestamp(w.time, "DD/MM/YYYY");
      txt += `*${i + 1}.* ${w.reason}\n`;
      txt += `   └ _${date}_\n`;
    });

    await m.reply(txt, { mentions: [targetUser] });
  } else {
    const usersWithWarnings = Object.keys(warnings).filter((u) => warnings[u].length > 0);

    if (usersWithWarnings.length === 0) {
      await m.reply(`✅ لا يوجد أعضاء لديهم إنذارات في هذه المجموعة.`);
      return;
    }

    let txt = `⚠️ *قائمة الإنذارات*\n\n`;

    usersWithWarnings.forEach((user, i) => {
      const count = warnings[user].length;
      const name = user.split("@")[0];
      txt += `*${i + 1}.* @${name} - *${count}/${maxWarns}* إنذار\n`;
    });

    txt += `\n> اكتب \`${m.prefix}الانذارات @مستخدم\` للتفاصيل`;

    await m.reply(txt, { mentions: usersWithWarnings });
  }
}

export { pluginConfig as config, handler }