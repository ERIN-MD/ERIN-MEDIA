import { fakeCardImage, loadCardAvatar } from "../../src/lib/maro-fake-card.js";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "مطور_وهمي3",
  alias: ["fakedev3"],
  category: "canvas",
  description: "إنشاء بطاقة مطور وهمية V3",
  usage: ".مطور_وهمي3 <اسم>",
  example: ".مطور_وهمي3 محمد",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 10, energi: 1, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎮 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const name = m.text?.trim();
  if (!name) {
    return m.reply(`🎮 *مطور وهمي 3*\n\n📌 مثال: \`${m.prefix}مطور_وهمي3 محمد\``);
  }

  m.react("⏳");

  try {
    const avatarBuffer = await loadCardAvatar(m, sock);
    await sock.sendMessage(m.chat, {
      image: await fakeCardImage({ title: "DEVELOPER V3", name, subtitle: "Tarboo Bot • تصميم ترفيهي", primary: "#16203c", secondary: "#60a5fa", avatarBuffer }),
      caption: "بطاقة تجريبية غير رسمية",
    }, { quoted: m });
    m.react("✅");
  } catch (error) {
    m.react("❌");
    console.error("Fake Developer V3 Error:", error);
  }
}

export { pluginConfig as config, handler };
