import config from '../../config.js'
import fs from 'fs'
import te from '../../src/lib/maro-error.js'

const sadCommands = ['موسيقى']
for (let i = 1; i <= 52; i++) {
    sadCommands.push(`موسيقى${i}`)
}

const pluginConfig = {
    name: sadCommands,
    alias: ['mengkane'],
    category: 'media',
    description: 'إرسال موسيقى (موسيقى1 - موسيقى52)',
    usage: '.موسيقى1 أو .موسيقى52',
    example: '.موسيقى1',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const command = m.command?.toLowerCase()
    
    if (command === 'موسيقى' || command === 'mengkane' || !command.startsWith('موسيقى')) {
        if (command.startsWith('mengkane')) {
            const num = parseInt(command.replace('mengkane', ''))
            if (!isNaN(num) && num >= 1 && num <= 52) {
                return playMusic(m, sock, num, 'mengkane')
            }
        }
        if (command === 'موسيقى' || command === 'mengkane') {
            return m.reply(
                `🎵 *موسيقى*\n\n` +
                `> المتاح: موسيقى1 - موسيقى52\n` +
                `> مثال: \`${m.prefix}موسيقى1\``
            )
        }
        return
    }
    
    let num
    if (command.startsWith('موسيقى')) {
        num = parseInt(command.replace('موسيقى', ''))
    }
    
    if (isNaN(num) || num < 1 || num > 52) {
        return m.reply(`❌ اختيار غير صالح. استخدم موسيقى1 إلى موسيقى52.`)
    }
    
    return playMusic(m, sock, num, 'mangkane')
}

async function playMusic(m, sock, num, prefix) {
    m.react('🕕')
    try {
        const fixcmd = `${prefix}${num}`
        let sound
        if (num < 25) sound = `https://raw.githubusercontent.com/hyuura/Rest-Sound/main/HyuuraKane/${fixcmd}.mp3`
        if (num > 24) sound = `https://raw.githubusercontent.com/aisyah-rest/mangkane/main/Mangkanenya/${fixcmd}.mp3`
        await sock.sendMedia(m.chat, sound, null, m, {
            type: 'audio',
            mimetype: 'audio/mpeg',
            ptt: false
        })
    } catch (err) {
        console.log(err)
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }