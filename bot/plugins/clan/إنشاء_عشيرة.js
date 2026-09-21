import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'إنشاء_عشيرة',
    alias: ['clancreate'],
    category: 'clan',
    description: 'إنشاء عشيرة جديدة',
    usage: '.إنشاء_عشيرة <اسم>',
    example: '.إنشاء_عشيرة قاتل_التنانين',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

const CLAN_CREATE_COST = 50000
const MAX_CLAN_NAME = 20
const CLAN_EMBLEMS = ['🐉', '🦅', '🐺', '🦁', '🔥', '⚡', '🌙', '☀️', '💎', '🗡️']

function generateShortId(name, existingClans) {
    const clean = name.replace(/[^a-zA-Z]/g, '').toUpperCase()
    let id = clean.length >= 3 ? clean.slice(0, 3) : clean.padEnd(3, 'X')
    if (!existingClans[id]) return id
    id = clean.slice(0, 4) || id
    if (!existingClans[id]) return id
    for (let i = 1; i <= 99; i++) {
        const attempt = clean.slice(0, 3) + i
        if (!existingClans[attempt]) return attempt
    }
    return clean.slice(0, 2) + Math.random().toString(36).slice(2, 5).toUpperCase()
}

async function handler(m) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    const clanName = m.text?.trim()

    if (!clanName) {
        return m.reply(
            `⚔️ *إنشاء عشيرة*\n\n` +
            `أنشئ عشيرة واجمع الأعضاء!\n\n` +
            `التكلفة: *Rp ${CLAN_CREATE_COST.toLocaleString('id-ID')}*\n` +
            `أقصى حد للاسم: *${MAX_CLAN_NAME} حرف*\n\n` +
            `مثال: *.إنشاء_عشيرة قاتل_التنانين*`
        )
    }

    if (clanName.length > MAX_CLAN_NAME) {
        return m.reply(`❌ اسم العشيرة أقصاه ${MAX_CLAN_NAME} حرف`)
    }

    if (!/^[a-zA-Z0-9\s]+$/.test(clanName)) {
        return m.reply(`❌ اسم العشيرة مسموح فقط بالأحرف الإنجليزية والأرقام والمسافات`)
    }

    if (!db.db.data.clans) db.db.data.clans = {}

    if (user.clanId) {
        return m.reply(`❌ أنت بالفعل في عشيرة\nاخرج أولاً: *.مغادرة_عشيرة*`)
    }

    const existingClan = Object.values(db.db.data.clans).find(c => c.name.toLowerCase() === clanName.toLowerCase())
    if (existingClan) {
        return m.reply(`❌ اسم *${clanName}* مستخدم بالفعل`)
    }

    if ((user.koin || 0) < CLAN_CREATE_COST) {
        return m.reply(
            `❌ العملات غير كافية\n\n` +
            `المطلوب: *Rp ${CLAN_CREATE_COST.toLocaleString('id-ID')}*\n` +
            `لديك: *Rp ${(user.koin || 0).toLocaleString('id-ID')}*`
        )
    }

    const emblem = CLAN_EMBLEMS[Math.floor(Math.random() * CLAN_EMBLEMS.length)]
    const clanId = generateShortId(clanName, db.db.data.clans)
    const clan = {
        id: clanId,
        name: clanName,
        emblem,
        leader: m.sender,
        members: [m.sender],
        exp: 0,
        level: 1,
        wins: 0,
        losses: 0,
        createdAt: new Date().toISOString(),
        description: 'لا يوجد وصف بعد',
        isOpen: true
    }

    db.db.data.clans[clanId] = clan
    db.updateKoin(m.sender, -CLAN_CREATE_COST)
    db.setUser(m.sender, { clanId })
    await db.save()

    await m.reply(
        `${emblem} *تم إنشاء العشيرة*\n\n` +
        `*${clanName}*\n` +
        `القائد: @${m.sender.split('@')[0]}\n` +
        `الحالة: مفتوحة · 1/50 عضو\n\n` +
        `_-Rp ${CLAN_CREATE_COST.toLocaleString('id-ID')}_\n\n` +
        `ادعُ الأصدقاء: *.دعوة_عشيرة @مستخدم*\n` +
        `أو شارك المعرف: *${clanId}*`,
        { mentions: [m.sender] }
    )
}

export { pluginConfig as config, handler }
