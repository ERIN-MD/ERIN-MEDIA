// معنى_الاسم - أمر لمعرفة معنى الاسم حسب علم التنجيم الجاوي

import axios from 'axios'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'معنى_الاسم',
    alias: ['artinama'],
    category: 'primbon',
    description: 'معرفة معنى الاسم حسب علم التنجيم الجاوي',
    usage: '.معنى_الاسم <الاسم>',
    example: '.معنى_الاسم محمد',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const nama = m.args.join(' ')
    if (!nama) {
        return m.reply(`📛 *معنى الاسم*\n\n> أدخل الاسم\n\n\`مثال: ${m.prefix}معنى_الاسم محمد\``)
    }
    
    m.react('📛')
    
    try {
        const url = `https://api.siputzx.my.id/api/primbon/artinama?nama=${encodeURIComponent(nama)}`
        const { data } = await axios.get(url, { timeout: 30000 })
        
        if (!data?.status || !data?.data) {
            m.react('❌')
            return m.reply(`❌ *فشل*\n\n> لا يمكن تحليل الاسم`)
        }
        
        const result = data.data
        const response = `📛 *معنى الاسم*\n\n` +
            `> الاسم: *${result.nama}*\n\n` +
            `${result.arti}\n\n` +
            `> _${result.catatan}_`
        
        m.react('✅')
        await m.reply(response)
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }