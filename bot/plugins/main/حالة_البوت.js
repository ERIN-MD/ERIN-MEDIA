import os from "os";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "حالة_البوت",
  alias: ["stats"],
  category: "main",
  description: "عرض إحصائيات البوت",
  usage: ".حالة_البوت",
  example: ".حالة_البوت",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
};

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}ي`);
  if (hours > 0) parts.push(`${hours}س`);
  if (minutes > 0) parts.push(`${minutes}د`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}ث`);

  return parts.join(" ");
}

async function handler(m, { sock, db, uptime, config: botConfig }) {
  try {
    const users = db.db?.data?.users || {};
    const groups = db.db?.data?.groups || {};
    const memUsed = process.memoryUsage();
    const cpuUsage = os.loadavg()[0].toFixed(2);
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const totalUsers = Object.keys(users).length;
    const totalGroups = Object.keys(groups).length;
    const premiumUsers = Object.values(users).filter((u) => u.premium).length;

    const statsObj = {
      bot: botConfig?.bot?.name || "Maro-AI",
      version: `v${botConfig?.bot?.version || "1.0.0"}`,
      uptime: formatUptime(uptime),
      database: {
        users: totalUsers,
        premium: premiumUsers,
        groups: totalGroups,
      },
      system: {
        platform: `${os.platform()} ${os.arch()}`,
        node: process.version,
        cpuLoad: `${cpuUsage}%`,
        ram: `${formatBytes(usedMem)} / ${formatBytes(totalMem)}`,
        heap: `${formatBytes(memUsed.heapUsed)} / ${formatBytes(memUsed.heapTotal)}`,
      },
      updated: new Date().toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
      }),
    };

    const table = [
      "📊 إحصائيات البوت",
      "المفتاح | القيمة",
      `البوت | ${statsObj.bot};;الإصدار | ${statsObj.version};;مدة التشغيل | ${statsObj.uptime}`,
      `المستخدمين | ${statsObj.database.users};;البريميوم | ${statsObj.database.premium};;المجموعات | ${statsObj.database.groups}`,
      `المنصة | ${statsObj.system.platform};;Node | ${statsObj.system.node};;حمل المعالج | ${statsObj.system.cpuLoad}`,
      `الرام | ${statsObj.system.ram};;Heap | ${statsObj.system.heap};;التحديث | ${statsObj.updated}`,
    ];

    await sock.sendTableV2(m.chat, table, m, {
      title: "📊 فيما يلي إحصائيات البوت",
      footer: botConfig?.bot?.name,
    });
  } catch (error) {
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };