// تجسس_جينشين - أمر لعرض معلومات حساب جينشين إمباكت عبر المعرف

import axios from "axios";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "تجسس_جينشين",
  alias: ["genshinstalk"],
  category: "stalker",
  description: "عرض معلومات حساب جينشين إمباكت عبر المعرف",
  usage: ".تجسس_جينشين <المعرف>",
  example: ".تجسس_جينشين 856012067",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const uid = m.text?.trim() || m.args[0];

  if (!uid) {
    return m.reply("❌ *أين معرف جينشين؟*\n\nيجب عليك إدخال معرف لاعب جينشين إمباكت الذي تريد التجسس عليه.\n\nمثال: `.تجسس_جينشين 856012067`");
  }

  await m.react("🕕");

  try {
    const res = await axios.get(`https://api.nexray.eu.cc/stalker/genshin?id=${uid}`, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });
    
    const data = res.data;

    if (!data.status || !data.result) {
      await m.react("❌");
      return m.reply(`⚠️ *فشل البحث!*\n\nالمعرف *${uid}* غير موجود أو الملف الشخصي خاص. تأكد من صحة المعرف.`);
    }

    const r = data.result.player_info;
    const imageUrl = data.result.image_url;
    
    let caption = `🌟 *تجسس جينشين إمباكت* 🌟\n\n`;
    caption += `مرحباً أيها المسافر! هذه معلومات الحساب للمعرف *${data.result.id}*:\n\n`;
    
    caption += `👤 *معلومات اللاعب*\n`;
    caption += `  - الاسم المستعار: *${r.nickname || "-"}*\n`;
    caption += `  - مستوى المغامرة (AR): ${r.level || "-"}\n`;
    caption += `  - مستوى العالم (WL): ${r.world_level || "-"}\n`;
    caption += `  - التوقيع: ${r.signature || "-"}\n\n`;
    
    caption += `🏆 *الإنجازات*\n`;
    caption += `  - إجمالي الإنجازات: ${r.achievements || "-"}\n`;
    caption += `  - الهاوية الحلزونية: ${r.spiral_abyss || "لا توجد بيانات"}\n`;
    if (r.theater) caption += `  - مسرح الخيال: ${r.theater}\n`;
    if (r.stygian_onslaught) caption += `  - هجوم ستيجيان: ${r.stygian_onslaught}\n`;
    caption += `\n`;
    
    caption += `شارك هذا الملف الشخصي مع أصدقائك! 🚀`;

    if (imageUrl) {
      await sock.sendMessage(m.chat, {
        image: { url: imageUrl },
        caption: caption
      }, { quoted: m });
    } else {
      await m.reply(caption);
    }

    await m.react("✅");

  } catch (error) {
    console.error("[Genshin Stalk]", error.message);
    await m.react("☢");
    m.reply("😔 *حدث خطأ في النظام.* \n\nفشل النظام في جلب البيانات من خادم جينشين إمباكت. حاول مرة أخرى لاحقاً.");
  }
}

export { pluginConfig as config, handler };