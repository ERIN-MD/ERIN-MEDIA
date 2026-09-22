import { fakeCardImage, loadCardAvatar } from "../../src/lib/maro-fake-card.js";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "مطور_وهمي2",
  alias: ["fakedev2"],
  category: "canvas",
  description: "إنشاء بطاقة مطور وهمية V2",
  usage: ".مطور_وهمي2 <اسم>",
  example: ".مطور_وهمي2 محمد",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 10, energi: 1, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎮 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const name = m.text?.trim();
  if (!name) {
    return m.reply(`🎮 *مطور وهمي 2*\n\n📌 مثال: \`${m.prefix}مطور_وهمي2 محمد\``);
  }

  m.react("⏳");

  try {
    const avatarBuffer = await loadCardAvatar(m, sock);
    await sock.sendMessage(m.chat, {
      image: await fakeCardImage({ title: "DEVELOPER V2", name, subtitle: "Tarboo Bot • تصميم ترفيهي", primary: "#10251f", secondary: "#4ade80", avatarBuffer }),
      caption: "بطاقة تجريبية غير رسمية",
    }, { quoted: m });
    m.react("✅");
  } catch (error) {
    m.react("❌");
    console.error("Fake Developer V2 Error:", error);
  }
}

export { pluginConfig as config, handler };
