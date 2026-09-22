import config from '../../config.js';

const pluginConfig = {
    name: 'تست',
    alias: ['test'],
    category: 'owner',
    description: '🧪 اختبار سرعة استجابة البوت',
    usage: '.تست',
    example: '.تست',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
};

async function handler(m, { sock }) {
    try {
        await m.react("🧪");

        const ownerName = config.owner?.name || 'Maro';
        const botName = config.bot?.name || 'Maro-AI';
        const channelName = config.saluran?.name || botName;
        const channelId = config.saluran?.id || '';

        const fakeQuote = {
            key: { fromMe: false, participant: "0@s.whatsapp.net", remoteJid: "status@broadcast" },
            message: { conversation: `${ownerName} | ${botName}` }
        };

        await sock.sendMessage(m.chat, {
            text: "I'm here",
            contextInfo: {
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterName: channelName,
                    newsletterJid: channelId,
                    serverMessageId: -1
                }
            }
        }, { quoted: fakeQuote });

    } catch (error) {
        console.error('Error:', error);
        await m.reply(`✅ *البوت يعمل*\n👨‍💻 ${config.owner?.name}\n🤖 ${config.bot?.name}`);
    }
}

export { pluginConfig as config, handler };