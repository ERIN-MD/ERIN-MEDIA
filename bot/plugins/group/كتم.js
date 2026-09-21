import { getDatabase } from '../../src/lib/maro-database.js'
import { generateWAMessageFromContent } from "maro";

const activeTimers = global.activeTimers || (global.activeTimers = {});

const pluginConfig = {
    name: 'كتم',
    alias: ['mute'],
    category: 'group',
    description: 'كتم شخص في المجموعة مع دعم المؤقت',
    usage: '.كتم @مستخدم [5د/2س/1ي]',
    example: '.كتم @مستخدم 5د',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    isBotAdmin: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const timeArg = args[1]

    let target = null
    if (m.quoted) {
        target = m.quoted.sender
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
        target = m.mentionedJid[0]
    }

    if (!target) {
        return m.reply(
            `🤫 *كتم*\n\n` +
            `• \`${m.prefix}كتم @مستخدم\` - كتم فوري\n` +
            `• \`${m.prefix}كتم @مستخدم 5د\` - كتم بمؤقت\n\n` +
            `*وحدات الوقت:* د = دقائق | س = ساعات | ي = أيام`
        )
    }

    if (target === m.sender) return m.reply('❌ لا يمكنك كتم نفسك!')
    if (target === sock.user?.id?.split(':')[0] + '@s.whatsapp.net') return m.reply('❌ لا يمكن كتم البوت!')

    const targetName = target.split('@')[0]
    const group = db.getGroup(m.chat) || {}
    const mutedMembers = group.mutedMembers || []

    // التحقق إذا كان مكتوماً بالفعل
    const alreadyMuted = mutedMembers.some(jid => {
        const c = jid.replace(/@.+/g, '')
        return c === targetName
    })

    if (alreadyMuted) {
        return m.reply(`❌ @${targetName} مكتوم بالفعل.\nاستخدم *.فك_الكتم @${targetName}* لإلغاء الكتم.`, { mentions: [target] })
    }

    // إضافة للمكتومين
    mutedMembers.push(target)
    db.setGroup(m.chat, { ...group, mutedMembers })

    // كتم فوري
    if (!timeArg) {
        return m.reply(`🤫 تم كتم @${targetName} بواسطة @${m.sender.split('@')[0]}\n\nلن يتمكن من استخدام البوت.\nاكتب *${m.prefix}فك_الكتم @${targetName}* لإلغاء الكتم.`, { mentions: [target, m.sender] })
    }

    // كتم بمؤقت
    const match = timeArg.match(/^(\d+)(د|س|ي)$/)
    if (!match) return m.reply('⚠️ صيغة الوقت خطأ\nمثال: 5د ، 2س ، 1ي')

    const value = parseInt(match[1])
    const unit = match[2]

    let durationMs = 0
    if (unit === 'د') durationMs = value * 60 * 1000
    if (unit === 'س') durationMs = value * 60 * 60 * 1000
    if (unit === 'ي') durationMs = value * 24 * 60 * 60 * 1000

    const timerKey = `mute_${m.chat}_${target}`
    if (activeTimers[timerKey]) clearTimeout(activeTimers[timerKey])

    activeTimers[timerKey] = setTimeout(async () => {
        try {
            const currentGroup = db.getGroup(m.chat) || {}
            const currentMuted = currentGroup.mutedMembers || []
            currentGroup.mutedMembers = currentMuted.filter(jid => {
                const c = jid.replace(/@.+/g, '')
                return c !== targetName
            })
            db.setGroup(m.chat, currentGroup)
            await sock.sendMessage(m.chat, { text: `🔓 تم فك الكتم تلقائياً عن @${targetName} بعد ${timeArg}`, mentions: [target] })
        } catch (e) {
            console.error('خطأ في مؤقت الكتم:', e)
        } finally {
            delete activeTimers[timerKey]
        }
    }, durationMs)

    // رسالة مع زر إلغاء
    const content = {
        buttonsMessage: {
            buttons: [
                { buttonId: `.الغاء_مؤقت`, buttonText: { displayText: '⛔ إلغاء المؤقت' }, type: 1 },
            ],
            contentText: `🤫 تم كتم @${targetName} لمدة ${timeArg}`,
            footerText: 'نظام الكتم',
            headerType: 1,
        },
    }

    const msg = generateWAMessageFromContent(m.chat, content, { quoted: m })
    sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
}

function isMutedMember(chatId, jid, db) {
    const group = db.getGroup(chatId) || {}
    const mutedMembers = group.mutedMembers || []
    if (mutedMembers.length === 0) return false
    const senderNumber = jid.replace(/@.+/g, '')
    return mutedMembers.some(jid => {
        const c = jid.replace(/@.+/g, '')
        return c === senderNumber
    })
}

export { pluginConfig as config, handler, isMutedMember }