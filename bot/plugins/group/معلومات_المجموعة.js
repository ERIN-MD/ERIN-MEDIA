import axios from 'axios'
import { getParticipantJid, resolveAnyLidToJid } from '../../src/lib/maro-lid.js'
import * as timeHelper from '../../src/lib/maro-time.js'
import te from '../../src/lib/maro-error.js'
const pluginConfig = {
    name: 'معلومات_المجموعة',
    alias: ['groupinfo'],
    category: 'group',
    description: 'عرض معلومات المجموعة الكاملة',
    usage: '.معلومات_المجموعة',
    example: '.معلومات_المجموعة',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true,
    isAdmin: false,
    isBotAdmin: false
}

function featureStatus(val) {
    if (val === true || val === 'on') return '✅'
    return '❌'
}

async function handler(m, { sock, db }) {
    try {
        const groupMeta = m.groupMetadata
        const participants = groupMeta.participants || []
        const admins = participants.filter(p => p.admin)

        let ownerJid = null
        if (groupMeta.owner) ownerJid = resolveAnyLidToJid(groupMeta.owner, participants)
        if (!ownerJid || ownerJid.includes('@lid')) {
            const superAdmin = participants.find(p => p.admin === 'superadmin')
            if (superAdmin) ownerJid = getParticipantJid(superAdmin)
        }
        if (!ownerJid || ownerJid.includes('@lid')) {
            const firstAdmin = admins[0]
            if (firstAdmin) ownerJid = getParticipantJid(firstAdmin)
        }

        const group = db.getGroup(m.chat) || {}

        const createdDate = groupMeta.creation
            ? timeHelper.fromTimestamp(groupMeta.creation * 1000, 'D MMMM YYYY')
            : 'غير معروف'

        const ownerNumber = ownerJid ? ownerJid.split('@')[0] : null
        const ownerDisplay = ownerNumber && !ownerNumber.includes(':')
            ? `@${ownerNumber}`
            : 'غير معروف'

        let ppUrl = null
        try {
            ppUrl = await sock.profilePictureUrl(m.chat)
        } catch {}

        const isOpen = groupMeta.announce === false || !groupMeta.announce

        let text = `👥 *معلومات المجموعة*\n\n`
        text += `📛 *الاسم:* ${groupMeta.subject}\n`
        text += `🆔 *المعرف:* ${m.chat}\n`
        text += `👑 *المالك:* ${ownerDisplay}\n`
        text += `📅 *أنشئت:* ${createdDate}\n`
        text += `🔓 *الحالة:* ${isOpen ? 'مفتوحة' : 'مغلقة'}\n\n`

        text += `📊 *الأعضاء*\n`
        text += `👥 *الإجمالي:* ${participants.length}\n`
        text += `🛡️ *المشرفين:* ${admins.length}\n`
        text += `👤 *الأعضاء:* ${participants.length - admins.length}\n\n`

        text += `🔧 *الميزات النشطة*\n`
        text += `ترحيب: ${featureStatus(group.welcome)}\n`
        text += `وداع: ${featureStatus(group.goodbye)}\n`
        text += `رد_تلقائي: ${featureStatus(group.autoreply)}\n`
        text += `ذكاء_تلقائي: ${featureStatus(group.autoai)}\n`
        text += `تحميل_تلقائي: ${featureStatus(group.autodl)}\n`
        text += `ملصق_تلقائي: ${featureStatus(group.autosticker)}\n`
        text += `تحويل_تلقائي: ${featureStatus(group.automedia)}\n\n`

        text += `🛡️ *الحماية*\n`
        text += `منع_الروابط: ${featureStatus(group.antilink)}\n`
        text += `منع_البوتات: ${featureStatus(group.antibot)}\n`
        text += `منع_الكلمات: ${featureStatus(group.antitoxic)}\n`
        text += `منع_الحذف: ${featureStatus(group.antiremove)}\n`
        text += `منع_الاختفاء: ${featureStatus(group.antihidetag)}\n`
        text += `منع_الملصقات: ${featureStatus(group.antisticker)}\n`
        text += `منع_الوسائط: ${featureStatus(group.antimedia)}\n`
        text += `منع_المستندات: ${featureStatus(group.antidocument)}`

        if (groupMeta.desc) {
            text += `\n\n📝 *الوصف*\n${groupMeta.desc}`
        }

        const mentions = ownerJid && !ownerJid.includes(':') ? [ownerJid] : []

        if (ppUrl) {
            try {
                const ppBuffer = Buffer.from((await axios.get(ppUrl, { responseType: 'arraybuffer', timeout: 10000 })).data)
                await sock.sendMessage(m.chat, {
                    image: ppBuffer,
                    caption: text,
                    mentions
                }, { quoted: m })
            } catch {
                await m.reply(text, { mentions })
            }
        } else {
            await m.reply(text, { mentions })
        }
    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }