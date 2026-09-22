import crypto from 'crypto';

const pluginConfig = {
  name: "تجزئة",
  alias: ["hash", "تجزئة", "تشفير"],
  category: "tools",
  description: "توليد تجزئة النصوص",
  usage: ".تجزئة <الخوارزمية> <النص>",
  example: ".تجزئة md5 helloworld\n.تجزئة sha256 password123",
  isOwner: false,
  cooldown: 3,
  isEnabled: true,
};

const ALGORITHMS = ['md5', 'sha1', 'sha256', 'sha512', 'sha3-256', 'sha3-512', 'ripemd160', 'blake2b512'];

async function handler(m, { sock }) {
  const args = m.args;
  
  if (!args[0]) {
    return m.reply(
      `🔐 *تجزئة النصوص*\n\n` +
      `📌 ${m.prefix}${m.command} <الخوارزمية> <النص>\n\n` +
      `📋 *الخوارزميات:*\n${ALGORITHMS.map(a => `• ${a}`).join('\n')}`
    );
  }

  const algo = args[0].toLowerCase();
  const input = args.slice(1).join(' ');

  if (!input) return m.reply('📝 اكتب النص المراد تجزئته');
  if (!ALGORITHMS.includes(algo)) return m.reply(`❌ ${algo} غير مدعوم\n\n✅ ${ALGORITHMS.join(', ')}`);

  try {
    const hex = crypto.createHash(algo).update(input).digest('hex');
    const base64 = crypto.createHash(algo).update(input).digest('base64');

    await sock.sendMessage(m.chat, {
      text: `🔐 *${algo.toUpperCase()}*\n\n📝 *الإدخال:* ${input}\n\n📋 *HEX:*\n\`\`\`${hex}\`\`\`\n\n📋 *BASE64:*\n\`\`\`${base64}\`\`\``,
      footer: 'Hash Generator',
      templateButtons: [
        { index: 1, quickReplyButton: { displayText: '📋 نسخ HEX', id: `copy_${hex}` } },
        { index: 2, quickReplyButton: { displayText: '📋 نسخ BASE64', id: `copy_${base64}` } },
      ]
    }, { quoted: m });

  } catch (e) {
    m.reply(`❌ ${e.message}`);
  }
}

export { pluginConfig as config, handler };