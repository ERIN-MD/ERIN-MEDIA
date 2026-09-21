import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'معلومات_العشيرة',
    alias: ['claninfo'],
    category: 'clan',
    description: 'عرض معلومات العشيرة',
    usage: '.معلومات_العشيرة [معرف_العشيرة]',
    example: '.معلومات_العشيرة',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function expBar(exp, nextLevel) {
    const target = nextLevel * 10000
    const progress = Math.min(exp / target, 1)
    const filled = Math.round(progress * 10)
    return '█'.repeat(filled) + '░'.repeat(10 - filled) + ` ${(progress * 100).toFixed(0)}%`
}

function getRankTitle(level) {
    if (level >= 50) return '👑 أسطوري'
    if (level >= 30) return '💎 ألماسي'
    if (level >= 20) return '🏆 بلاتيني'
    if (level >= 10) return '🥇 ذهبي'
    if (level >= 5) return '🥈 فضي'
    return '🥉 برونزي'
}

async function handler(m) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    let clanId = m.text?.trim() || user?.clanId

    if (!clanId) {
        return m.reply(
            `❌ ليس لديك عشيرة بعد\n\n` +
            `أنشئ: *.إنشاء_عشيرة <اسم>*\n` +
            `انضم: *.انضمام_عشيرة <معرف>*`
        )
    }

    if (!db.db.data.clans) db.db.data.clans = {}

    const clan = db.db.data.clans[clanId]
        || Object.values(db.db.data.clans).find(c => c.name.toLowerCase() === clanId.toLowerCase())
        || Object.values(db.db.data.clans).find(c => c.id.toLowerCase() === clanId.toLowerCase())
    if (!clan) return m.reply(`❌ العشيرة غير موجودة`)

    const totalGames = (clan.wins || 0) + (clan.losses || 0)
    const winRate = totalGames > 0
        ? ((clan.wins / totalGames) * 100).toFixed(1)
        : '—'

    const rank = getRankTitle(clan.level || 1)
    const emblem = clan.emblem || '🏰'
    const bar = expBar(clan.exp || 0, clan.level || 1)

    await m.reply(
        `${emblem} *${clan.name}*\n` +
        `${rank} · المستوى ${clan.level || 1}\n\n` +
        `الخبرة  ${bar}\n\n` +
        `┌ 👑 القائد · @${clan.leader.split('@')[0]}\n` +
        `├ 👥 الأعضاء · ${clan.members.length}/50\n` +
        `├ 🔓 الحالة · ${clan.isOpen ? 'مفتوحة' : 'مغلقة'}\n` +
        `└ 📅 أنشئت · ${new Date(clan.createdAt).toLocaleDateString('id-ID')}\n\n` +
        `⚔️ *إحصائيات القتال*\n` +
        `${clan.wins || 0} فوز · ${clan.losses || 0} خسارة · ${winRate}% نسبة الفوز\n\n` +
        `_${clan.description || 'لا يوجد وصف بعد'}_\n\n` +
        `المعرف: \`${clan.id}\``,
        { mentions: [clan.leader] }
    )
}

export { pluginConfig as config, handler }
