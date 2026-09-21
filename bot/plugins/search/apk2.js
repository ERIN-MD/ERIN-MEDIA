import axios from "axios";
import config from "../../config.js";
import te from "../../src/lib/maro-error.js";

const NEOXR_APIKEY = config.APIkey?.neoxr || "Milik-Bot-MaroMD";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "apk2",
  alias: ["an1get"],
  category: "search",
  description: "تحميل APK من Android1",
  usage: ".apk2 <رابط>",
  example: ".apk2 https://an1.com/xxx",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 15, energi: 1, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎯 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const url = m.text?.trim();

  if (!url || !url.includes("an1.com")) {
    return m.reply(`❌ رابط غير صالح! يجب أن يكون من an1.com`);
  }

  m.react("⏳");

  try {
    const { data } = await axios.get(
      `https://api.neoxr.eu/api/an1-get?url=${encodeURIComponent(url)}&apikey=${NEOXR_APIKEY}`,
      { timeout: 60000 }
    );

    if (!data?.status || !data?.data) {
      throw new Error("فشل جلب تفاصيل APK");
    }

    const app = data.data;

    if (app.url) {
      await sock.sendMessage(m.chat, {
        document: { url: app.url },
        fileName: app.name,
        mimetype: "application/vnd.android.package-archive",
        contextInfo: { forwardingScore: 99, isForwarded: true },
      }, { quoted: m });
      m.react("✅");
    } else {
      await sock.sendMessage(m.chat, {
        text: "> ⚠️ رابط التحميل غير متوفر",
        interactiveButtons: [{
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "🌐 فتح في المتصفح",
            url: url,
          }),
        }],
      }, { quoted: m });
      m.react("⚠️");
    }
  } catch (err) {
    console.log(err);
    m.react("❌");
    return m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };