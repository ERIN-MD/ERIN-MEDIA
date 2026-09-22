import config from "../../config.js";

const pluginConfig = {
  name: "شكل_المنيو",
  alias: ["setmenu", "menuvariant", "شكل"],
  category: "owner",
  description: "تعيين شكل عرض القائمة",
  usage: ".شكل_المنيو <v1-v2>",
  example: ".شكل_المنيو v2",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

const VARIANTS = {
  v1: { id: 1, name: "مارو العربي", emoji: "⚡", desc: "القائمة الكلاسيكية مع أزرار type:1" },
  v2: { id: 2, name: "المتطور", emoji: "🚀", desc: "nativeFlow + أيقونات + صوت + رد مزيف" },
};

async function handler(m, { sock, db }) {
  const args = m.args || [];
  const variant = args[0]?.toLowerCase();

  // عرض الشكل الحالي
  if (!variant) {
    const currentMenu = db.setting("menuVariant") || config.ui?.menuVariant || 1;
    const currentName = VARIANTS[`v${currentMenu}`]?.name || "غير معروف";
    
    let text = `📋 *شكل المنيو الحالي*\n\n`;
    text += `🔹 *V${currentMenu} — ${currentName}*\n\n`;
    text += `*الأشكال المتاحة:*\n`;
    
    for (const [key, val] of Object.entries(VARIANTS)) {
      const mark = val.id === currentMenu ? " ✅" : "";
      text += `• ${val.emoji} *${key.toUpperCase()}* — ${val.name}${mark}\n`;
      text += `  ↳ ${val.desc}\n`;
    }
    
    text += `\nلتغيير الشكل: *${m.prefix}شكل_المنيو <v1-v2>*`;
    await m.reply(text);
    return;
  }

  // تغيير الشكل
  const selected = VARIANTS[variant];
  if (!selected) {
    await m.reply(`❌ *شكل غير صالح*\n\nالأشكال المتاحة: *v1*, *v2*`);
    return;
  }

  db.setting("menuVariant", selected.id);
  await db.save();

  await m.reply(
    `✅ *تم تغيير شكل المنيو*\n\n` +
    `${selected.emoji} *V${selected.id} — ${selected.name}*\n` +
    `↳ ${selected.desc}\n\n` +
    `> استخدم *.menu* للمشاهدة`
  );
}

export { pluginConfig as config, handler };