// تجاوز - أمر لتجاوز الروابط المختصرة / Skiplink باستخدام izen

import fetch from "node-fetch";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "تجاوز",
  alias: ["izen"],
  category: "tools",
  description: "تجاوز الروابط المختصرة / Skiplink باستخدام izen",
  usage: ".تجاوز الرابط",
  example: ".تجاوز https://sfl.gl/xxxxx",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { args, sock }) {
  if (!args[0]) {
    let txt = `🔗 *تجاوز الروابط المختصرة* 🔗\n\n`;
    txt += `هل لديك رابط تحتاج إلى تجاوز الإعلانات؟ سأساعدك في الوصول إلى الهدف النهائي مباشرة!\n\n`;
    txt += `*طريقة الاستخدام:*\n`;
    txt += `👉 \`${m.prefix}تجاوز <الرابط>\`\n\n`;
    txt += `*مثال:*\n`;
    txt += `👉 \`${m.prefix}تجاوز https://sfl.gl/xxxxx\``;
    return m.reply(txt);
  }

  await m.react("⏳");
  
  try {
    const res = await fetch(`https://anabot.my.id/api/tools/izenLOL?url=${encodeURIComponent(args[0])}&apikey=freeApikey`);
    const json = await res.json();
    
    if (!json.data?.result?.result) {
       return m.reply("❌ فشل تجاوز الرابط! جرب رابطاً آخر.");
    }
    
    let txt = `✅ *تم تجاوز الرابط بنجاح!* ✅\n\n`;
    txt += `*الرابط الأصلي:* \n`;
    txt += `🔗 ${args[0]}\n\n`;
    txt += `*النتيجة بعد التجاوز:* \n`;
    txt += `🚀 ${json.data.result.result}\n\n`;
    txt += `أتمنى أن يكون مفيداً! ✨`;
    
    await m.reply(txt);
    await m.react("✅");
  } catch (e) {
    m.reply(`❌ حدث خطأ في النظام! 😭\nالخطأ: ${e.message}`);
  }
}

export { pluginConfig as config, handler };