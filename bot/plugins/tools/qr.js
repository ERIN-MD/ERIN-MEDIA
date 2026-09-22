const pluginConfig = {
    name: ['رمز_QR', 'qr'],
    alias: ['qrcode'],
    category: 'tools',
    description: 'إنشاء رمز QR',
    usage: '.رمز_QR <رابط/نص>',
    example: '.رمز_QR https://wa.me/628xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

const QR_API_URL = 'https://api.qrserver.com/v1/create-qr-code/'

async function handler(m, { sock }) {
    const data = m.text?.trim()
    
    if (!data) {
        return m.reply(
            `⚠️ *طريقة الاستخدام*\n\n` +
            `> \`${m.prefix}رمز_QR <رابط/نص>\`\n\n` +
            `*مثال:*\n` +
            `> \`${m.prefix}رمز_QR https://wa.me/628xxx\``
        )
    }
    
    await m.react('⏳')
    
    try {
        const params = new URLSearchParams({
            data: data,
            format: 'png',
            size: '300x300',
            qzone: '1'
        })
        const apiUrl = `${QR_API_URL}?${params.toString()}`
        
        await sock.sendMessage(m.chat, {
            image: { url: apiUrl },
            caption: `📱 *رمز QR*\n> ${data.substring(0, 50)}${data.length > 50 ? '...' : ''}`
        }, { quoted: m })
        
        m.react('📱')
        
    } catch (err) {
        console.error('QR Error:', err)
        return m.react('❌')
    }
}

export { pluginConfig as config, handler }
