// تمييز - أمر لإضافة/حذف نجمة على الرسالة (تمييزها)

const pluginConfig = {
    name: ['تمييز'],
    alias: ['star'],
    category: 'owner',
    description: 'إضافة/حذف تمييز (نجمة) على الرسالة',
    usage: '.تمييز (رد على رسالة) أو .تمييز حذف (رد على رسالة)',
    example: '.تمييز',
    isOwner: true,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    if (!m.quoted) {
        return m.reply(
            '⭐ *تمييز الرسالة*\n\n' +
            '> `.تمييز` (رد على رسالة) — إضافة تمييز\n' +
            '> `.تمييز حذف` (رد على رسالة) — حذف التمييز'
        )
    }

    const unstar = m.args[0]?.toLowerCase() === 'حذف' || m.args[0]?.toLowerCase() === 'unstar' || m.args[0]?.toLowerCase() === 'remove'
    const key = m.quoted.key

    try {
        await sock.chatModify({
            star: {
                messages: [{ id: key.id, fromMe: key.fromMe }],
                star: !unstar
            }
        }, m.chat)

        await m.react('⭐')
        return m.reply(
            unstar
                ? '❌ *تم حذف التمييز من الرسالة*'
                : '⭐ *تمت إضافة تمييز للرسالة*'
        )
    } catch (err) {
        return m.reply(`❌ فشل: ${err.message}`)
    }
}

export { pluginConfig as config, handler }