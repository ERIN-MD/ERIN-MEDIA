import te from '../../src/lib/maro-error.js'
const pluginConfig = {
    name: ['تنظيف_المحادثة', 'تنظيف_الشات'],
    alias: ['clearchat'],
    category: 'group',
    description: 'تنظيف محادثة المجموعة',
    usage: '.تنظيف_المحادثة أو .تنظيف_الشات',
    example: '.تنظيف_المحادثة',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    isBotAdmin: true,
    cooldown: 60,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    m.react('🗑️')
    
    try {
        const now = Math.floor(Date.now() / 1000)
        
        await sock.chatModify({ 
            delete: true, 
            lastMessages: [{ 
                key: m.key, 
                messageTimestamp: m.messageTimestamp || now
            }] 
        }, m.chat)
        
        await m.reply(`✅ *تم تنظيف المحادثة*\n\n> تم تنظيف محادثة المجموعة بواسطة @${m.sender.split('@')[0]}`, { mentions: [m.sender] })
        
    } catch (error) {
        try {
            await sock.chatModify({ 
                clear: { 
                    messages: [{ 
                        id: m.key.id, 
                        fromMe: m.key.fromMe,
                        timestamp: Math.floor(Date.now() / 1000)
                    }] 
                } 
            }, m.chat)
            
            await m.reply(`✅ *تم تنظيف المحادثة*\n\nتم تنظيف محادثة المجموعة بواسطة @${m.sender.split('@')[0]}\nتحقق من واتسابك`, { mentions: [m.sender] })
        } catch (e) {
            m.react('☢')
            m.reply(te(m.prefix, m.command, m.pushName))
        }
    }
}

export { pluginConfig as config, handler }