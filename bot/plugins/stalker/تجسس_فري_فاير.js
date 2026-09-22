// تجسس_فري_فاير - أمر لعرض معلومات حساب فري فاير بالكامل عبر المعرف

import axios from "axios";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "تجسس_فري_فاير",
  alias: ["ffstalk"],
  category: "stalker",
  description: "عرض معلومات حساب فري فاير بالكامل عبر المعرف",
  usage: ".تجسس_فري_فاير <المعرف>",
  example: ".تجسس_فري_فاير 470699855",
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
    return m.reply("❌ *لم تدخل معرف فري فاير!*\n\nاكتب معرف اللاعب الذي تريد التجسس عليه.\n\nمثال: `.تجسس_فري_فاير 470699855`");
  }

  await m.react("🕕");

  try {
    const res = await axios.get(`https://api.nexray.eu.cc/stalker/freefire?uid=${uid}`, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });
    
    const data = res.data;

    if (!data.status || !data.result) {
      await m.react("❌");
      return m.reply(`⚠️ *فشل البحث!*\n\nالمعرف *${uid}* غير موجود أو هناك مشكلة في الخادم. تأكد من صحة المعرف.`);
    }

    const r = data.result;
    
    let caption = `🔥 *تجسس فري فاير - معلومات الملف الشخصي* 🔥\n\n`;
    caption += `نتائج البحث للمعرف *${r.uid}*:\n\n`;
    
    caption += `👤 *المعلومات الأساسية*\n`;
    caption += `  - الاسم: *${r.name || "-"}*\n`;
    caption += `  - المستوى: ${r.level || "-"} (الخبرة: ${r.exp || "-"})\n`;
    caption += `  - المنطقة: ${r.region || "-"}\n`;
    caption += `  - الإعجابات: ${r.likes || "-"} ❤️\n`;
    caption += `  - نقاط الائتمان: ${r.credit_score || "-"}\n`;
    caption += `  - السيرة الذاتية: ${r.signature || "-"}\n\n`;
    
    caption += `🏆 *الترتيب والنشاط*\n`;
    caption += `  - نقاط الترتيب BR: ${r.br_rank_point || "-"} (الأعلى: ${r.br_max_rank || "-"})\n`;
    caption += `  - نقاط الترتيب CS: ${r.cs_rank_point || "-"} (الأعلى: ${r.cs_max_rank || "-"})\n`;
    caption += `  - معرف الموسم: ${r.season_id || "-"}\n`;
    caption += `  - تاريخ الإنشاء: ${r.created_at || "-"}\n`;
    caption += `  - آخر تسجيل دخول: ${r.last_login || "-"}\n\n`;
    
    caption += `🛡️ *معلومات النقابة*\n`;
    caption += `  - اسم النقابة: ${r.guild_name && r.guild_name !== "None" ? r.guild_name : "لا توجد نقابة"}\n`;
    if (r.guild_name && r.guild_name !== "None") {
      caption += `  - مستوى النقابة: ${r.guild_level || "-"}\n`;
      caption += `  - الأعضاء: ${r.guild_member || "-"}/${r.guild_capacity || "-"}\n`;
      caption += `  - قائد النقابة: ${r.guild_leader_name || "-"} (المعرف: ${r.guild_leader_uid || "-"})\n`;
    }
    caption += `\n`;
    
    caption += `🐾 *معلومات الحيوان الأليف*\n`;
    caption += `  - مستوى الحيوان: ${r.pet_level || "-"}\n`;
    caption += `  - خبرة الحيوان: ${r.pet_exp || "-"}\n\n`;
    
    caption += `🔧 *أخرى*\n`;
    caption += `  - اللغة: ${r.language ? r.language.replace("Language_", "") : "-"}\n`;
    caption += `  - الوضع المفضل: ${r.mode_prefer ? r.mode_prefer.replace("ModePrefer_", "") : "-"}\n\n`;

    caption += `شارك هذا الملف الشخصي مع أصدقائك! 🚀`;

    const isValidUrl = r.banner_image && (r.banner_image.startsWith("http://") || r.banner_image.startsWith("https://"));

    if (isValidUrl) {
      await sock.sendMessage(m.chat, {
        image: { url: r.banner_image },
        caption: caption
      }, { quoted: m });
    } else {
      await m.reply(caption);
    }

    await m.react("✅");

  } catch (error) {
    console.error("[FFStalk]", error.message);
    await m.react("☢");
    m.reply("😔 *حدث خطأ في النظام.* \n\nفشل النظام في جلب البيانات من خادم فري فاير. حاول مرة أخرى لاحقاً.");
  }
}

export { pluginConfig as config, handler };