import { getDatabase } from '../../src/lib/maro-database.js'
import { getParticipantJid } from '../../src/lib/maro-lid.js'
import te from '../../src/lib/maro-error.js'
const pluginConfig = {
    name: 'انذار',
    alias: ['warn'],
    category: 'group',
    description: 'إعطاء إنذار لعضو',
    usage: '.انذار @مستخدم <سبب>',
    example: '.انذار @مستخدم سبام',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    
    let groupData = db.getGroup(m.chat) || {}
    let warnings = groupData.warnings || {}
    const maxWarns = groupData.maxWarnings || 3

    const args = m.args
    if (!args[0] && !m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
        return m.reply(
            `⚠️ *نظام الإنذارات*\n\n` +
            `نظام إدارة المخالفات لأعضاء المجموعة.\n` +
            `الحد الأقصى: *${maxWarns} إنذارات* (طرد تلقائي)\n\n` +
            `*الاستخدام:*\n` +
            `• *${m.prefix}انذار @مستخدم <سبب>* — إعطاء إنذار\n` +
            `• *${m.prefix}انذار حد <رقم>* — تغيير الحد الأقصى\n` +
            `• *${m.prefix}الانذارات* — عرض قائمة الإنذارات\n` +
            `• *${m.prefix}مسح_الانذارات @مستخدم* — مسح إنذارات عضو`
        )
    }
    if (args[0]?.toLowerCase() === 'حد' || args[0]?.toLowerCase() === 'max') {
        const newMax = parseInt(args[1])
        if (isNaN(newMax) || newMax < 1 || newMax > 20) {
            return m.reply(`❌ *فشل*\n\nالحد يجب أن يكون رقماً بين 1-20.\nمثال: *${m.prefix}انذار حد 5*`)
        }
        groupData.maxWarnings = newMax
        db.setGroup(m.chat, groupData)
        return m.reply(`✅ *تم تغيير الحد*\n\nالحد الأقصى للإنذارات أصبح *${newMax} مرات*.`)
    }

    let targetUser = null
    if (m.quoted) {
        targetUser = m.quoted.sender
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
        targetUser = m.mentionedJid[0]
    }
    
    if (!targetUser) {
        await m.reply(
            `⚠️ *طريقة الاستخدام*\n\n` +
            `> رد على رسالة المستخدم + \`${m.prefix}انذار سبب\`\n` +
            `> أو: \`${m.prefix}انذار @مستخدم سبب\``
        )
        return
    }
    try {
        const groupMeta = m.groupMetadata
        const participant = groupMeta.participants.find(p => getParticipantJid(p) === targetUser)
        if (participant?.admin) {
            await m.reply(`❌ لا يمكن إنذار مشرف المجموعة.`)
            return
        }
    } catch (e) {}
    
    const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
    if (targetUser === botJid) {
        await m.reply(`❌ لا يمكن إنذار البوت.`)
        return
    }
    
    const reasonArg = m.quoted ? m.text?.trim() : m.text?.replace(/@\d+/g, '').replace(/^\s*انذار\s*/i, '').trim()
    const reason = reasonArg || 'بدون سبب'
    
    let userWarnings = warnings[targetUser] || []
    userWarnings.push({
        reason: reason,
        by: m.sender,
        time: Date.now()
    })
    
    warnings[targetUser] = userWarnings
    db.setGroup(m.chat, { ...groupData, warnings: warnings })
    
    const warnCount = userWarnings.length
    const targetName = targetUser.split('@')[0]
    
    if (warnCount >= maxWarns) {
        try {
            await sock.groupParticipantsUpdate(m.chat, [targetUser], 'remove')
            await m.reply(
                `🚨 *تم الوصول للحد الأقصى*\n\n` +
                `@${targetName} تم طرده من المجموعة لتجاوزه الحد!\n\n` +
                `*تفاصيل:*\n` +
                `> الإنذارات: *${warnCount}/${maxWarns}*\n` +
                `> السبب الأخير: *${reason}*`,
                { mentions: [targetUser] }
            )
            delete warnings[targetUser]
            db.setGroup(m.chat, { ...groupData, warnings: warnings })
        } catch (e) {
            m.reply(te(m.prefix, m.command, m.pushName))
        }
    } else {
        await m.reply(
            `⚠️ *تم إعطاء إنذار*\n\n` +
            `@${targetName} تلقى إنذار (${warnCount})!\n\n` +
            `*تفاصيل:*\n` +
            `> الإنذار رقم: *${warnCount}/${maxWarns}*\n` +
            `> السبب: *${reason}*\n\n` +
            `_متبقي ${maxWarns - warnCount} إنذارات = طرد تلقائي_`,
            { mentions: [targetUser] }
        )
    }
}

export { pluginConfig as config, handler }