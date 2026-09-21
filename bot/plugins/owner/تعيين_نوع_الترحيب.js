// تعيين نوع الترحيب - أمر لتعيين شكل رسالة الترحيب عند دخول العضو الجديد

import { getAssetBuffer } from "../../src/lib/maro-asset-manager.js";
import fs from "fs";
import config from "../../config.js";
import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "تعيين_نوع_الترحيب",
  alias: ["setwelcometype"],
  category: "owner",
  description: "تعيين شكل رسالة الترحيب عند دخول العضو الجديد",
  usage: ".تعيين_نوع_الترحيب",
  example: ".تعيين_نوع_الترحيب",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

const VARIANTS = {
  1: {
    name: "صورة مرسومة",
    desc: "صورة مرسومة مع صورة الملف الشخصي",
    emoji: "🎨",
  },
  2: {
    name: "بطاقات دوارة",
    desc: "بطاقات دوارة تفاعلية مع أزرار",
    emoji: "🃏",
  },
  3: {
    name: "نص فقط",
    desc: "رسالة نصية بسيطة بدون صور",
    emoji: "📝",
  },
  4: {
    name: "المجموعة",
    desc: "نمط ContextInfo للمجموعة",
    emoji: "👥",
  },
  5: {
    name: "بسيط",
    desc: "رسالة نصية بسيطة + صورة الملف الشخصي",
    emoji: "✨",
  },
  6: {
    name: "فيديو",
    desc: "إرسال فيديو ترحيب",
    emoji: "🎥",
  },
  7: {
    name: "رد تفاعلي",
    desc: "رسالة تفاعلية مع رد وهمي",
    emoji: "💬",
  },
};

async function handler(m, { sock, db }) {
  const args = m.args || [];
  const variant = args[0]?.toLowerCase();
  const current = db.setting("welcomeType") || 1;

  // تغيير النوع
  if (variant && /^v?[1-7]$/.test(variant)) {
    const id = parseInt(variant.replace("v", ""));
    db.setting("welcomeType", id);
    await db.save();
    await m.reply(
      `✅ *تم تغيير نوع الترحيب*\n\n` +
        `${VARIANTS[id].emoji} *V${id} — ${VARIANTS[id].name}*\n` +
        `_${VARIANTS[id].desc}_`,
    );
    return;
  }

  // عرض القائمة
  const rows = [];
  for (const [id, val] of Object.entries(VARIANTS)) {
    const mark = parseInt(id) === current ? " ✓" : "";
    rows.push({
      title: `${val.emoji} V${id}${mark} — ${val.name}`,
      description: val.desc,
      id: `${m.prefix}تعيين_نوع_الترحيب v${id}`,
    });
  }

  const buttons = [
    {
      name: "single_select",
      buttonParamsJson: JSON.stringify({
        title: "👋 اختر نوع الترحيب",
        sections: [{ title: "قائمة أنواع الترحيب", rows }],
      }),
    },
  ];

  const bodyText =
    `👋🎨 *نوع الترحيب*\n\n` +
    `ضبط شكل رسالة الترحيب عند دخول عضو جديد إلى المجموعة 🚪✨\n` +
    `النوع النشط حالياً: *V${current} — ${VARIANTS[current].name}* 🎯\n\n` +
    `*شرح الأنواع:*\n\n` +
    `- *V1 صورة مرسومة* 🎨 — يقوم البوت برسم صورة تلقائياً تحتوي على صورة الملف الشخصي واسم العضو الجديد، ثم إرسالها كصورة\n\n` +
    `- *V2 بطاقات دوارة* 🃏 — عرض بطاقات دوارة تفاعلية يمكن تمريرها مع أزرار إجراء، مناسبة للمجموعات التي تريد شكلاً عصرياً\n\n` +
    `- *V3 نص فقط* 📝 — رسالة نصية عادية بدون صور، خفيفة وبسيطة\n\n` +
    `- *V4 المجموعة* 👥 — استخدام ContextInfo بأسلوب إعادة توجيه المجموعة، شكل مرتب مع تسمية النشرة الإخبارية\n\n` +
    `- *V5 بسيط* ✨ — رسالة نصية بسيطة مع صورة الملف الشخصي للعضو الجديد، غير ملفتة ولكنها مفيدة\n\n` +
    `- *V6 فيديو* 🎥 — إرسال فيديو ترحيب جذاب مع نص ترحيبي للعضو\n\n` +
    `- *V7 رد تفاعلي* 💬 — إرسال رسالة تفاعلية مع رد وهمي من الشخص المنضم\n\n` +
    `> اختر نوع الترحيب من الأزرار أدناه 👇`;

  await sock.sendButton(
    m.chat,
    getAssetBuffer("maro"),
    bodyText,
    m,
    { buttons },
  );
}

export { pluginConfig as config, handler };