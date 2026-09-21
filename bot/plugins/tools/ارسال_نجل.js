import te from "../../src/lib/maro-error.js";
import maroApi from "../../src/lib/maro-apimanager.js";

const pluginConfig = {
  name: "ارسال_نجل",
  alias: [],
  category: "tools",
  description: "إرسال رسالة عبر NGL",
  usage: ".ارسال_نجل <رابط> | <نص>",
  example: ".ارسال_نجل https://ngl.link/xxxx | مرحباً",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const text = m.text?.split("|");
  const [link, kata] = text;
  if (!link)
    return m.reply(
      `*أين رابط NGL؟*\nمثال: \`${m?.prefix}ارسال_نجل https://ngl.link/xxxx | مرحباً\``,
    );
  if (!kata)
    return m.reply(
      `*أين النص؟*\n\nمثال: \`${m?.prefix}ارسال_نجل https://ngl.link/xxxx | مرحباً\``,
    );
  m.react("🎴");

  try {
    await maroApi.cuki.sendNgl(
      {
        link,
        text: kata,
      },
      {
        timeout: 30000,
      },
    );

    m.react("✅");

    await sock.sendMessage(
      m.chat,
      {
        text: `✅ *تم*\n\nتم إرسال الرسالة بنجاح!\nالهدف: ${link}\nالرسالة: ${kata}`,
      },
      { quoted: m },
    );
  } catch (error) {
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };