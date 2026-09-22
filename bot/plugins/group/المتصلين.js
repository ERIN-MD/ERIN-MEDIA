import te from '../../src/lib/maro-error.js'
const pluginConfig = {
    name: 'المتصلين',
    alias: ['cekonline'],
    category: 'group',
    description: 'كشف الأعضاء المتصلين في المجموعة',
    usage: '.المتصلين',
    example: '.المتصلين',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 60,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    m.react('🔍')
    
    try {
        const groupMetadata = m.groupMetadata
        const participants = m.groupMembers
        
        if (participants.length === 0) {
            m.react('❌')
            return m.reply(`❌ *فشل*\n\n> لا يمكن الحصول على بيانات أعضاء المجموعة`)
        }
        
        await m.reply(`🔍 *جاري البحث عن المتصلين...*\n\n> في انتظار الرد من ${participants.length} عضو\n> الوقت المتوقع: 5-10 ثواني`)
        
        const presences = {}
        
        const presenceHandler = (update) => {
            if (update.id === m.chat && update.presences) {
                for (const [jid, presence] of Object.entries(update.presences)) {
                    if (presence.lastKnownPresence === 'available' || 
                        presence.lastKnownPresence === 'composing' || 
                        presence.lastKnownPresence === 'recording') {
                        presences[jid] = presence.lastKnownPresence
                    }
                }
            }
        }
        
        sock.ev.on('presence.update', presenceHandler)
        
        const batchSize = 10
        for (let i = 0; i < participants.length; i += batchSize) {
            const batch = participants.slice(i, i + batchSize)
            await Promise.all(batch.map(p => 
                sock.presenceSubscribe(p.id).catch(() => {})
            ))
            await new Promise(resolve => setTimeout(resolve, 500))
        }
        
        await new Promise(resolve => setTimeout(resolve, 5000))
        
        sock.ev.off('presence.update', presenceHandler)
        
        const onlineMembers = Object.keys(presences)
        const mentions = onlineMembers
        
        let text = `📊 *المتصلين*\n\n`
        text += `╭┈┈⬡「 📋 *معلومات المجموعة* 」\n`
        text += `┃ 👥 الاسم: *${groupMetadata.subject}*\n`
        text += `┃ 👤 المجموع: \`${participants.length}\` عضو\n`
        text += `┃ 🟢 متصل: \`${onlineMembers.length}\` عضو\n`
        text += `╰┈┈⬡\n\n`
        
        if (onlineMembers.length === 0) {
            text += `> _لا يوجد أعضاء متصلين حالياً_\n`
            text += `> _تأكد من فتح الأعضاء للواتساب_`
        } else {
            text += `╭┈┈⬡「 🟢 *الأعضاء المتصلين* 」\n`
            
            let count = 0
            for (const jid of onlineMembers) {
                if (count >= 50) {
                    text += `┃ ... و ${onlineMembers.length - 50} عضو آخر\n`
                    break
                }
                const number = jid.split('@')[0]
                const participant = participants.find(p => p.id === jid)
                const isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin'
                const adminBadge = isAdmin ? ' 👑' : ''
                
                let statusIcon = '🟢'
                if (presences[jid] === 'composing') statusIcon = '⌨️'
                if (presences[jid] === 'recording') statusIcon = '🎤'
                
                text += `┃ ${statusIcon} @${number}${adminBadge}\n`
                count++
            }
            
            text += `╰┈┈⬡\n\n`
            text += `> 🟢 متصل | ⌨️ يكتب | 🎤 يسجل صوت`
        }
        
        m.react('✅')
        await m.reply(text, { mentions: mentions })
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }