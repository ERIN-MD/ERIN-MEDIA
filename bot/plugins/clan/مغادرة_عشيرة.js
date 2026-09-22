import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'مغادرة_عشيرة',
    alias: ['clanleave'],
    category: 'clan',
    description: 'الخروج من العشيرة',
    usage: '.مغادرة_عشيرة',
    example: '.مغادرة_عشيرة',
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
    if (!clan) {
        db.setUser(m.sender, { clanId: null })
        db.save()
        return m.reply(`❌ العشيرة غير موجودة، تم تنظيف البيانات`)
    }

    if (clan.leader === m.sender) {
        if (clan.members.length > 1) {
            return m.reply(
                `❌ أنت القائد!\n\n` +
                `انقل القيادة أولاً: *.نقل_عشيرة @مستخدم*\n` +
                `أو اطرد جميع الأعضاء أولاً`
            )
        }
        delete db.db.data.clans[user.clanId]
        db.setUser(m.sender, { clanId: null })
        db.save()

        const emblem = clan.emblem || '🏰'
        return m.reply(`${emblem} تم حل عشيرة *${clan.name}*`)
    }

    clan.members = clan.members.filter(jid => jid !== m.sender)
    db.setUser(m.sender, { clanId: null })
    db.save()

    await m.reply(`👋 لقد غادرت عشيرة *${clan.name}*`)
}

export { pluginConfig as config, handler }
