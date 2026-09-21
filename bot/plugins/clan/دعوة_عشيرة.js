import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'دعوة_عشيرة',
    alias: ['claninvite'],
    category: 'clan',
    description: 'دعوة وإضافة مستخدم مباشرة إلى العشيرة',
    usage: '.دعوة_عشيرة @مستخدم',
    example: '.دعوة_عشيرة @مستخدم',
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

    const target = m.mentionedJid?.[0] || m.quoted?.sender
    if (!target) {
        return m.reply(
            `📨 *دعوة عشيرة*\n\n` +
            `قم بالإشارة أو الرد على المستخدم الذي تريد دعوته\n\n` +
            `مثال: *.دعوة_عشيرة @مستخدم*`
        )
    }

    if (target === m.sender) return m.reply(`❌ لا يمكنك دعوة نفسك`)

    const targetUser = db.getUser(target)
    if (targetUser?.clanId) return m.reply(`❌ هذا المستخدم لديه عشيرة بالفعل`)
    if (clan.members.length >= 50) return m.reply(`❌ العشيرة ممتلئة (50/50)`)

    clan.members.push(target)
    db.setUser(target, { clanId: user.clanId })
    db.save()

    const emblem = clan.emblem || '🏰'

    await m.reply(
        `${emblem} *تمت الدعوة!*\n\n` +
        `@${target.split('@')[0]} انضم إلى *${clan.name}*\n` +
        `الأعضاء: ${clan.members.length}/50`,
        { mentions: [m.sender, target] }
    )
}

export { pluginConfig as config, handler }
