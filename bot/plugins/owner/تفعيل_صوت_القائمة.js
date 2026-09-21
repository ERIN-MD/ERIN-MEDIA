import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'تفعيل_صوت_القائمة',
    alias: ['aktifaudiomenu'],
    category: 'owner',
    description: 'تبديل الصوت عند عرض القائمة',
    usage: '.تفعيل_صوت_القائمة نعم/لا',
    example: '.تفعيل_صوت_القائمة نعم',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock, db }) {
    const args = m.args || []
    const option = args[0]?.toLowerCase()

    const current = db.setting('audioMenu') !== false

    if (!option) {
        return m.reply(
            `🔊 *إعدادات صوت القائمة*\n\n` +
            `> الحالة: *${current ? '✅ مفعل' : '❌ معطل'}*\n\n` +
            `*طريقة الاستخدام:*\n` +
            `> \`${m.prefix}تفعيل_صوت_القائمة نعم\` - تفعيل الصوت\n` +
            `> \`${m.prefix}تفعيل_صوت_القائمة لا\` - تعطيل الصوت`
        )
    }

    if (option === 'نعم' || option === 'ya' || option === 'on' || option === '1' || option === 'aktif') {
        if (current) {
            return m.reply(`⚠️ صوت القائمة مفعل بالفعل!`)
        }
        db.setting('audioMenu', true)
        await db.save()
        await m.react('✅')
        return m.reply(`✅ صوت القائمة *تم تفعيله*!\n\n> الآن عند كتابة \`.menu\`، سيظهر الصوت.`)
    }

    if (option === 'لا' || option === 'gak' || option === 'off' || option === '0' || option === 'nonaktif') {
        if (!current) {
            return m.reply(`⚠️ صوت القائمة معطل بالفعل!`)
        }
        db.setting('audioMenu', false)
        await db.save()
        await m.react('✅')
        return m.reply(`❌ صوت القائمة *تم تعطيله*!\n\n> الآن \`.menu\` لن يكون هناك صوت.`)
    }

    return m.reply(`❌ خيار غير صالح!\n\nاستخدم: \`نعم\` أو \`لا\``)
}

export { pluginConfig as config, handler }