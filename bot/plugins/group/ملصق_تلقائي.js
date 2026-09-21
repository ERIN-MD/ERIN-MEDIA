import config from '../../config.js'
import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'ملصق_تلقائي',
    alias: ['autosticker'],
    category: 'group',
    description: 'تحويل الصور والفيديوهات تلقائياً إلى ملصقات',
    usage: '.ملصق_تلقائي تشغيل/إيقاف',
    example: '.ملصق_تلقائي تشغيل',
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
    const args = m.args || []
    const groupData = db.getGroup(m.chat) || {}
    const current = groupData.autosticker ?? false
    const arg = args[0]?.toLowerCase()
    
    if (!arg) {
        const status = current ? '✅ مفعل' : '❌ معطل'
        return m.reply(
            `🖼️ *الملصق التلقائي*\n\n` +
            `> الحالة: ${status}\n\n` +
            `> استخدم:\n` +
            `> \`${m.prefix}ملصق_تلقائي تشغيل\` - تفعيل\n` +
            `> \`${m.prefix}ملصق_تلقائي إيقاف\` - تعطيل\n\n` +
            `> _يحول الصور والفيديوهات تلقائياً إلى ملصقات_`
        )
    }
    
    if (arg === 'تشغيل' || arg === 'on' || arg === '1' || arg === 'تفعيل') {
        if (current) { return m.reply(`🖼️ *الملصق التلقائي*\n\n> مفعل بالفعل!`) }
        db.setGroup(m.chat, { autosticker: true })
        await db.save()
        return m.reply(`🖼️ *الملصق التلقائي*\n\n> ✅ تم التفعيل!\n> سيتم تحويل الصور والفيديوهات تلقائياً إلى ملصقات`)
    }
    
    if (arg === 'ايقاف' || arg === 'off' || arg === '0' || arg === 'تعطيل') {
        if (!current) { return m.reply(`🖼️ *الملصق التلقائي*\n\n> معطل بالفعل!`) }
        db.setGroup(m.chat, { autosticker: false })
        await db.save()
        return m.reply(`🖼️ *الملصق التلقائي*\n\n> ❌ تم التعطيل!`)
    }
    
    return m.reply(`❌ استخدم: \`${m.prefix}ملصق_تلقائي تشغيل/إيقاف\``)
}

async function autoStickerHandler(m, sock) {
    try {
        if (!m) return false
        if (!m.isGroup) return false
        if (m.isCommand) return false
        if (m.fromMe === true) return false
        
        const db = getDatabase()
        const groupData = db.getGroup(m.chat) || {}
        
        if (!groupData.autosticker) return false
        
        const msg = m.message
        if (!msg) return false
        
        const type = Object.keys(msg)[0]
        const content = msg[type]

        const isImage = type === 'imageMessage' || 
                        (type === 'viewOnceMessage' && content?.message?.imageMessage) ||
                        (type === 'viewOnceMessageV2' && content?.message?.imageMessage)
        
        const isVideo = type === 'videoMessage' ||
                        (type === 'viewOnceMessage' && content?.message?.videoMessage) ||
                        (type === 'viewOnceMessageV2' && content?.message?.videoMessage)
        
        if (!isImage && !isVideo) return false
        
        const buffer = await m.download()
        if (!buffer || buffer.length === 0) return false
        
        if (buffer.length > 10 * 1024 * 1024) return false
        
        if (isImage) {
            await sock.sendImageAsSticker(m.chat, buffer, m, {
                packname: config.sticker?.packname || 'Maro',
                author: config.sticker?.author || 'Bot'
            })
        } else if (isVideo) {
            const videoMsg = msg.videoMessage || content?.message?.videoMessage
            const duration = videoMsg?.seconds || 0
            if (duration > 10) return false
            
            await sock.sendVideoAsSticker(m.chat, buffer, m, {
                packname: config.sticker?.packname || 'Maro',
                author: config.sticker?.author || 'Bot'
            })
        }
        
        return true
    } catch (err) {
        return false
    }
}

export { pluginConfig as config, handler, autoStickerHandler }