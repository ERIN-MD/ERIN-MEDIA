// تعيين نوع الرد - أمر لتعيين شكل الردود

import { getAssetBuffer } from "../../src/lib/maro-asset-manager.js";
import fs from "fs";
import config from "../../config.js";
import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "تعيين_نوع_الرد",
  alias: ["setreply","شكل_مسج","شكل_المسج"],
  category: "owner",
  description: "تعيين شكل الردود",
  usage: ".تعيين_نوع_الرد <v1-v13>",
  example: ".تعيين_نوع_الرد v5",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

const VARIANTS = {
  v1: {
    id: 1,
    name: "أساسي",
    desc: "",
    emoji: "✨",
  },
  v2: {
    id: 2,
    name: "مميز",
    desc: "",
    emoji: "🖼️",
  },
  v3: {
    id: 3,
    name: "تيتانيوم",
    desc: "",
    emoji: "📨",
  },
  v4: {
    id: 4,
    name: "LV",
    desc: "",
    emoji: "💼",
  },
  v5: {
    id: 5,
    name: "طلب وهمي",
    desc: "نص مع رد وهمي لرسالة طلب",
    emoji: "🛒",
  },
  v6: {
    id: 6,
    name: "مستند بسيط",
    desc: "مثل V2 لكن بدون رد اتصال وهمي (رد أصلي)",
    emoji: "📄",
  },
  v7: {
    id: 7,
    name: "موقع وهمي",
    desc: "نص مع رد وهمي لرسالة موقع",
    emoji: "📍",
  },
  v8: {
    id: 8,
    name: "تفاعلي مع طلب",
    desc: "رسالة تفاعلية مدعومة بسياق طلب",
    emoji: "🧩",
  },
  v9: {
    id: 9,
    name: "طلب مباشر",
    desc: "رسالة طلب مباشرة مع النص",
    emoji: "📦",
  },
  v10: {
    id: 10,
    name: "طلب دفع",
    desc: "رسالة طلب دفع منسقة",
    emoji: "💳",
  },
  v11: {
    id: 11,
    name: "متحرك",
    desc: "رسالة تتبدل معاينتها بصورة متحركة",
    emoji: "🎞️",
  },
  v12: {
    id: 12,
    name: "أزرار تفاعلية",
    desc: "رسالة View Once بأزرار وإجراءات متعددة",
    emoji: "🔘",
  },
  v13: {
    id: 13,
    name: "معاينة محسنة",
    desc: "معاينة رابط محسنة بصورة مصغرة مرفوعة",
    emoji: "🔗",
  },
};

async function handler(m, { sock, db }) {
  const variant = m.text?.trim().toLowerCase();

  if (variant) {
    const selected = VARIANTS[variant];
    if (!selected) {
      await m.reply(`❌ *شكل غير صالح*\n\nاستخدم: *v1* إلى *v13*`);
      return;
    }

    db.setting("replyVariant", selected.id);
    await db.save();

    await m.reply(
      `✅ *تم تغيير نوع الرد*\n\n` +
      `${selected.emoji} *V${selected.id} — ${selected.name}*\n` +
      `_${selected.desc}_`,
    );
    return;
  }

  const current = db.setting("replyVariant") || config.ui?.replyVariant || 1;

  const rows = [];
  for (const [key, val] of Object.entries(VARIANTS)) {
    const mark = val.id === current ? " ✓" : "";
    rows.push({
      title: `${val.emoji} ${key.toUpperCase()}${mark} — ${val.name}`,
      description: val.desc,
      id: `${m.prefix}تعيين_نوع_الرد ${key}`,
    });
  }
  const buttons = [
    {
      name: "single_select",
      buttonParamsJson: JSON.stringify({
        title: "💬 اختر نوع الرد",
        sections: [{ title: "قائمة أنواع الردود", rows }],
      }),
    },
  ];

  const bodys =
    `💬📨 *نوع الرد*\n\n` +
    `ضبط شكل ردود البوت عند الرد على رسائل المستخدم 💬✨\n` +
    `النوع النشط حالياً: *V${current} — ${VARIANTS[`v${current}`]?.name || "غير معروف"}* 🎯\n\n`;

  await sock.sendButton(
    m.chat,
    getAssetBuffer("maro"),
    bodys,
    m,
    { buttons },
  );
}

export { pluginConfig as config, handler };