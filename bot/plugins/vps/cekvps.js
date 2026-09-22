import axios from 'axios'
import config from '../../config.js'
import * as timeHelper from '../../src/lib/maro-time.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
  name: "cekvps",
  alias: ["vpsstatus"],
  category: "vps",
  description: "عرض تفاصيل VPS من DigitalOcean",
  usage: ".cekvps <id>",
  example: ".cekvps 123456789",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

function hasAccess(sender, isOwner) {
  if (isOwner) return true;
  const cleanSender = sender?.split("@")[0];
  if (!cleanSender) return false;
  const doConfig = config.digitalocean || {};
  return (
    (doConfig.sellers || []).includes(cleanSender) ||
    (doConfig.ownerPanels || []).includes(cleanSender)
  );
}

async function handler(m, { sock }) {
  const token = config.digitalocean?.token;

  if (!token) {
    return m.reply(`⚠️ *لم يتم إعداد DigitalOcean*`);
  }

  if (!hasAccess(m.sender, m.isOwner)) {
    return m.reply(`❌ *تم رفض الوصول*`);
  }

  const dropletId = m.text?.trim();
  if (!dropletId) {
    return m.reply(`⚠️ *طريقة الاستخدام*\n\n> \`${m.prefix}cekvps <معرف_الدروبليت>\``);
  }

  try {
    const response = await axios.get(
      `https://api.digitalocean.com/v2/droplets/${dropletId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const droplet = response.data.droplet;
    const ip =
      droplet.networks?.v4?.find((n) => n.type === "public")?.ip_address || "-";
    const ipv6 = droplet.networks?.v6?.[0]?.ip_address || "-";
    const status =
      droplet.status === "active" ? "🟢 نشط" : "🔴 " + droplet.status;

    let txt = `📋 *تفاصيل VPS*\n\n`;
    txt += `╭─「 🖥️ *المعلومات* 」\n`;
    txt += `┃ 🆔 \`المعرف\`: *${droplet.id}*\n`;
    txt += `┃ 🏷️ \`الاسم\`: *${droplet.name}*\n`;
    txt += `┃ 📊 \`الحالة\`: *${status}*\n`;
    txt += `┃ 🌐 \`IPv4\`: *${ip}*\n`;
    txt += `┃ 🌍 \`IPv6\`: *${ipv6}*\n`;
    txt += `╰───────────────\n\n`;
    txt += `╭─「 🧠 *المواصفات* 」\n`;
    txt += `┃ 💾 \`الذاكرة\`: *${droplet.memory} MB*\n`;
    txt += `┃ ⚡ \`المعالج\`: *${droplet.vcpus} vCPU*\n`;
    txt += `┃ 💿 \`المساحة\`: *${droplet.disk} GB*\n`;
    txt += `┃ 🌏 \`المنطقة\`: *${droplet.region?.name || droplet.region?.slug}*\n`;
    txt += `┃ 💻 \`نظام التشغيل\`: *${droplet.image?.distribution} ${droplet.image?.name}*\n`;
    txt += `╰───────────────\n\n`;
    txt += `> 📅 تاريخ الإنشاء: ${timeHelper.fromTimestamp(droplet.created_at, "DD MMMM YYYY HH:mm:ss")}`;

    await m.reply(txt);
  } catch (err) {
    return m.reply(te(m.prefix, m.command, m.pushName))
  }
}

export { pluginConfig as config, handler }