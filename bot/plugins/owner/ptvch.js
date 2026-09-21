// إرسال PTV للقناة - أمر لإرسال فيديو كـ PTV إلى القناة

import config from '../../config.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'ptvch',
    alias: ['ptvchanel', 'ptvstory'],
    category: 'owner',
    description: 'إرسال فيديو كـ PTV إلى القناة',
    usage: '.ptvch (رد على فيديو)',
    example: '.ptvch',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    let video = null
    
    if (m.quoted && m.quoted.isVideo) {
        try {
            video = await m.quoted.download()
        } catch (e) {
            return m.reply(`❌ فشل تحميل الفيديو من الرد.`)
        }
    } else if (m.isVideo) {
        try {
            video = await m.download()
        } catch (e) {
            return m.reply(`❌ فشل تحميل الفيديو.`)
        }
    }
    
    if (!video) {
        return m.reply(
            `⚠️ *طريقة الاستخدام*\n\n` +
            `> أرسل *فيديو* أو *رد على فيديو* ثم اكتب:\n` +
            `> \`${m.prefix}ptvch\``
        )
    }
    
    const channelId = config.saluran?.id || '120363404849776664@newsletter'
    
    await m.reply(`🕕 *جاري إرسال PTV إلى القناة...*`)
    
    try {
        await sock.sendMessage(channelId, {
            video: video,
            mimetype: 'video/mp4',
            gifPlayback: true,
            ptv: true
        })
        
        await m.react('✅')
        return m.reply(`✅ *تم بنجاح*\n\n> تم إرسال الفيديو إلى القناة كـ PTV.`)
        
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }