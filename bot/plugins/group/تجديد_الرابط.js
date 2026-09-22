import te from '../../src/lib/maro-error.js'
const pluginConfig = {
    name: 'تجديد_الرابط',
    alias: ['resetlinkgc'],
    category: 'group',
    description: 'تجديد رابط دعوة المجموعة',
    usage: '.تجديد_الرابط',
    example: '.تجديد_الرابط',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 60,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

async function handler(m, { sock }) {
    m.react('🔄')
    
    try {
        await sock.groupRevokeInvite(m.chat)
        
        m.react('✅')
        m.reply(`✅ *تم تجديد الرابط*\nالرابط القديم لم يعد صالحاً.\nاستخدم \`${m.prefix}رابط_المجموعة\` للحصول على الرابط الجديد.`)
        
    } catch (err) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }