// تجسس_بنترست - أمر لعرض معلومات حساب Pinterest بالكامل عبر اسم المستخدم

import axios from "axios";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "تجسس_بنترست",
  alias: ["pintereststalk"],
  category: "stalker",
  description: "عرض معلومات حساب Pinterest بالكامل عبر اسم المستخدم",
  usage: ".تجسس_بنترست <اسم_المستخدم>",
  example: ".تجسس_بنترست dims",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const username = m.text?.trim() || m.args[0];

  if (!username) {
    return m.reply("❌ *لم تدخل اسم مستخدم Pinterest!*\n\nيجب عليك إدخال اسم المستخدم في Pinterest الذي تريد التجسس عليه.\n\nمثال: `.تجسس_بنترست dims`");
  }

  await m.react("🕕");

  try {
    const res = await axios.get(`https://api.nexray.eu.cc/stalker/pinterest?username=${encodeURIComponent(username)}`, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });
    
    const data = res.data;

    if (!data.status || !data.result) {
      await m.react("❌");
      return m.reply(`⚠️ *فشل البحث!*\n\nاسم المستخدم *${username}* غير موجود في Pinterest. تأكد من صحة الاسم.`);
    }

    const r = data.result;
    
    let caption = `📌 *تجسس بنترست - معلومات الملف الشخصي* 📌\n\n`;
    caption += `نتائج البحث لاسم المستخدم *@${r.username}*:\n\n`;
    
    caption += `╭─〔 👤 *معلومات الملف الشخصي* 〕─⬣\n`;
    caption += `│ ✦ الاسم الكامل: *${r.full_name || "-"}*\n`;
    caption += `│ ✦ اسم المستخدم: @${r.username}\n`;
    caption += `│ ✦ السيرة الذاتية: ${r.bio || "-"}\n`;
    caption += `│ ✦ نوع الحساب: ${r.account_type || "-"}\n`;
    caption += `│ ✦ تاريخ الإنشاء: ${r.created_at || "-"}\n`;
    caption += `╰────────────────⬣\n\n`;
    
    caption += `╭─〔 📊 *الإحصائيات* 〕─⬣\n`;
    caption += `│ ✦ المتابعون: *${r.stats?.followers || 0}*\n`;
    caption += `│ ✦ المتابَعون: *${r.stats?.following || 0}*\n`;
    caption += `│ ✦ إجمالي الدبابيس: *${r.stats?.pins || 0}*\n`;
    caption += `│ ✦ إجمالي اللوحات: *${r.stats?.boards || 0}*\n`;
    caption += `╰────────────────⬣\n\n`;
    
    caption += `🔗 *رابط الملف الشخصي:*\n${r.profile_url}\n\n`;
    caption += `شارك هذا الملف الشخصي مع أصدقائك! 🚀`;

    const imageUrl = r.image?.original || r.image?.large || r.image?.medium || r.image?.small;

    if (imageUrl) {
      // إرسال مع بطاقة Meta
      await sock.sendMessage(m.chat, {
        image: { url: imageUrl },
        caption: caption,
        contextInfo: {
          externalAdReply: {
            title: `📌 ${r.full_name || r.username}`,
            body: `@${r.username} • ${r.stats?.followers || 0} متابع`,
            thumbnailUrl: imageUrl,
            sourceUrl: r.profile_url,
            mediaType: 1,
            renderLargerThumbnail: true,
            showAdAttribution: true
          }
        }
      }, { quoted: m });
    } else {
      await m.reply(caption);
    }

    await m.react("✅");

  } catch (error) {
    console.error("[Pinterest Stalk]", error.message);
    await m.react("☢");
    m.reply("😔 *حدث خطأ في النظام.* \n\nفشل النظام في جلب البيانات من خادم Pinterest. حاول مرة أخرى لاحقاً.");
  }
}

export { pluginConfig as config, handler };