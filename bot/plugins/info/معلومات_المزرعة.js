import axios from "axios";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "معلومات_المزرعة",
  alias: ["gag"],
  category: "info",
  description: "عرض معلومات مخزون لعبة Grow a Garden",
  usage: ".معلومات_المزرعة",
  example: ".معلومات_المزرعة",
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
    const res = await axios.get("https://api.nexray.eu.cc/information/growagarden", {
      timeout: 30000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const data = res.data;
    if (!data.status || !data.result) {
      await m.react("❌");
      return m.reply("⚠️ فشل جلب معلومات المزرعة حالياً.");
    }

    const r = data.result;

    const formatStock = (arr, title) => {
      if (!arr || arr.length === 0) return "";
      let txt = `*${title}*\n`;
      arr.forEach(item => { txt += `- ${item.name}: ${item.value}\n`; });
      return txt + "\n";
    };

    let caption = `🌱 *معلومات المزرعة* 🌱\n\n`;

    caption += formatStock(r.gearStock, "⚙️ المعدات");
    caption += formatStock(r.eggStock, "🥚 البيض");
    caption += formatStock(r.eventStock, "🎟️ الأحداث");
    caption += formatStock(r.cosmeticsStock, "👕 الملابس");
    caption += formatStock(r.seedsStock, "🌾 البذور");
    caption += formatStock(r.merchantsStock, "🏪 التجار");

    if (r.lastSeen && r.lastSeen.length > 0) {
      caption += `*👀 آخر ظهور*\n`;
      r.lastSeen.slice(0, 5).forEach(item => {
        caption += `- ${item.name}: ${item.seen}\n`;
      });
    }

    await m.reply(caption.trim());
    await m.react("✅");

  } catch (error) {
    console.error("[GAG]", error.message);
    await m.react("☢");
    m.reply("😔 حدث خطأ أثناء جلب بيانات المزرعة.");
  }
}

export { pluginConfig as config, handler };