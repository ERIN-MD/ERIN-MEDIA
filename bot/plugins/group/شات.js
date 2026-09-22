import { generateWAMessageFromContent } from "maro";

const activeTimers = global.activeTimers || (global.activeTimers = {});

const pluginConfig = {
    name: 'شات',
    alias: ['chat'],
    category: 'group',
    description: 'قفل/فتح الشات فوراً أو بمؤقت مع زر إلغاء',
    usage: '.شات قفل/فتح [5د/2س/1ي]',
    example: '.شات قفل 5د',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
};

async function handler(m, { sock }) {
    try {
        const args = m.args || [];
        const action = args[0];
        const timeArg = args[1];

        if (!action || !['قفل', 'فتح'].includes(action)) {
            return m.reply(
                `⚙️ *إدارة الشات*\n\n` +
                `*أوامر:*\n` +
                `• ${m.prefix}شات قفل - قفل فوري\n` +
                `• ${m.prefix}شات قفل 5د - قفل بعد 5 دقائق\n` +
                `• ${m.prefix}شات فتح - فتح فوري\n` +
                `• ${m.prefix}شات فتح 2س - فتح بعد ساعتين\n\n` +
                `*وحدات الوقت:* د = دقائق | س = ساعات | ي = أيام`
            );
        }

        if (!timeArg) {
            if (action === 'قفل') {
                await sock.groupSettingUpdate(m.chat, 'announcement');
                return m.reply('🔒 تم قفل الشات فوراً.');
            } else {
                await sock.groupSettingUpdate(m.chat, 'not_announcement');
                return m.reply('🔓 تم فتح الشات فوراً.');
            }
        }

        const match = timeArg.match(/^(\d+)(د|س|ي)$/);
        if (!match) return m.reply('⚠️ صيغة الوقت خطأ\nمثال: 5د ، 2س ، 1ي');

        const value = parseInt(match[1]);
        const unit = match[2];

        let durationMs = 0;
        if (unit === 'د') durationMs = value * 60 * 1000;
        if (unit === 'س') durationMs = value * 60 * 60 * 1000;
        if (unit === 'ي') durationMs = value * 24 * 60 * 60 * 1000;

        if (activeTimers[m.chat]) clearTimeout(activeTimers[m.chat].timer);

        activeTimers[m.chat] = {
            timer: setTimeout(async () => {
                try {
                    if (action === 'قفل') {
                        await sock.groupSettingUpdate(m.chat, 'announcement');
                        await sock.sendMessage(m.chat, { text: '🔒 تم قفل الشات الآن.' });
                    } else {
                        await sock.groupSettingUpdate(m.chat, 'not_announcement');
                        await sock.sendMessage(m.chat, { text: '🔓 تم فتح الشات الآن.' });
                    }
                } catch (e) {
                    console.error('خطأ تنفيذ المؤقت:', e);
                } finally {
                    delete activeTimers[m.chat];
                }
            }, durationMs),
            chat: m.chat
        };

        const content = {
            buttonsMessage: {
                buttons: [
                    { buttonId: `.الغاء_مؤقت`, buttonText: { displayText: '⛔ إلغاء المؤقت' }, type: 1 },
                ],
                contentText: `⏳ سيتم *${action === 'قفل' ? 'قفل' : 'فتح'} الشات* بعد ${timeArg}`,
                footerText: 'نظام إدارة الشات',
                headerType: 1,
            },
        };

        const msg = generateWAMessageFromContent(m.chat, content, { quoted: m });
        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

    } catch (e) {
        console.error('[شات]', e);
        await m.reply('❌ حدث خطأ.');
    }
}

export { pluginConfig as config, handler }