const afkStorage = global.afkStorage || (global.afkStorage = new Map())

const pluginConfig = {
    name: 'مشغول',
    alias: ['afk'],
    category: 'group',
    description: 'تفعيل وضع مشغول مع السبب',
    usage: '.مشغول <سبب>',
    example: '.مشغول أتناول الطعام',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function getAfkUser(jid) {
    return afkStorage.get(jid) || null
}

function setAfkUser(jid, reason) {
    afkStorage.set(jid, {
        reason: reason || 'لا يوجد سبب',
        time: Date.now()
    })
}

function removeAfkUser(jid) {
    afkStorage.delete(jid)
}

function isUserAfk(jid) {
    return afkStorage.has(jid)
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) {
        return `${hours} ساعة ${minutes % 60} دقيقة`
    } else if (minutes > 0) {
        return `${minutes} دقيقة ${seconds % 60} ثانية`
    } else {
        return `${seconds} ثانية`
    }
}

async function handler(m, { sock }) {
    const reason = m.text || 'لا يوجد سبب'
    setAfkUser(m.sender, reason)
    await m.reply(
        `💤 *تم تفعيل المشغول*\n\n` +
        `\`\`\`@${m.sender.split('@')[0]} مشغول الآن\`\`\`\n` +
        `🍀 \`السبب:\` *${reason}*\n\n` +
        `_اكتب أي شيء لإلغاء وضع المشغول._`,
        { mentions: [m.sender] }
    )
}

async function checkAfk(m, sock) {
    const afkData = getAfkUser(m.sender)
    if (afkData) {
        if (m.isCommand && m.command?.toLowerCase() === 'مشغول') return
        removeAfkUser(m.sender)
        const duration = formatDuration(Date.now() - afkData.time)
        await m.reply(`👋 *تم إلغاء المشغول*\n\n` +
                `\`\`\`@${m.sender.split('@')[0]} عاد الآن!\`\`\`\n` +
                `🍀 \`مدة الانشغال:\` *${duration}*`, { mentions: [m.sender] })
    }
    if (m.isGroup && m.mentionedJid && m.mentionedJid.length > 0) {
        for (const mentioned of m.mentionedJid) {
            const mentionedAfk = getAfkUser(mentioned)
            if (mentionedAfk) {
                const duration = formatDuration(Date.now() - mentionedAfk.time)
                await m.statusReply(`💤 *مستخدم مشغول*\n\n` +
                        `\`\`\`ششش، لا تزعجه!\`\`\` \`@${mentioned.split('@')[0]}\` مشغول\n` +
                        `🍀 \`السبب:\` *${mentionedAfk.reason}*\n` +
                        `🍀 \`منذ:\` *${duration}*`, 'afk_' + mentioned, '💤')
            }
        }
    }
}

export { pluginConfig as config, handler, checkAfk, getAfkUser, setAfkUser, removeAfkUser, isUserAfk }