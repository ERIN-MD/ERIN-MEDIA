import config from '../../config.js'
import te from '../../src/lib/maro-error.js'
const pluginConfig = {
    name: 'إعادة_توجيه',
    alias: ['totag'],
    category: 'group',
    description: 'إعادة توجيه رسالة مع منشن لجميع الأعضاء',
    usage: '.إعادة_توجيه (رد على رسالة)',
    example: '.إعادة_توجيه',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 30,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

async function handler(m, { sock }) {
    if (!m.quoted) {
        return m.reply(
            `📢 *إعادة توجيه*\n\n` +
            `> رد على الرسالة التي تريد إعادة توجيهها لجميع الأعضاء\n\n` +
            `> مثال: رد على رسالة ثم اكتب \`${m.prefix}إعادة_توجيه\``
        )
    }
    
    m.react('📢')
    
    try {
        const participants = m.groupMembers || []
        
        if (!participants || participants.length === 0) {
            return m.reply(`❌ فشل الحصول على بيانات أعضاء المجموعة`)
        }
        
        const users = participants
            .map(u => u.id || u.jid || u)
            .filter(v => v && v !== sock.user?.jid && v !== sock.user?.id)
        
        await sock.sendMessage(m.chat, {
            forward: m.quoted.fakeObj || m.quoted,
            mentions: users
        })
        
        m.react('✅')
        
    } catch (err) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }