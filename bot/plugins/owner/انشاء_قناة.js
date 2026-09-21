const pluginConfig = {
  name: ["انشاء_قناة", "buatsaluran"],
  alias: [],
  category: "owner",
  description: "إنشاء قناة جديدة",
  usage: ".انشاء_قناة <الاسم>|<الوصف>",
  example: ".انشاء_قناة معلومات البوت|آخر تحديثات البوت",
  isOwner: true,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const text = m.text?.trim() || "";
  const pipeIdx = text.indexOf("|");

  let name, description;
  if (pipeIdx === -1) {
    name = text;
    description = "";
  } else {
    name = text.substring(0, pipeIdx).trim();
    description = text.substring(pipeIdx + 1).trim();
  }

  if (!name || name.length < 2) {
    return m.reply(
      "📢 *إنشاء قناة*\n\n" +
        "> `.انشاء_قناة اسم القناة`\n" +
        "> `.انشاء_قناة الاسم|الوصف`\n\n" +
        "📝 مثال:\n" +
        "> `.انشاء_قناة معلومات البوت`\n" +
        "> `.انشاء_قناة معلومات البوت|آخر تحديثات البوت`",
    );
  }

  try {
    const result = await sock.newsletterCreate(name, description || undefined);
    const saluranId = result?.id || result?.thread_metadata?.id || "غير معروف";
    const saluranName = result?.name || name;
    await m.react("✅");
    return m.reply(
      `📢 *تم إنشاء القناة*\n\n` +
        `> الاسم: ${saluranName}\n` +
        (description ? `> الوصف: ${description}\n` : "") +
        `> المعرف: ${saluranId}\n` +
        `> المشتركين: ${result?.subscribers || 0}\n\n` +
        `_يمكن تكوين هذه القناة في config.saluran.id_`,
    );
  } catch (err) {
    return m.reply(`❌ فشل في إنشاء القناة: ${err.message}`);
  }
}

export { pluginConfig as config, handler };