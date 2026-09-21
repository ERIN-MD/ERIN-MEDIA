import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'حرب_عشائر',
    alias: ['clanwar'],
    category: 'clan',
    description: 'حرب ضد عشيرة أخرى',
    usage: '.حرب_عشائر <معرف_العشيرة>',
    example: '.حرب_عشائر clan_123456',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3600,
    energi: 0,
    isEnabled: true
}

const REWARDS = {
    koinWin: 30000,
    koinLose: 6000,
    expWin: 15000,
    expLose: 3000,
    energiWin: 15,
    energiLose: 3,
    clanExpWin: 5000,
    clanExpLose: 1000
}

function calculatePower(db, clan) {
    let totalPower = 0
    for (const jid of clan.members) {
        const user = db.getUser(jid)
        const level = user?.rpg?.level || user?.level || 1
        const exp = user?.rpg?.exp || user?.exp || 0
        totalPower += (level * 100) + (exp / 10)
    }
    totalPower += (clan.level || 1) * 500
    totalPower += (clan.wins || 0) * 50
    return Math.floor(totalPower)
}

function getScaledRewards(clan) {
    const level = clan.level || 1
    const mult = 1 + (level * 0.1)
    return {
        koinWin: Math.floor(REWARDS.koinWin * mult),
        koinLose: Math.floor(REWARDS.koinLose * mult),
        expWin: Math.floor(REWARDS.expWin * mult),
        expLose: Math.floor(REWARDS.expLose * mult),
        energiWin: Math.floor(REWARDS.energiWin * mult),
        energiLose: Math.floor(REWARDS.energiLose * mult)
    }
}

function simulateWar(power1, power2) {
    const total = power1 + power2
    return Math.random() < (power1 / total) ? 1 : 2
}

function powerBar(p1, p2) {
    const total = p1 + p2
    const ratio = Math.round((p1 / total) * 10)
    return '🟩'.repeat(ratio) + '🟥'.repeat(10 - ratio)
}

async function handler(m) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    const targetClanId = m.text?.trim()

    if (!user?.clanId) return m.reply(`❌ ليس لديك عشيرة بعد`)

    if (!targetClanId) {
        return m.reply(
            `⚔️ *حرب العشائر*\n\n` +
            `تحدَّ عشيرة أخرى للقتال!\n\n` +
            `مثال: *.حرب_عشائر clan_123456*\n` +
            `تحقق من المعرف: *.لوحة_العشائر*\n\n` +
            `الشرط: 3 أعضاء على الأقل لكل عشيرة\n` +
            `وقت الانتظار: ساعة واحدة`
        )
    }

    if (!db.db.data.clans) db.db.data.clans = {}

    const myClan = db.db.data.clans[user.clanId]
    const enemyClan = db.db.data.clans[targetClanId]
        || Object.values(db.db.data.clans).find(c => c.name.toLowerCase() === targetClanId.toLowerCase())
        || Object.values(db.db.data.clans).find(c => c.id.toLowerCase() === targetClanId.toLowerCase())

    if (!myClan) return m.reply(`❌ عشيرتك غير موجودة`)
    if (!enemyClan) return m.reply(`❌ عشيرة الخصم غير موجودة`)
    if (user.clanId === targetClanId) return m.reply(`❌ لا يمكنك محاربة عشيرتك`)
    if (myClan.members.length < 3) return m.reply(`❌ عشيرتك تحتاج 3 أعضاء على الأقل`)
    if (enemyClan.members.length < 3) return m.reply(`❌ عشيرة الخصم تحتاج 3 أعضاء على الأقل`)

    const myPower = calculatePower(db, myClan)
    const enemyPower = calculatePower(db, enemyClan)
    const winner = simulateWar(myPower, enemyPower)
    const isWin = winner === 1

    const myR = getScaledRewards(myClan)
    const enemyR = getScaledRewards(enemyClan)

    if (isWin) {
        myClan.wins = (myClan.wins || 0) + 1
        myClan.exp = (myClan.exp || 0) + REWARDS.clanExpWin
        enemyClan.losses = (enemyClan.losses || 0) + 1
        enemyClan.exp = (enemyClan.exp || 0) + REWARDS.clanExpLose

        for (const jid of myClan.members) {
            db.updateKoin(jid, myR.koinWin)
            db.updateExp(jid, myR.expWin)
            db.updateEnergi(jid, myR.energiWin)
        }
        for (const jid of enemyClan.members) {
            db.updateKoin(jid, enemyR.koinLose)
            db.updateExp(jid, enemyR.expLose)
            db.updateEnergi(jid, enemyR.energiLose)
        }
    } else {
        myClan.losses = (myClan.losses || 0) + 1
        myClan.exp = (myClan.exp || 0) + REWARDS.clanExpLose
        enemyClan.wins = (enemyClan.wins || 0) + 1
        enemyClan.exp = (enemyClan.exp || 0) + REWARDS.clanExpWin

        for (const jid of myClan.members) {
            db.updateKoin(jid, myR.koinLose)
            db.updateExp(jid, myR.expLose)
            db.updateEnergi(jid, myR.energiLose)
        }
        for (const jid of enemyClan.members) {
            db.updateKoin(jid, enemyR.koinWin)
            db.updateExp(jid, enemyR.expWin)
            db.updateEnergi(jid, enemyR.energiWin)
        }
    }

    myClan.level = Math.floor(myClan.exp / 10000) + 1
    enemyClan.level = Math.floor(enemyClan.exp / 10000) + 1
    db.save()

    const myE = myClan.emblem || '🏰'
    const enE = enemyClan.emblem || '🏰'
    const bar = powerBar(myPower, enemyPower)
    const winnerClan = isWin ? myClan : enemyClan
    const winnerE = isWin ? myE : enE
    const r = isWin ? myR : myR

    let txt = `⚔️ *نتيجة الحرب*\n\n`
    txt += `${myE} *${myClan.name}*  ضد  *${enemyClan.name}* ${enE}\n`
    txt += `💪 ${myPower.toLocaleString('id-ID')}  ضد  ${enemyPower.toLocaleString('id-ID')}\n`
    txt += `${bar}\n\n`
    txt += `${winnerE} *${winnerClan.name} تفوز!*\n\n`

    if (isWin) {
        txt += `🎁 المكافأة لكل عضو:\n`
        txt += `+Rp ${myR.koinWin.toLocaleString('id-ID')} · +${myR.expWin.toLocaleString('id-ID')} خبرة · +${myR.energiWin} طاقة\n`
        txt += `+${REWARDS.clanExpWin.toLocaleString('id-ID')} خبرة للعشيرة`
    } else {
        txt += `😔 تعزية لكل عضو:\n`
        txt += `+Rp ${myR.koinLose.toLocaleString('id-ID')} · +${myR.expLose.toLocaleString('id-ID')} خبرة · +${myR.energiLose} طاقة\n`
        txt += `+${REWARDS.clanExpLose.toLocaleString('id-ID')} خبرة للعشيرة`
    }

    await m.reply(txt)
}

export { pluginConfig as config, handler }
