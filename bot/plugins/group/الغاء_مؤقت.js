import { generateWAMessageFromContent } from "maro";

const activeTimers = global.activeTimers || (global.activeTimers = {});

const pluginConfig = {
    name: 'الغاء_مؤقت',
    alias: [],
    category: 'group',
    description: 'إلغاء المؤقت النشط للشات - للمشرفين والمطور فقط',
    usage: '.الغاء_مؤقت',
    example: '.الغاء_مؤقت',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
};

async function handler(m, { sock }) {
    if (!activeTimers[m.chat]) {
        return m.reply('⚠️ لا يوجد مؤقت نشط.');
    }

    clearTimeout(activeTimers[m.chat].timer);
    delete activeTimers[m.chat];

    await m.reply('✅ تم إلغاء المؤقت بنجاح.');
}

export { pluginConfig as config, handler }