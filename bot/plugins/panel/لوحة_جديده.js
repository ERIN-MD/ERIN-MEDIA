// إنشاء مدير لوحة - أمر لإنشاء مدير لوحة جديد (v1-v5)

import axios from 'axios'
import crypto from 'crypto'
import config from '../../config.js'
import { isLid, lidToJid } from '../../src/lib/maro-lid.js'
import { hasFullAccess, getUserRole, VALID_SERVERS } from '../../src/lib/maro-roles-cpanel.js'
import * as timeHelper from '../../src/lib/maro-time.js'
import te from '../../src/lib/maro-error.js'

const allCommands = VALID_SERVERS.map((v) => `cadmin${v}`);
const allAliases = VALID_SERVERS.map((v) => `createadmin${v}`);

const pluginConfig = {
  name: allCommands,
  alias: allAliases,
  category: "panel",
  description: "إنشاء مدير لوحة جديد (v1-v5)",
  usage: ".cadminv1 اسم_المستخدم أو .cadminv2 اسم_المستخدم,628xxx",
  example: ".cadminv1 مديري,628xxx",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
};

function cleanJid(jid) {
  if (!jid) return null;
  if (isLid(jid)) jid = lidToJid(jid);
  return jid.includes("@") ? jid : jid + "@s.whatsapp.net";
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formatDate() {
  return timeHelper.formatDateTime("D MMMM YYYY HH:mm");
}

function parseServerVersion(cmd) {
  const match = cmd.match(/v([1-5])$/i);
  if (!match) return { server: "v1", serverKey: "s1" };
  return { server: "v" + match[1], serverKey: "s" + match[1] };
}

function getServerConfig(pteroConfig, serverKey) {
  const serverConfigs = {
    s1: pteroConfig.server1,
    s2: pteroConfig.server2,
    s3: pteroConfig.server3,
    s4: pteroConfig.server4,
    s5: pteroConfig.server5,
  };
  return serverConfigs[serverKey] || null;
}

function validateConfig(serverConfig) {
  const missing = [];
  if (!serverConfig?.domain) missing.push("النطاق");
  if (!serverConfig?.apikey) missing.push("مفتاح API (PTLA)");
  return missing;
}

function getAvailableServers(pteroConfig) {
  const available = [];
  for (let i = 1; i <= 5; i++) {
    const cfg = pteroConfig[`server${i}`];
    if (cfg?.domain && cfg?.apikey) available.push(`v${i}`);
  }
  return available;
}

async function handler(m, { sock }) {
  const pteroConfig = config.pterodactyl;

  const { server: serverVersion, serverKey } = parseServerVersion(m.command);
  const serverLabel = serverVersion.toUpperCase();

  if (!hasFullAccess(m.sender, serverVersion, m.isOwner)) {
    const userRole = getUserRole(m.sender, serverVersion);
    return m.reply(
      `❌ *تم رفض الوصول*\n\n` +
        `> ليس لديك صلاحية للوصول إلى *${serverLabel}*\n` +
        `> دورك: *${userRole || "لا يوجد"}*`,
    );
  }

  const serverConfig = getServerConfig(pteroConfig, serverKey);
  const missingConfig = validateConfig(serverConfig);

  if (missingConfig.length > 0) {
    const available = getAvailableServers(pteroConfig);
    let txt = `⚠️ *الخادم ${serverLabel} غير مهيأ*\n\n`;
    if (available.length > 0) {
      txt += `> الخوادم المتاحة: *${available.join(", ")}*\n`;
      txt += `> مثال: \`${m.prefix}cadmin${available[0]} اسم_المستخدم\``;
    } else {
      txt += `> قم بتعبئة \`config.js\` في قسم \`pterodactyl.server1\``;
    }
    return m.reply(txt);
  }

  let targetUser = null;
  let username = null;
  const args = m.text?.trim() || "";

  if (args.includes(",")) {
    const parts = args.split(",");
    username = parts[0]?.trim().toLowerCase();
    let nomor = parts[1]?.trim().replace(/[^0-9]/g, "");
    if (nomor) targetUser = nomor + "@s.whatsapp.net";
  } else if (args) {
    username = args.trim().toLowerCase();
  }

  if (!username) {
    const available = getAvailableServers(pteroConfig);
    return m.reply(
      `⚠️ *طريقة الاستخدام*\n\n` +
        `> \`${m.prefix}${m.command} اسم_المستخدم\`\n` +
        `> \`${m.prefix}${m.command} اسم_المستخدم,628xxx\`\n` +
        `> رد/أشر إلى المستخدم\n\n` +
        `> الخوادم المتاحة: *${available.join(", ") || "لا يوجد"}*`,
    );
  }

  if (!/^[a-z0-9_]{3,16}$/.test(username)) {
    return m.reply(
      `❌ اسم المستخدم يجب أن يحتوي على أحرف صغيرة، أرقام، شرطة سفلية (3-16 حرفاً).`,
    );
  }

  if (!targetUser) {
    if (m.quoted?.sender) {
      targetUser = cleanJid(m.quoted.sender);
    } else if (m.mentionedJid?.length > 0) {
      targetUser = cleanJid(m.mentionedJid[0]);
    } else {
      targetUser = cleanJid(m.sender);
    }
  }

  if (!targetUser) {
    return m.reply(`❌ لا يمكن تحديد الرقم المستهدف.`);
  }

  try {
    const [onWa] = await sock.onWhatsApp(targetUser.split("@")[0]);
    if (!onWa?.exists) {
      return m.reply(
        `❌ الرقم \`${targetUser.split("@")[0]}\` غير مسجل في واتساب!`,
      );
    }
  } catch (e) {}

  const email = `${username}@gmail.com`;
  const name = capitalize(username) + " مدير";
  const password = username + crypto.randomBytes(3).toString("hex");

  await m.reply(
    `🛠️ *جاري إنشاء مدير اللوحة...*\n\n> الخادم: *${serverLabel}*\n> اسم المستخدم: \`${username}\`\n> الهدف: \`${targetUser.split("@")[0]}\``,
  );

  try {
    const userRes = await axios.post(
      `${serverConfig.domain}/api/application/users`,
      {
        email,
        username,
        first_name: name,
        last_name: "مدير",
        root_admin: true,
        language: "ar",
        password,
      },
      {
        headers: {
          Authorization: `Bearer ${serverConfig.apikey}`,
          "Content-Type": "application/json",
          Accept: "Application/vnd.pterodactyl.v1+json",
        },
      },
    );

    const user = userRes.data.attributes;

    let detailTxt = `✅ *تم إنشاء مدير اللوحة بنجاح*\n\n`;
    detailTxt += `╭─「 📋 *تفاصيل الحساب* 」\n`;
    detailTxt += `┃ 🖥️ \`الخادم\`: *${serverLabel}*\n`;
    detailTxt += `┃ 🆔 \`معرف المستخدم\`: *${user.id}*\n`;
    detailTxt += `┃ 👤 \`اسم المستخدم\`: *${user.username}*\n`;
    detailTxt += `┃ 🔐 \`كلمة المرور\`: *${password}*\n`;
    detailTxt += `┃ 👑 \`الحالة\`: *مدير كامل*\n`;
    detailTxt += `┃ 🗓️ \`التاريخ\`: *${formatDate()}*\n`;
    detailTxt += `╰───────────────\n\n`;
    detailTxt += `🌐 *رابط تسجيل الدخول:* ${serverConfig.domain}\n\n`;
    detailTxt += `> ⚠️ هذا الحساب لديه صلاحية كاملة!\n`;
    detailTxt += `> ⚠️ لا تشاركه مع أي شخص!`;

    await sock.sendMessage(targetUser, { text: detailTxt });

    if (targetUser !== m.sender) {
      await m.reply(
        `✅ *تم إنشاء مدير اللوحة بنجاح*\n\n> الخادم: *${serverLabel}*\n> تم إرسال البيانات إلى \`${targetUser.split("@")[0]}\``,
      );
    }
  } catch (err) {
    return m.reply(te(m.prefix, m.command, m.pushName))
  }
}

export { pluginConfig as config, handler }