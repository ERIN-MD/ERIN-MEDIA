const timers = {};

const pluginConfig = {
    name: 'إزعاج',
    alias: [],
    category: 'fun',
    description: '🚨 منشن مزعج لشخص كل ثانية حتى يتم إيقافه',
    usage: '.إزعاج @شخص',
    example: '.إزعاج @شخص',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
};

async function handler(m, { sock }) {
    try {
        const text = m.text?.trim() || '';
        const mentions = m.mentionedJid || [];

        if (/إزعاج\s*وقف/i.test(text)) {
            if (timers[m.chat]) {
                clearInterval(timers[m.chat]);
                delete timers[m.chat];
                return await m.reply('🛑 تم إيقاف الإزعاج.');
            } else {
                return await m.reply('⚠️ لا يوجد إزعاج يعمل حالياً.');
            }
        }

        if (!mentions.length) {
            return m.reply(
                '👤 منشن الشخص الذي تريد إزعاجه.\n\n' +
                'مثال:\nإزعاج @user'
            );
        }

        if (timers[m.chat]) {
            return m.reply('⚠️ الإزعاج يعمل بالفعل في هذه المجموعة.');
        }

        const target = mentions[0];
        const username = target.split('@')[0];

        timers[m.chat] = setInterval(async () => {
            try {
                await sock.sendMessage(m.chat, {
                    text: `🚨 إزعاج مستمر لـ @${username}`,
                    mentions: [target]
                });
            } catch {}
        }, 1000);

        await sock.sendMessage(m.chat, {
            text: `🚨 تم بدء إزعاج @${username}\n\n🛑 لإيقافه أرسل:\nإزعاج وقف`,
            mentions: [target]
        }, { quoted: m });

    } catch (err) {
        console.error(err);
        await m.reply('❌ حدث خطأ أثناء تنفيذ الأمر.');
    }
}

export { pluginConfig as config, handler };