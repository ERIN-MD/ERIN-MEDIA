import { downloadContentFromMessage } from 'maro';

const pluginConfig = {
  name: "عرض_ملف",
  alias: ["cat", "عرض_ملف"],
  category: "tools",
  description: "عرض محتوى الملف كنص",
  usage: ".عرض_ملف (رد على ملف)",
  example: ".عرض_ملف",
  isOwner: false,
  cooldown: 5,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const q = m.quoted;
  if (!q) return m.reply('📄 رد على ملف');

  if (!q.isMedia && !q.isDocument) return m.reply('❌ لم يتم التعرف على الملف');

  m.react('📄');

  try {
    const buffer = await q.download();
    const code = buffer.toString('utf8');
    
    if (!code) return m.reply('❌ الملف فارغ');
    if (code.length > 10000) return m.reply('❌ الملف كبير جداً');

    const fileName = q.fileName || 'file';
    await m.reply(`📄 *${fileName}*\n\n\`\`\`\n${code}\n\`\`\``);
    m.react('✅');

  } catch (e) {
    m.react('❌');
    m.reply(`❌ ${e.message}`);
  }
}

export { pluginConfig as config, handler };