// حالة الانتظار - أمر لعرض حالة انتظار إنشاء اللوحة

import { getDatabase } from '../../src/lib/maro-database.js'
import { hasAccessToServer, VALID_SERVERS } from '../../src/lib/maro-roles-cpanel.js'
import * as timeHelper from '../../src/lib/maro-time.js'

const DEFAULT_JEDA = 5 * 60 * 1000;

const pluginConfig = {
  name: "حالة_الانتظار",
  alias: ["cekjeda"],
  category: "panel",
  description: "عرض حالة انتظار إنشاء اللوحة",
  usage: ".حالة_الانتظار",
  example: ".حالة_الانتظار",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

function formatTime(ms) {
  if (ms <= 0) return "0 ثانية";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0)
    return `${hours} ساعة ${minutes % 60} دقيقة ${seconds % 60} ثانية`;
  if (minutes > 0) return `${minutes} دقيقة ${seconds % 60} ثانية`;
  return `${seconds} ثانية`;
}

function handler(m, { sock }) {
  const hasAccess = VALID_SERVERS.some((server) =>
    hasAccessToServer(m.sender, server, m.isOwner),
  );

  if (!hasAccess && !m.isOwner) {
    return m.reply(`❌ *فشل*\n\n> ليس لديك صلاحية للوصول إلى لوحة التحكم!`);
  }

  const db = getDatabase();
  const jedaMs = db.setting("panelCreateJeda") ?? DEFAULT_JEDA;
  const lastUsed = db.setting("panelCreateLastUsed") || 0;
  const now = Date.now();
  const elapsed = now - lastUsed;
  const remaining = Math.max(0, jedaMs - elapsed);

  let status = "✅ *جاهز*";
  let statusDesc = "يمكنك إنشاء لوحة الآن!";

  if (jedaMs === 0) {
    status = "⚡ *بدون انتظار*";
    statusDesc = "تم تعطيل الانتظار، يمكنك الإنشاء بحرية!";
  } else if (remaining > 0) {
    status = "🕕 *في فترة انتظار*";
    statusDesc = `انتظر ${formatTime(remaining)}`;
  }

  let text = `⏱️ *حالة انتظار اللوحة*\n\n`;
  text += `╭┈┈⬡「 📊 *الحالة* 」\n`;
  text += `┃ ${status}\n`;
  text += `┃ ${statusDesc}\n`;
  text += `╰┈┈⬡\n\n`;

  text += `╭┈┈⬡「 ⚙️ *الإعدادات* 」\n`;
  text += `┃ ◦ مدة الانتظار: *${jedaMs === 0 ? "معطل" : formatTime(jedaMs)}*\n`;
  text += `┃ ◦ الافتراضي: *5 دقائق*\n`;

  if (lastUsed > 0) {
    const lastUsedTime = timeHelper.fromTimestamp(lastUsed, "HH:mm:ss");
    text += `┃ ◦ آخر إنشاء: *${lastUsedTime}*\n`;
  }

  if (remaining > 0) {
    text += `┃ ◦ المتبقي: *${formatTime(remaining)}*\n`;
  }

  text += `╰┈┈⬡\n\n`;

  if (m.isOwner) {
    text += `> _المالك: استخدم \`${m.prefix}ضبط_الانتظار\` لتعديل الإعداد_`;
  }

  return m.reply(text);
}

export { pluginConfig as config, handler }