import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'أعضاء_العشيرة',
    alias: ['clanmembers'],
    category: 'clan',
    description: 'عرض قائمة أعضاء العشيرة',
    usage: '.أعضاء_العشيرة',
    example: '.أعضاء_العشيرة',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
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

    const emblem = clan.emblem || '🏰'
    const mentions = []

    const memberLines = clan.members.map((jid, i) => {
        const memberUser = db.getUser(jid)
        const isLeader = jid === clan.leader
        const level = memberUser?.rpg?.level || memberUser?.level || 1
        const koin = (memberUser?.koin || 0).toLocaleString('id-ID')
        mentions.push(jid)

        const role = isLeader ? '👑' : '•'
        return `${role} @${jid.split('@')[0]}  م.${level} · Rp ${koin}`
    })

    await m.reply(
        `${emblem} *${clan.name}* — الأعضاء\n\n` +
        memberLines.join('\n') +
        `\n\n${clan.members.length}/50 عضو`,
        { mentions }
    )
}

export { pluginConfig as config, handler }
