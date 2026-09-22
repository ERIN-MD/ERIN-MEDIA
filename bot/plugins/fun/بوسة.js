import te from '../../src/lib/maro-error.js';

const GIF_URL = "https://files.catbox.moe/shglrs.mp4";

const pluginConfig = {
    name: 'بوسة',
    alias: ['kiss'],
    category: 'fun',
    description: '💕 يرسل رسالة بوسة رومانسية مع فيديو GIF بالرد على شخص',
    usage: '.بوسة (رد على رسالة الشخص)',
    example: '.بوسة',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

async function handler(m, { sock }) {
    try {
        if (!m.quoted) {
            return m.reply(
                '💋 *يجب أن ترد على رسالة الشخص*\n\n' +
                '📌 الذي تريد إرسال بوسة له.'
            );
        }

        const target = m.quoted.sender;
        const sender = m.sender;

        if (target === sock.user?.id?.split(':')[0] + '@s.whatsapp.net') {
            return m.reply('🥰 شكراً لك! لكن لا أحتاج بوسة!');
        }

        if (target === sender) {
            return m.reply('😅 لا يمكنك إرسال بوسة لنفسك!');
        }

        await m.react("💕");

        const kissTexts = [
            `╭───────✦💕✦───────╮\n│  💋 أرسل لك بوسة:\n│  💑 من: @${sender.split('@')[0]}\n│  💝 إلى: @${target.split('@')[0]}\n╰───────✦✨✦───────╯`,
            `┌────── ⋆⋅💋⋅⋆ ──────┐\n│ 💕 بوسة رومانسية\n│ 👤 من: @${sender.split('@')[0]}\n│ 💘 إلى: @${target.split('@')[0]}\n└────── ⋆⋅💕⋅⋆ ──────┘`,
            `◈━━━━━━ 💋 ━━━━━━◈\n💕 بوسة حب\n👤 @${sender.split('@')[0]}\n💘 @${target.split('@')[0]}\n◈━━━━━━ 💕 ━━━━━━◈`
        ];

        const kissText = kissTexts[Math.floor(Math.random() * kissTexts.length)];

        await sock.sendMessage(m.chat, {
            video: { url: GIF_URL },
            caption: kissText,
            gifPlayback: true,
            mentions: [target, sender]
        }, { quoted: m });

        await m.react("✅");

    } catch (error) {
        console.error('❌ خطأ:', error);
        m.reply(te(m.prefix, m.command, m.pushName));
    }
}

export { pluginConfig as config, handler };