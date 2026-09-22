// هذه المجموعة فقط - أمر لجعل البوت يعمل فقط في هذه المجموعة

import { getDatabase } from '../../src/lib/maro-database.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'هذه_المجموعة_فقط',
    alias: ['onlythisgrup'],
    category: 'owner',
    description: 'البوت يعمل فقط في هذه المجموعة',
    usage: '.هذه_المجموعة_فقط',
    example: '.هذه_المجموعة_فقط',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        const db = getDatabase()
        const current = db.setting('onlyThisGroup') || null

        if (current && (current === m.chat || current.jid === m.chat)) {
            db.setting('onlyThisGroup', null)
            db.save()
            return m.reply(`🔓 *تم الفتح*\n\nعاد البوت للعمل في جميع المجموعات بشكل علني.`)
        }

        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net'
        const groupMetadata = await sock.groupMetadata(m.chat).catch(() => null)
        
        if (!groupMetadata) {
            return m.reply(`❌ فشل الحصول على بيانات المجموعة.`)
        }

        const participants = groupMetadata.participants
        const isBotAdmin = participants.find(p => p.id === botNumber)?.admin !== null

        if (!isBotAdmin) {
            return m.reply(`❌ *تم رفض الوصول*\n\nيجب أن يكون البوت مشرفاً في هذه المجموعة أولاً ليتمكن من الحصول على رابط الدعوة.`)
        }

        const inviteCode = await sock.groupInviteCode(m.chat).catch(() => null)
        
        if (!inviteCode) {
            return m.reply(`❌ فشل الحصول على رابط الدعوة. تأكد من أن البوت مشرف صالح.`)
        }

        const inviteLink = `https://chat.whatsapp.com/${inviteCode}`
        const groupName = groupMetadata.subject

        db.setting('onlyThisGroup', {
            jid: m.chat,
            name: groupName,
            link: inviteLink
        })
        db.save()

        await m.reply(
            `🔒 *تم القفل بنجاح*\n\n` +
            `من الآن فصاعداً، البوت يعمل حصراً في المجموعة:\n` +
            `*${groupName}*\n\n` +
            `سيتم توجيه المستخدمين في المجموعات الأخرى للانضمام عبر الرابط:\n` +
            `${inviteLink}\n\n` +
            `اكتب \`.هذه_المجموعة_فقط\` مرة أخرى لفتح القفل.`
        )
    } catch (error) {
        console.error(error)
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }