import config from '../../config.js'
import te from '../../src/lib/maro-error.js'
const pluginConfig = {
    name: 'رابط_المجموعة',
    alias: ['linkgc'],
    category: 'group',
    description: 'الحصول على رابط دعوة المجموعة',
    usage: '.رابط_المجموعة',
    example: '.رابط_المجموعة',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

async function handler(m, { sock }) {
    m.react('🕕')
    
    try {
        const code = await sock.groupInviteCode(m.chat)
        const urlGrup = `https://chat.whatsapp.com/${code}`
        await m.reply(`رابط المجموعة:\n${urlGrup}`)
        
        m.react('✅')
        
    } catch (err) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }