const MUSIC_LIST = []
for (let i = 1; i <= 52; i++) {
    MUSIC_LIST.push(`موسيقى2-${i}`)
}

const pluginConfig = {
    name: 'موسيقى2',
    alias: MUSIC_LIST,
    category: 'media',
    description: 'مجموعة موسيقى 1-65',
    usage: '.موسيقى2-1 إلى .موسيقى2-65',
    example: '.موسيقى2-1',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock, command }) {
    const musicNum = m?.command.replace('موسيقى2-', '')
    const num = parseInt(musicNum)
    
    if (isNaN(num) || num < 1 || num > 65) {
        return m.reply(`🎵 *مجموعة الموسيقى*\n\n> المتاح: .موسيقى2-1 - .موسيقى2-65`)
    }
    
    m.react('🕕')
    
    const musicUrl = `https://raw.githubusercontent.com/Rez4-3yz/Music-rd/master/music/music${num}.mp3`
    try {
        await sock.sendMedia(m.chat, musicUrl, null, m, {
            type: 'audio',
            mimetype: 'audio/mpeg',
            ptt: false
        })
        
        m.react('✅')
        
    } catch (err) {
        m.react('❌')
        m.reply(`❌ *خطأ*\n\n> الموسيقى غير موجودة أو فشل التحميل.`)
    }
}

export { pluginConfig as config, handler }