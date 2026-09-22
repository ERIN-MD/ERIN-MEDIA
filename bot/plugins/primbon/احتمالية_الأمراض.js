// احتمالية_الأمراض - أمر لمعرفة احتمالية الأمراض حسب تاريخ الميلاد

import axios from 'axios'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'احتمالية_الأمراض',
    alias: ['potensipenyakit'],
    category: 'primbon',
    description: 'معرفة احتمالية الأمراض حسب تاريخ الميلاد',
    usage: '.احتمالية_الأمراض <اليوم> <الشهر> <السنة>',
    example: '.احتمالية_الأمراض 12 05 1998',
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
        return m.reply(`🏥 *احتمالية الأمراض*\n\n> الصيغة: اليوم الشهر السنة\n\n\`مثال: ${m.prefix}احتمالية_الأمراض 12 05 1998\``)
    }
    
    const [tgl, bln, thn] = m.args
    
    m.react('🏥')
    
    try {
        const url = `https://api.siputzx.my.id/api/primbon/cek_potensi_penyakit?tgl=${tgl}&bln=${bln}&thn=${thn}`
        const { data } = await axios.get(url, { timeout: 30000 })
        
        if (!data?.status || !data?.data) {
            m.react('❌')
            return m.reply(`❌ *فشل*\n\n> فشل التحليل`)
        }
        
        const result = data.data
        const response = `🏥 *احتمالية الأمراض*\n\n` +
            `> التاريخ: *${tgl}-${bln}-${thn}*\n\n` +
            `📊 *العناصر:*\n${result.sektor}\n\n` +
            `⚠️ *الاحتمالات:*\n${result.elemen}\n\n` +
            `> _${result.catatan}_`
        
        m.react('✅')
        await m.reply(response)
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }