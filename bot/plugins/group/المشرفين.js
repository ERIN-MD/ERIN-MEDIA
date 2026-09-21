import { getParticipantJid } from '../../src/lib/maro-lid.js'
import te from '../../src/lib/maro-error.js'
const pluginConfig = {
    name: 'المشرفين',
    alias: ['listadmin'],
    category: 'group',
    description: 'عرض قائمة مشرفي المجموعة',
    usage: '.المشرفين',
    example: '.المشرفين',
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

async function handler(m, { sock }) {
    try {
        const groupMeta = m.groupMetadata
        const participants = groupMeta.participants || []
        const admins = participants.filter(p => p.admin)

        if (admins.length === 0) {
            await m.reply(`❌ *فشل*\n\n> لا يوجد مشرفين في هذه المجموعة.`)
            return
        }

        const owner = admins.find(a => a.admin === 'superadmin')
        const regularAdmins = admins.filter(a => a.admin === 'admin')

        let adminList = `👑 *قائمة المشرفين*\n\n`

        if (owner) {
            adminList += `═══ المالك ═══\n`
            adminList += `👑 @${getParticipantJid(owner).split('@')[0]}\n\n`
        }

        if (regularAdmins.length > 0) {
            adminList += `═══ المشرفين ═══\n`
            regularAdmins.forEach((admin, i) => {
                adminList += `${i + 1}. @${getParticipantJid(admin).split('@')[0]}\n`
            })
        }
        adminList += `\nإجمالي المشرفين: ${admins.length}`

        const mentions = admins.map(a => getParticipantJid(a))

        await m.reply(adminList, { mentions })

    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }