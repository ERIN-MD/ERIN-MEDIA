// تفسير_الأحلام - أمر لمعرفة تفسير الأحلام

import axios from 'axios'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'تفسير_الأحلام',
    alias: ['tafsirmimpi'],
    category: 'primbon',
    description: 'معرفة تفسير الأحلام',
    usage: '.تفسير_الأحلام <الكلمة_المفتاحية>',
    example: '.تفسير_الأحلام لقاء',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const keyword = m.args.join(' ')
    if (!keyword) {
        return m.reply(`🌙 *تفسير الأحلام*\n\n> أدخل الكلمة المفتاحية للحلم\n\n\`مثال: ${m.prefix}تفسير_الأحلام لقاء\``)
    }
    
    m.react('🌙')
    
    try {
        const url = `https://api.siputzx.my.id/api/primbon/tafsirmimpi?mimpi=${encodeURIComponent(keyword)}`
        const { data } = await axios.get(url, { timeout: 30000 })
        
        if (!data?.status || !data?.data?.hasil?.length) {
            m.react('❌')
            return m.reply(`❌ *فشل*\n\n> لم يتم العثور على تفسير لـ: ${keyword}`)
        }
        
        const r = data.data
        let response = `🌙 *تفسير الأحلام*\n\n`
        response += `> الكلمة المفتاحية: *${r.keyword}*\n`
        response += `> تم العثور على: *${r.total} نتيجة*\n\n`
        
        r.hasil.slice(0, 10).forEach((h, i) => {
            response += `*${i+1}. ${h.mimpi}*\n> ${h.tafsir}\n\n`
        })
        
        if (r.total > 10) {
            response += `_...و ${r.total - 10} نتيجة أخرى_`
        }
        
        m.react('✅')
        await m.reply(response)
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }