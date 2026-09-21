import axios from "axios";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "شات_وهمي",
  alias: ["iqc"],
  category: "canvas",
  description: "إنشاء صورة شات iPhone وهمية",
  usage: ".شات_وهمي <نص>",
  example: ".شات_وهمي مرحبا",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 10, energi: 1, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 📱 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const text = m.args.join(" ");
  if (!text) {
    return m.reply(`📱 *شات وهمي*\n\n📌 مثال: \`${m.prefix}شات_وهمي مرحبا\``);
  }

  m.react("⏳");

  try {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const apiUrl = `https://api.nexray.eu.cc/maker/v1/iqc?text=${encodeURIComponent(text)}&provider=VODAFONE&jam=${encodeURIComponent(time)}&baterai=100`;

    const res = await axios.get(apiUrl, { responseType: "arraybuffer", timeout: 30000 });

    const cardBuffer = Buffer.from(res.data);

    m.react("✅");
    await sock.sendMessage(m.chat, { image: cardBuffer, caption: "" }, { quoted: m });
  } catch (error) {
    console.error("[IQC]", error.message);
    m.react("❌");
    m.reply("😔 فشل إنشاء الصورة.");
  }
}

export { pluginConfig as config, handler };