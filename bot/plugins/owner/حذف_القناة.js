// حذف القناة - أمر لحذف القناة/النشرة الإخبارية

const pluginConfig = {
    name: ['حذف_القناة'],
    alias: ['hapussaluran'],
    category: 'owner',
    description: 'حذف القناة/النشرة الإخبارية',
    usage: '.حذف_القناة <معرف_القناة>',
    example: '.حذف_القناة 120363xxx@newsletter',
    isOwner: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.text?.trim() || ''
    let targetJid = text

    if (!targetJid) {
        return m.reply(
            '🗑️ *حذف القناة*\n\n' +
            '> `.حذف_القناة <معرف_القناة>` — حذف القناة\n\n' +
            '📝 مثال:\n' +
            '> `.حذف_القناة 120363xxx@newsletter`\n\n' +
            '⚠️ سيتم حذف القناة بشكل دائم'
        )
    }

    if (!targetJid.endsWith('@newsletter')) {
        targetJid += '@newsletter'
    }

    try {
        await sock.newsletterDelete(targetJid)
        await m.react('✅')
        return m.reply(`🗑️ *تم حذف القناة*\n\n> المعرف: ${targetJid}`)
    } catch (err) {
        return m.reply(`❌ فشل حذف القناة: ${err.message}`)
    }
}

export { pluginConfig as config, handler }