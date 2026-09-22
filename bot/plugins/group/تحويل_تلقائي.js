import config from '../../config.js'
import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'تحويل_تلقائي',
    alias: ['automedia'],
    category: 'group',
    description: 'تحويل الملصقات تلقائياً إلى صور/فيديو',
    usage: '.تحويل_تلقائي تشغيل/إيقاف',
    example: '.تحويل_تلقائي تشغيل',
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
    const current = groupData.automedia ?? false
    const arg = args[0]?.toLowerCase()
    
    if (!arg) {
        const status = current ? '✅ مفعل' : '❌ معطل'
        return m.reply(
            `🎬 *التحويل التلقائي*\n\n` +
            `> الحالة: ${status}\n\n` +
            `> استخدم:\n` +
            `> \`${m.prefix}تحويل_تلقائي تشغيل\` - تفعيل\n` +
            `> \`${m.prefix}تحويل_تلقائي إيقاف\` - تعطيل\n\n` +
            `> _يحول الملصقات تلقائياً إلى صور_`
        )
    }
    
    if (arg === 'تشغيل' || arg === 'on' || arg === '1' || arg === 'تفعيل') {
        if (current) { return m.reply(`🎬 *التحويل التلقائي*\n\n> مفعل بالفعل!`) }
        db.setGroup(m.chat, { automedia: true })
        await db.save()
        return m.reply(`🎬 *التحويل التلقائي*\n\n> ✅ تم التفعيل!\n> سيتم تحويل الملصقات تلقائياً إلى صور/فيديو`)
    }
    
    if (arg === 'ايقاف' || arg === 'off' || arg === '0' || arg === 'تعطيل') {
        if (!current) { return m.reply(`🎬 *التحويل التلقائي*\n\n> معطل بالفعل!`) }
        db.setGroup(m.chat, { automedia: false })
        await db.save()
        return m.reply(`🎬 *التحويل التلقائي*\n\n> ❌ تم التعطيل!`)
    }
    
    return m.reply(`❌ استخدم: \`${m.prefix}تحويل_تلقائي تشغيل/إيقاف\``)
}

async function autoMediaHandler(m, sock) {
    try {
        if (!m) return false
        if (!m.isGroup) return false
        if (m.isCommand) return false
        if (m.fromMe === true) return false
        
        const db = getDatabase()
        const groupData = db.getGroup(m.chat) || {}
        
        if (!groupData.automedia) return false
        
        const msg = m.message
        if (!msg) return false
        
        const hasSticker = msg.stickerMessage
        if (!hasSticker) return false
        
        if (hasSticker.isAnimated) return false
        
        const buffer = await m.download()
        if (!buffer || buffer.length === 0) return false
        
        await sock.sendMedia(m.chat, buffer, null, m, { type: 'image' })
        
        return true
    } catch (err) {
        return false
    }
}

export { pluginConfig as config, handler, autoMediaHandler }