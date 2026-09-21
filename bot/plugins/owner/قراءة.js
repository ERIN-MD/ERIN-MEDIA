const pluginConfig = {
  name: ["قراءة", "baca"],
  alias: [],
  category: "owner",
  description: "تحديد الرسالة كمقروءة",
  usage: ".قراءة",
  example: ".قراءة",
  isOwner: true,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  try {
    await sock.readMessages([m.key]);
    await m.react("✅");
    return m.reply("📖 *تم تحديد الرسالة كمقروءة*");
  } catch (err) {
    return m.reply(`❌ فشل: ${err.message}`);
  }
}

export { pluginConfig as config, handler };