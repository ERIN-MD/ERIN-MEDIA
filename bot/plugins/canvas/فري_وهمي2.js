import { fakeCardImage } from "../../src/lib/maro-fake-card.js";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "فري_وهمي2",
  alias: ["fakeff2"],
  category: "canvas",
  description: "إنشاء صورة فري فاير وهمية V2",
  usage: ".فري_وهمي2 <اسم>",
  example: ".فري_وهمي2 محمد",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 10, energi: 1, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎮 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const nama = m.text;
  if (!nama) {
    return m.reply(`🎮 *فري وهمي 2*\n\n📌 مثال: \`${m.prefix}فري_وهمي2 محمد\``);
  }
  m.react("⏳");

  try {
    await sock.sendMessage(m.chat, {
      image: await fakeCardImage({ title: "FREE FIRE", name: nama, subtitle: "Tarboo Bot • تصميم ترفيهي", primary: "#0e2a47", secondary: "#f5a623" }),
      caption: "بطاقة تجريبية غير رسمية",
    }, { quoted: m });
    m.react("✅");
  } catch (error) {
    m.react("❌");
    console.error("Fake Free Fire Error:", error);
  }
}

export { pluginConfig as config, handler };
