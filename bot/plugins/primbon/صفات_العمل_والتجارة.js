// صفات_العمل_والتجارة - أمر لمعرفة صفات العمل/التجارة حسب تاريخ الميلاد

import axios from 'axios'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'صفات_العمل_والتجارة',
    alias: ['sifatusahabisnis'],
    category: 'primbon',
    description: 'معرفة صفات العمل/التجارة حسب تاريخ الميلاد',
    usage: '.صفات_العمل_والتجارة <اليوم> <الشهر> <السنة>',
    example: '.صفات_العمل_والتجارة 1 1 2000',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    if (m.args.length < 3) {
        return m.reply(`💼 *صفات العمل/التجارة*\n\n> الصيغة: اليوم الشهر السنة\n\n\`مثال: ${m.prefix}صفات_العمل_والتجارة 1 1 2000\``)
    }
    
    const [tgl, bln, thn] = m.args
    
    m.react('💼')
    
    try {
        const url = `https://api.siputzx.my.id/api/primbon/sifat_usaha_bisnis?tgl=${tgl}&bln=${bln}&thn=${thn}`
        const { data } = await axios.get(url, { timeout: 30000 })
        
        if (!data?.status || !data?.data) {
            m.react('❌')
            return m.reply(`❌ *فشل*\n\n> فشل التحليل`)
        }
        
        const r = data.data
        const response = `💼 *صفات العمل/التجارة*\n\n` +
            `> تاريخ الميلاد: *${r.hari_lahir}*\n\n` +
            `📊 *التحليل:*\n${r.usaha}\n\n` +
            `> _${r.catatan}_`
        
        m.react('✅')
        await m.reply(response)
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }