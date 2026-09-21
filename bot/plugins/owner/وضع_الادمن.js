// وضع الادمن - أمر لتحديد من يمكنه الوصول إلى أوامر البوت

import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'وضع_الادمن',
    alias: ['onlyadmin'],
    category: 'owner',
    description: 'تحديد أن المشرفين فقط يمكنهم استخدام أوامر البوت',
    usage: '.وضع_الادمن تشغيل/إيقاف',
    example: '.وضع_الادمن تشغيل',
    isOwner: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    const db = getDatabase()
    const args = m.args[0]?.toLowerCase()
    const cmd = m.command.toLowerCase()
    const current = db.setting('onlyAdmin') || false

    if (cmd === 'selfadmin' || cmd === 'خاص') {
        if (current) {
            db.setting('onlyAdmin', false)
            await m.react('❌')
            return m.reply('❌ *تم إيقاف وضع الادمن*\n\n> يمكن للجميع استخدام البوت')
        }
        db.setting('onlyAdmin', true)
        db.setting('selfAdmin', false)
        db.setting('publicAdmin', false)
        await m.react('✅')
        return m.reply(
            '✅ *تم تفعيل وضع الادمن*\n\n' +
            '╭┈┈⬡「 🔒 *الصلاحية* 」\n' +
            '┃ ✅ مشرف المجموعة\n' +
            '┃ ✅ مالك البوت\n' +
            '┃ ❌ عضو عادي\n' +
            '╰┈┈⬡\n\n' +
            '> استخدم `.وضع_الادمن إيقاف` لإلغاء التفعيل'
        )
    }

    if (cmd === 'publicadmin' || cmd === 'عام') {
        if (current) {
            db.setting('onlyAdmin', false)
            await m.react('❌')
            return m.reply('❌ *تم إيقاف وضع الادمن*\n\n> يمكن للجميع استخدام البوت')
        }
        db.setting('onlyAdmin', true)
        db.setting('selfAdmin', false)
        db.setting('publicAdmin', false)
        await m.react('✅')
        return m.reply(
            '✅ *تم تفعيل وضع الادمن*\n\n' +
            '╭┈┈⬡「 🔒 *الصلاحية* 」\n' +
            '┃ ✅ مشرف المجموعة\n' +
            '┃ ✅ مالك البوت\n' +
            '┃ ✅ المحادثة الخاصة (الكل)\n' +
            '┃ ❌ عضو عادي في المجموعة\n' +
            '╰┈┈⬡\n\n' +
            '> استخدم `.وضع_الادمن إيقاف` لإلغاء التفعيل'
        )
    }

    if (!args || args === 'الحالة' || args === 'status') {
        return m.reply(
            `🔒 *وضع الادمن*\n\n` +
            `> الحالة: ${current ? '✅ مفعل' : '❌ معطل'}\n\n` +
            `*طريقة الاستخدام:*\n` +
            `> \`.وضع_الادمن تشغيل\` — تفعيل\n` +
            `> \`.وضع_الادمن إيقاف\` — تعطيل\n\n` +
            `_يمكن للمشرفين والمالك والمحادثات الخاصة فقط استخدام البوت_`
        )
    }

    if (args === 'on' || args === 'تشغيل') {
        if (current) return m.reply('⚠️ وضع الادمن مفعل بالفعل.')
        db.setting('onlyAdmin', true)
        db.setting('selfAdmin', false)
        db.setting('publicAdmin', false)
        await m.react('✅')
        return m.reply(
            '✅ *تم تفعيل وضع الادمن*\n\n' +
            '╭┈┈⬡「 🔒 *الصلاحية* 」\n' +
            '┃ ✅ مشرف المجموعة\n' +
            '┃ ✅ مالك البوت\n' +
            '┃ ✅ المحادثة الخاصة (الكل)\n' +
            '┃ ❌ عضو عادي في المجموعة\n' +
            '╰┈┈⬡'
        )
    }

    if (args === 'off' || args === 'إيقاف') {
        if (!current) return m.reply('⚠️ وضع الادمن معطل بالفعل.')
        db.setting('onlyAdmin', false)
        await m.react('❌')
        return m.reply('❌ *تم إيقاف وضع الادمن*\n\n> يمكن للجميع استخدام البوت')
    }

    return m.reply('❌ وسيط غير صالح. استخدم: `تشغيل` أو `إيقاف`')
}

export { pluginConfig as config, handler }