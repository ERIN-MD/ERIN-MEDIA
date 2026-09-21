import { fakeCardImage, loadCardAvatar } from "../../src/lib/maro-fake-card.js";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "مطور_وهمي",
  alias: ["fakedev"],
  category: "canvas",
  description: "إنشاء بطاقة مطور وهمية",
  usage: ".مطور_وهمي <اسم>",
  example: ".مطور_وهمي محمد",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 10, energi: 1, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎮 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const name = m.text?.trim();
  if (!name) {
    return m.reply(`🎮 *مطور وهمي*\n\n📌 مثال: \`${m.prefix}مطور_وهمي محمد\``);
  }

  m.react("⏳");

  try {
    const avatarBuffer = await loadCardAvatar(m, sock);
    await sock.sendMessage(m.chat, {
      image: await fakeCardImage({ title: "DEVELOPER", name, subtitle: "Tarboo Bot • تصميم ترفيهي", primary: "#24111f", secondary: "#ec4899", avatarBuffer }),
      caption: "بطاقة تجريبية غير رسمية",
    }, { quoted: m });
    m.react("✅");
  } catch (error) {
    m.react("❌");
    console.error("Fake Developer Error:", error);
  }
}

export { pluginConfig as config, handler };
