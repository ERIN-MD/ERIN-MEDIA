import axios from "axios";
import te from "../../src/lib/maro-error.js";
import { sendToolsPreview } from "../../src/lib/maro-context.js";

const pluginConfig = {
  name: "نشر_النص",
  alias: ["pb"],
  category: "tools",
  description: "رفع النص إلى Pastebin",
  usage: ".نشر_النص <نص>",
  example: '.نشر_النص console.log("مرحبا بالعالم")',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  let text = m.args.join(" ");

  if (m.quoted?.text) {
    text = m.quoted.text;
  }

  if (!text) {
    return m.reply(
      `📋 *رفع النص إلى Pastebin*\n\n` +
        `أرسل نصاً لرفعه إلى Pastebin.\n\n` +
        `*طريقة الاستخدام:*\n` +
        `• \`${m.prefix}نشر_النص <نص>\`\n` +
        `• رد على نص مع \`${m.prefix}نشر_النص\`\n\n` +
        `> مثال: \`${m.prefix}نشر_النص console.log("مرحبا")\``,
    );
  }

  const api_dev_key = "h9WMT2Mn9QW-qDhvUSc-KObqAYcjI0he";
  const api_paste_code = text.trim();
  const api_paste_name = `نص من ${m.pushName || "مستخدم"} - ${new Date().toLocaleDateString("ar-SA")}`;

  const data = new URLSearchParams({
    api_dev_key,
    api_option: "paste",
    api_paste_code,
    api_paste_name,
    api_paste_private: "1",
  });

  try {
    const res = await axios.post(
      "https://pastebin.com/api/api_post.php",
      data.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 15000,
      },
    );

    const url = res.data;

    if (url.startsWith("Bad API request")) {
      return m.reply(`❌ *فشل*\n\n> ${url}`);
    }

    const responseText =
      `✅ *تم النشر في Pastebin بنجاح*\n\n` +
      `╭┈┈⬡「 📋 *التفاصيل* 」\n` +
      `┃ 📝 العنوان: *${api_paste_name}*\n` +
      `┃ 📊 الحجم: *${text.length} حرف*\n` +
      `┃ 🔗 الرابط: ${url}\n` +
      `╰┈┈⬡\n\n` +
      `> ستنتهي صلاحية النص حسب إعدادات Pastebin.`;
      
    await sendToolsPreview(
      sock,
      m.chat,
      responseText,
      "رفع إلى Pastebin",
      api_paste_name,
      { quoted: m },
    );
  } catch (e) {
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };