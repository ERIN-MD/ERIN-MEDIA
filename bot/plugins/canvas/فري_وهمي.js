import te from "../../src/lib/maro-error.js";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "فري_وهمي",
  alias: ["fakeff"],
  category: "canvas",
  description: "إنشاء صورة لوبي فري فاير وهمية",
  usage: ".فري_وهمي <اسم>",
  example: ".فري_وهمي محمد",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 10, energi: 1, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎮 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const nama = m.text;
  if (!nama) {
    return m.reply(`🎮 *فري وهمي*\n\n📌 مثال: \`${m.prefix}فري_وهمي محمد\``);
  }
  m.react("⏳");

  try {
    await sock.sendMedia(
      m.chat,
      `https://api.nexray.web.id/maker/fakelobyff?nickname=${encodeURIComponent(nama)}`,
      null, m, { type: "image" }
    );
    m.react("✅");
  } catch (error) {
    m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };