import { fakeCardImage } from "../../src/lib/maro-fake-card.js";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "فري_ثنائي",
  alias: ["fakeffduo"],
  category: "canvas",
  description: "إنشاء صورة فري فاير ثنائية وهمية",
  usage: ".فري_ثنائي <اسم1>|<اسم2>",
  example: ".فري_ثنائي محمد|أحمد",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 10, energi: 1, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎮 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const nama = m.text?.split("|");
  if (!nama || nama.length < 2) {
    return m.reply(`🎮 *فري ثنائي*\n\n📌 مثال: \`${m.prefix}فري_ثنائي محمد|أحمد\``);
  }
  m.react("⏳");

  try {
    await sock.sendMessage(m.chat, {
      image: await fakeCardImage({ title: "FREE FIRE DUO", name: `${nama[0].trim()} × ${nama[1].trim()}`, subtitle: "Tarboo Bot • تصميم ترفيهي", primary: "#32230c", secondary: "#f6c343" }),
      caption: "بطاقة تجريبية غير رسمية",
    }, { quoted: m });
    m.react("✅");
  } catch (error) {
    m.react("❌");
    console.error("Fake Free Fire Duo Error:", error);
  }
}

export { pluginConfig as config, handler };
