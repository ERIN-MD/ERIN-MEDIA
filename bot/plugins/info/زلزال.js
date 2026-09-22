import axios from "axios";
import { saluranCtx } from "../../src/lib/maro-context.js";

const pluginConfig = {
  name: "زلزال",
  alias: ["gempa"],
  category: "info",
  description: "معلومات الزلازل الأخيرة من BMKG",
  usage: ".زلزال",
  example: ".زلزال",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  await m.react("🕕");

  try {
    const response = await axios.get(
      "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json",
      { timeout: 15000 },
    );

    const g = response.data.Infogempa.gempa;
    const shakemapUrl = g.Shakemap
      ? `https://data.bmkg.go.id/DataMKG/TEWS/${g.Shakemap}`
      : null;

    const text =
      `🌍 *معلومات الزلزال - BMKG*\n\n` +
      `> 📅 التاريخ: *${g.Tanggal}*\n` +
      `> 🕐 الوقت: *${g.Jam}*\n` +
      `> 📐 الإحداثيات: *${g.Coordinates}*\n` +
      `> 📍 خط العرض: *${g.Lintang}*\n` +
      `> 📍 خط الطول: *${g.Bujur}*\n` +
      `> 💥 الشدة: *${g.Magnitude}*\n` +
      `> 🔽 العمق: *${g.Kedalaman}*\n` +
      `> 🗺️ المنطقة: *${g.Wilayah}*\n` +
      `> ⚠️ الاحتمال: *${g.Potensi}*\n` +
      `> 🏠 الشعور به: *${g.Dirasakan}*\n\n` +
      `_المصدر: BMKG إندونيسيا_`;

    await m.react("✅");

    if (shakemapUrl) {
      try {
        const imgRes = await axios.get(shakemapUrl, { responseType: "arraybuffer", timeout: 15000 });
        await sock.sendMedia(m.chat, Buffer.from(imgRes.data), text, m, { type: "image" });
      } catch {
        await m.reply(text, { contextInfo: saluranCtx() });
      }
    } else {
      await m.reply(text, { contextInfo: saluranCtx() });
    }
  } catch (e) {
    await m.react("☢");
    await m.reply(`❌ *فشل جلب بيانات الزلزال*\n\n> ${e.message || "حاول لاحقاً"}`);
  }
}

export { pluginConfig as config, handler };