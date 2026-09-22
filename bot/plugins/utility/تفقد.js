import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: "تفقد",
    alias: ["inspect"],
    category: 'utility',
    description: 'عرض معلومات المجموعة أو القناة عبر رابط واتساب',
    usage: '.تفقد <رابط المجموعة/القناة>',
    example: '.تفقد https://chat.whatsapp.com/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.text?.trim()

    if (!text) {
        return m.reply(
            `🔍 *تفقد*\n\n` +
            `> عرض معلومات المجموعة أو القناة عبر الرابط\n\n` +
            `*مثال:*\n` +
            `> \`${m.prefix}تفقد https://chat.whatsapp.com/xxx\`\n` +
            `> \`${m.prefix}تفقد https://whatsapp.com/channel/xxx\``
        )
    }

    const grupPattern = /chat\.whatsapp\.com\/([\w\d]*)/
    const saluranPattern = /whatsapp\.com\/channel\/([\w\d]*)/

    m.react('🔍')

    try {
        if (grupPattern.test(text)) {
            const inviteCode = text.match(grupPattern)[1]
            
            const groupInfo = await sock.groupGetInviteInfo(inviteCode)
            
            let teks = 
                `📋 *معلومات المجموعة*\n\n` +
                `╭┈┈⬡「 📊 *التفاصيل* 」\n` +
                `┃ 📝 الاسم: *${groupInfo.subject}*\n` +
                `┃ 🆔 المعرف: \`${groupInfo.id}\`\n` +
                `┃ 📅 تاريخ الإنشاء: ${new Date(groupInfo.creation * 1000).toLocaleString('ar-SA')}\n`

            if (groupInfo.owner) {
                teks += `┃ 👑 المنشئ: @${groupInfo.owner.split('@')[0]}\n`
            }

            teks += 
                `┃ 🔗 المجموعة الرئيسية: ${groupInfo.linkedParent || 'لا يوجد'}\n` +
                `┃ 🔒 تقييد: ${groupInfo.restrict ? '✅' : '❌'}\n` +
                `┃ 📢 إعلان: ${groupInfo.announce ? '✅' : '❌'}\n` +
                `┃ 🏘️ مجتمع: ${groupInfo.isCommunity ? '✅' : '❌'}\n` +
                `┃ 📣 إعلان المجتمع: ${groupInfo.isCommunityAnnounce ? '✅' : '❌'}\n` +
                `┃ ✅ موافقة الانضمام: ${groupInfo.joinApprovalMode ? '✅' : '❌'}\n` +
                `┃ ➕ وضع إضافة الأعضاء: ${groupInfo.memberAddMode ? '✅' : '❌'}\n` +
                `┃ 👥 الأعضاء: ${groupInfo.participants?.length || 0}\n` +
                `╰┈┈⬡\n\n`

            if (groupInfo.desc) {
                teks += `📝 *الوصف:*\n${groupInfo.desc}\n\n`
            }

            if (groupInfo.participants?.length > 0) {
                const admins = groupInfo.participants.filter(p => p.admin)
                if (admins.length > 0) {
                    teks += `👑 *المشرفين:*\n`
                    admins.forEach(a => {
                        teks += `├ @${a.id.split('@')[0]} [${a.admin}]\n`
                    })
                    teks += `╰┈┈⬡`
                }
            }

            const mentions = []
            if (groupInfo.owner) mentions.push(groupInfo.owner)
            if (groupInfo.participants) {
                groupInfo.participants.filter(p => p.admin).forEach(a => mentions.push(a.id))
            }

            m.react('✅')
            return sock.sendMessage(m.chat, { text: teks, mentions }, { quoted: m })

        } else if (saluranPattern.test(text) || text.endsWith('@newsletter') || !isNaN(text)) {
            const channelId = saluranPattern.test(text) ? text.match(saluranPattern)[1] : text
            
            const channelInfo = await sock.newsletterMsg(channelId)
            
            const teks = 
                `📺 *معلومات القناة*\n\n` +
                `╭┈┈⬡「 📊 *التفاصيل* 」\n` +
                `┃ 🆔 المعرف: \`${channelInfo.id}\`\n` +
                `┃ 📌 الحالة: ${channelInfo.state?.type || '-'}\n` +
                `┃ 📝 الاسم: *${channelInfo.thread_metadata?.name?.text || '-'}*\n` +
                `┃ 📅 تاريخ الإنشاء: ${new Date((channelInfo.thread_metadata?.creation_time || 0) * 1000).toLocaleString('ar-SA')}\n` +
                `┃ 👥 المشتركين: ${channelInfo.thread_metadata?.subscribers_count || 0}\n` +
                `┃ ✅ التوثيق: ${channelInfo.thread_metadata?.verification || '-'}\n` +
                `╰┈┈⬡\n\n` +
                `📝 *الوصف:*\n${channelInfo.thread_metadata?.description?.text || 'لا يوجد وصف'}`

            m.react('✅')
            return m.reply(teks)

        } else {
            return m.reply('❌ فقط روابط المجموعات أو القنوات في واتساب مدعومة!')
        }

    } catch (error) {
        m.react('❌')
        
        if (error.data) {
            if ([400, 406].includes(error.data)) {
                return m.reply('❌ المجموعة/القناة غير موجودة!')
            }
            if (error.data === 401) {
                return m.reply('❌ تم طرد البوت من هذه المجموعة!')
            }
            if (error.data === 410) {
                return m.reply('❌ تم إعادة تعيين رابط المجموعة!')
            }
        }
        
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }