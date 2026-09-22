import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'اشعارات',
    alias: ['notifications'],
    category: 'group',
    description: 'تفعيل/تعطيل جميع إشعارات المجموعة دفعة واحدة',
    usage: '.اشعارات تشغيل/إيقاف',
    example: '.اشعارات تشغيل',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

const ALL_NOTIFS = [
    'notifPromote',
    'notifDemote', 
    'notifOpenGroup',
    'notifCloseGroup',
    'notifLabelChange',
    'notifSholat',
    'welcome',
    'goodbye'
];

function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args[0]?.toLowerCase()
    const group = db.getGroup(m.chat) || {}

    if (!args) {
        const activeCount = ALL_NOTIFS.filter(key => group[key] === true).length
        const status = activeCount === ALL_NOTIFS.length ? '✅ الكل مفعل' : activeCount === 0 ? '❌ الكل معطل' : `⚠️ ${activeCount}/${ALL_NOTIFS.length} مفعل`
        
        return m.reply(
            `🔔 *إشعارات المجموعة*\n\n` +
            `📊 *الحالة:* ${status}\n\n` +
            `⚙️ *الاستخدام:*\n` +
            `• \`${m.prefix}اشعارات تشغيل\` - تفعيل الكل\n` +
            `• \`${m.prefix}اشعارات إيقاف\` - تعطيل الكل`
        )
    }

    if (args === 'تشغيل' || args === 'on') {
        for (const key of ALL_NOTIFS) { group[key] = true }
        db.setGroup(m.chat, group)
        return m.reply(`✅ *تم تفعيل جميع الإشعارات*\n\n🔔 الترقية | الخفض | الفتح | الإغلاق | الوسم | الصلاة | الترحيب | الوداع`)
    }

    if (args === 'ايقاف' || args === 'off') {
        for (const key of ALL_NOTIFS) { group[key] = false }
        db.setGroup(m.chat, group)
        return m.reply(`❌ *تم تعطيل جميع الإشعارات*\n\n🔕 جميع الإشعارات معطلة الآن`)
    }

    return m.reply(`❌ استخدم: \`${m.prefix}اشعارات تشغيل\` أو \`${m.prefix}اشعارات إيقاف\``)
}

export { pluginConfig as config, handler }