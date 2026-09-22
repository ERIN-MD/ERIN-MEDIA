import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'لوحة_العشائر',
    alias: ['clanleaderboard'],
    category: 'clan',
    description: 'عرض ترتيب العشائر',
    usage: '.لوحة_العشائر',
    example: '.لوحة_العشائر',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function getRankTitle(level) {
    if (level >= 50) return '👑'
    if (level >= 30) return '💎'
    if (level >= 20) return '🏆'
    if (level >= 10) return '🥇'
    if (level >= 5) return '🥈'
    return '🥉'
}

async function handler(m) {
    const db = getDatabase()

    if (!db.db.data.clans) db.db.data.clans = {}

    const clans = Object.values(db.db.data.clans)
    if (clans.length === 0) {
        return m.reply(`🏰 لا توجد عشائر مسجلة بعد\n\nأنشئ: *.إنشاء_عشيرة <اسم>*`)
    }

    clans.sort((a, b) => {
        const scoreA = ((a.wins || 0) * 100) + (a.exp || 0) + ((a.level || 1) * 500)
        const scoreB = ((b.wins || 0) * 100) + (b.exp || 0) + ((b.level || 1) * 500)
        return scoreB - scoreA
    })

    const medals = ['🥇', '🥈', '🥉']

    let txt = `🏰 *لوحة العشائر*\n\n`

    clans.slice(0, 10).forEach((clan, i) => {
        const medal = medals[i] || `${i + 1}.`
        const totalGames = (clan.wins || 0) + (clan.losses || 0)
        const winRate = totalGames > 0
            ? ((clan.wins / totalGames) * 100).toFixed(0)
            : '—'
        const emblem = clan.emblem || '🏰'
        const rank = getRankTitle(clan.level || 1)

        txt += `${medal} ${emblem} *${clan.name}*\n`
        txt += `   ${rank} م.${clan.level || 1} · ${clan.wins || 0} فوز/${clan.losses || 0} خسارة (${winRate}%) · 👥 ${clan.members.length}\n\n`
    })

    txt += `إجمالي *${clans.length}* عشيرة مسجلة`

    await m.reply(txt)
}

export { pluginConfig as config, handler }
