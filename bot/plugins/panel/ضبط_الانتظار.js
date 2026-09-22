// ضبط الانتظار - أمر لتعيين مدة الانتظار لجميع أوامر إنشاء اللوحة

import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'ضبط_الانتظار',
    alias: ['jedacreate'],
    category: 'panel',
    description: 'تعيين مدة الانتظار لجميع أوامر إنشاء اللوحة',
    usage: '.ضبط_الانتظار <المدة>',
    example: '.ضبط_الانتظار 5د',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true
}

function parseTime(input) {
    if (!input || input === '0') return 0
    
    const match = input.match(/^(\d+)(s|m|h|د|س)?$/i)
    if (!match) return null
    
    const value = parseInt(match[1])
    const unit = (match[2] || 's').toLowerCase()
    
    // دعم الوحدات العربية والإنجليزية
    switch (unit) {
        case 's': return value * 1000
        case 'm': return value * 60 * 1000
        case 'h': return value * 60 * 60 * 1000
        case 'د': return value * 60 * 1000  // دقيقة
        case 'س': return value * 60 * 60 * 1000  // ساعة
        default: return value * 1000
    }
}

function formatTime(ms) {
    if (ms <= 0) return 'بدون انتظار'
    
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours} ساعة ${minutes % 60} دقيقة`
    if (minutes > 0) return `${minutes} دقيقة ${seconds % 60} ثانية`
    return `${seconds} ثانية`
}

function handler(m, { sock }) {
    const db = getDatabase()
    const input = m.text?.trim()
    
    const DEFAULT_JEDA = 5 * 60 * 1000
    
    if (!input) {
        const currentJeda = db.setting('panelCreateJeda') ?? DEFAULT_JEDA
        return m.reply(
            `⏱️ *مدة انتظار إنشاء اللوحة*\n\n` +
            `╭┈┈⬡「 📋 *معلومات* 」\n` +
            `┃ ◦ مدة الانتظار الحالية: *${formatTime(currentJeda)}*\n` +
            `┃ ◦ الافتراضي: *5 دقائق*\n` +
            `╰┈┈⬡\n\n` +
            `> استخدم: \`${m.prefix}ضبط_الانتظار <المدة>\`\n` +
            `> مثال: \`${m.prefix}ضبط_الانتظار 5د\` (5 دقائق)\n` +
            `> لإلغاء التفعيل: \`${m.prefix}ضبط_الانتظار 0\`\n\n` +
            `*صيغ الوقت:*\n` +
            `• \`30ث\` أو \`30s\` = 30 ثانية\n` +
            `• \`5د\` أو \`5m\` = 5 دقائق\n` +
            `• \`1س\` أو \`1h\` = 1 ساعة`
        )
    }
    
    const jedaMs = parseTime(input)
    
    if (jedaMs === null) {
        return m.reply(`❌ صيغة الوقت غير صالحة!\n\n> مثال: 30ث, 5د, 1س`)
    }
    
    db.setting('panelCreateJeda', jedaMs)
    db.setting('panelCreateLastUsed', 0)
    
    m.react('✅')
    
    if (jedaMs === 0) {
        return m.reply(
            `✅ *تم إلغاء تفعيل الانتظار*\n\n` +
            `> إنشاء اللوحة الآن بدون انتظار`
        )
    }
    
    return m.reply(
        `✅ *تم تعيين مدة الانتظار*\n\n` +
        `╭┈┈⬡「 ⏱️ *الإعدادات* 」\n` +
        `┃ ◦ مدة الانتظار: *${formatTime(jedaMs)}*\n` +
        `╰┈┈⬡\n\n` +
        `> بعد إنشاء اللوحة، يجب على جميع المستخدمين الانتظار ${formatTime(jedaMs)} قبل إنشاء لوحة جديدة.`
    )
}

export { pluginConfig as config, handler }