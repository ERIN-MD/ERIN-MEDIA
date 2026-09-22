// حذف_قائمة - أمر لحذف معلومات المتجر

import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'حذف_قائمة',
    alias: ['hapuslist'],
    category: 'store',
    description: '🗑️ حذف معلومات المتجر',
    usage: '.حذف_قائمة <الرقم>',
    example: '.حذف_قائمة 1',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const lists = db.setting('storeLists') || []

    if (lists.length === 0) {
        return m.reply(`📭 *لا توجد معلومات.*\n\nأضف معلومات أولاً: \`${m.prefix}إضافة_قائمة\` ➕`)
    }

    const idx = parseInt(m.text?.trim()) - 1

    if (isNaN(idx) || idx < 0 || idx >= lists.length) {
        let txt = `🗑️ *اختر المعلومات للحذف*\n\nاكتب \`${m.prefix}حذف_قائمة <الرقم>\`\n\n`
        for (let i = 0; i < lists.length; i++) {
            const l = lists[i]
            const mediaIcon = l.image ? '🖼️' : l.video ? '🎬' : '📝'
            txt += `${mediaIcon} *${i + 1}.* ${l.name}\n`
        }
        return m.reply(txt)
    }

    const deleted = lists.splice(idx, 1)[0]
    db.setting('storeLists', lists)

    await m.react('✅')
    return m.reply(
        `🗑️ *تم حذف المعلومات*\n\n` +
        `🏷️ الاسم: *${deleted.name}*\n\n` +
        `⚠️ _تم حذف المعلومات بشكل دائم ولا يمكن استعادتها._`
    )
}

export { pluginConfig as config, handler }