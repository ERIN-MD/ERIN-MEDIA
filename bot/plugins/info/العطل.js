import axios from "axios";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "العطل",
  alias: ["harilibur"],
  category: "info",
  description: "عرض معلومات العطل والأيام الوطنية القادمة",
  usage: ".العطل",
  example: ".العطل",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  await m.react("🕕");

  try {
    const res = await axios.get("https://api.nexray.eu.cc/information/hari-libur", {
      timeout: 30000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const data = res.data;
    if (!data.status || !data.result) {
      await m.react("❌");
      return m.reply("⚠️ فشل جلب معلومات العطل حالياً.");
    }

    const r = data.result;
    let caption = `📅 *العطل والأيام الوطنية القادمة* 📅\n\n`;

    if (r.mendatang.hari_libur && r.mendatang.hari_libur.length > 0) {
      caption += `*العطل القادمة*\n`;
      r.mendatang.hari_libur.slice(0, 5).forEach(item => {
        caption += `- ${item.date}: ${item.event} (بعد ${item.daysUntil} يوم)\n`;
      });
      caption += `\n`;
    }

    if (r.mendatang.event_nasional && r.mendatang.event_nasional.length > 0) {
      caption += `*الأيام الوطنية القادمة*\n`;
      r.mendatang.event_nasional.slice(0, 5).forEach(item => {
        caption += `- ${item.date}: ${item.event} (بعد ${item.daysUntil} يوم)\n`;
      });
    }

    await m.reply(caption.trim());
    await m.react("✅");

  } catch (error) {
    console.error("[العطل]", error.message);
    await m.react("☢");
    m.reply("😔 حدث خطأ أثناء جلب بيانات العطل.");
  }
}

export { pluginConfig as config, handler };