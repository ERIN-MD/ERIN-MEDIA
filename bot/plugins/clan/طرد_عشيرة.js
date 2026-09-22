import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'طرد_عشيرة',
    alias: ['clankick'],
    category: 'clan',
    description: 'طرد عضو من العشيرة (للقائد فقط)',
    usage: '.طرد_عشيرة @مستخدم',
    example: '.طرد_عشيرة @مستخدم',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    const db = getDatabase()
    const user = db.getUser(m.sender)

    if (!user?.clanId) return m.reply(`❌ ليس لديك عشيرة بعد`)
    if (!db.db.data.clans) db.db.data.clans = {}

    const clan = db.db.data.clans[user.clanId]
    if (!clan) return m.reply(`❌ العشيرة غير موجودة`)
    if (clan.leader !== m.sender) return m.reply(`❌ القائد فقط من يمكنه الطرد`)

    const target = m.mentionedJid?.[0] || m.quoted?.sender
    if (!target) {
        return m.reply(
            `👢 *طرد من العشيرة*\n\n` +
            `قم بالإشارة أو الرد على العضو الذي تريد طرده\n\n` +
            `مثال: *.طرد_عشيرة @مستخدم*`
        )
    }

    if (target === m.sender) return m.reply(`❌ لا يمكنك طرد نفسك`)
    if (!clan.members.includes(target)) return m.reply(`❌ المستخدم ليس عضواً في هذه العشيرة`)

    clan.members = clan.members.filter(jid => jid !== target)
    db.setUser(target, { clanId: null })
    db.save()

    const emblem = clan.emblem || '🏰'

    await m.reply(
        `${emblem} *تم الطرد*\n\n` +
        `@${target.split('@')[0]} طُرد من *${clan.name}*\n` +
        `الأعضاء المتبقين: ${clan.members.length}/50`,
        { mentions: [target] }
    )
}

export { pluginConfig as config, handler }
