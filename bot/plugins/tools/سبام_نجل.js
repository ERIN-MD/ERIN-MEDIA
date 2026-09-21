import axios from 'axios'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'سبام_نجل',
    alias: [],
    category: 'tools',
    description: 'إرسال سبام عبر NGL',
    usage: '.سبام_نجل <رابط> | <نص> | <عدد>',
    example: '.سبام_نجل https://ngl.link/xxxx | مرحباً | 10',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.text?.split('|')
    const [ link, kata, jumlah ] = text
    if(!link) return m.reply(`*أين رابط NGL؟*\nمثال: \`${m?.prefix}سبام_نجل https://ngl.link/xxxx | مرحباً | 10`)
    if(!kata) return m.reply(`*أين النص؟*\n\nمثال: \`${m?.prefix}سبام_نجل https://ngl.link/xxxx | مرحباً | 10`)
    if(!jumlah) return m.reply(`*أين العدد؟*\n\nمثال: \`${m?.prefix}سبام_نجل https://ngl.link/xxxx | مرحباً | 10`)
    if(isNaN(jumlah)) return m.reply(`*العدد يجب أن يكون رقماً*\n\nمثال: \`${m?.prefix}سبام_نجل https://ngl.link/xxxx | مرحباً | 10`)
    m.react('🎴')
    
    try {
        for(let i = 0; i < jumlah; i++) {
            axios.get(`https://api.cuki.biz.id/api/tools/sendngl?apikey=cuki-x&link=${encodeURIComponent(link)}&text=${encodeURIComponent(kata)}`, {
                timeout: 30000
            })
            await new Promise(resolve => setTimeout(resolve, 4000))
        }
        await m.react('✅')
        await sock.sendMessage(m.chat, {
            text: `✅ *تم*\n\nتم إرسال سبام NGL بنجاح!\nالهدف: ${link}\nالرسالة: ${kata} (${jumlah}x)`
        }, { quoted: m })
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }