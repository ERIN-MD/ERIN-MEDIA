import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'انضمام_عشيرة',
    alias: ['clanjoin'],
    category: 'clan',
    description: 'الانضمام إلى عشيرة',
    usage: '.انضمام_عشيرة <معرف_العشيرة>',
    example: '.انضمام_عشيرة clan_123456',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

const MAX_MEMBERS = 50

async function handler(m) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    const clanId = m.text?.trim()

    if (!clanId) {
        return m.reply(
            `🏰 *انضمام عشيرة*\n\n` +
            `أدخل معرف العشيرة!\n\n` +
            `مثال: *.انضمام_عشيرة clan_123456*\n` +
            `تحقق من المعرف: *.لوحة_العشائر*`
        )
    }

    if (user.clanId) {
        return m.reply(`❌ أنت بالفعل في عشيرة\nاخرج أولاً: *.مغادرة_عشيرة*`)
    }

    if (!db.db.data.clans) db.db.data.clans = {}

    const clan = db.db.data.clans[clanId]
        || Object.values(db.db.data.clans).find(c => c.name.toLowerCase() === clanId.toLowerCase())
        || Object.values(db.db.data.clans).find(c => c.id.toLowerCase() === clanId.toLowerCase())
    if (!clan) return m.reply(`❌ العشيرة غير موجودة`)
    if (!clan.isOpen) return m.reply(`❌ *${clan.name}* مغلقة حالياً`)
    if (clan.members.length >= MAX_MEMBERS) return m.reply(`❌ *${clan.name}* ممتلئة (${MAX_MEMBERS}/${MAX_MEMBERS})`)

    clan.members.push(m.sender)
    db.setUser(m.sender, { clanId })
    db.save()

    const emblem = clan.emblem || '🏰'

    await m.reply(
        `${emblem} *أهلاً بك!*\n\n` +
        `@${m.sender.split('@')[0]} انضم إلى *${clan.name}*\n\n` +
        `القائد: @${clan.leader.split('@')[0]}\n` +
        `الأعضاء: ${clan.members.length}/${MAX_MEMBERS}\n\n` +
        `عرض المعلومات: *.معلومات_العشيرة*`,
        { mentions: [m.sender, clan.leader] }
    )
}

export { pluginConfig as config, handler }
