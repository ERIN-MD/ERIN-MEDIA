// توافق_الأسماء - أمر لمعرفة توافق أسماء الأزواج

import axios from 'axios'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'توافق_الأسماء',
    alias: ['kecocokannamapasangan'],
    category: 'primbon',
    description: 'معرفة توافق أسماء الأزواج',
    usage: '.توافق_الأسماء <الاسم1> <الاسم2>',
    example: '.توافق_الأسماء محمد سارة',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    if (m.args.length < 2) {
        return m.reply(`💕 *توافق الأسماء*\n\n> الصيغة: الاسم1 الاسم2\n\n\`مثال: ${m.prefix}توافق_الأسماء محمد سارة\``)
    }
    
    const [nama1, nama2] = m.args
    
    m.react('💕')
    
    try {
        const url = `https://api.siputzx.my.id/api/primbon/kecocokan_nama_pasangan?nama1=${encodeURIComponent(nama1)}&nama2=${encodeURIComponent(nama2)}`
        const { data } = await axios.get(url, { timeout: 30000 })
        
        if (!data?.status || !data?.data) {
            m.react('❌')
            return m.reply(`❌ *فشل*\n\n> فشل التحليل`)
        }
        
        const result = data.data
        const response = `💕 *توافق أسماء الأزواج*\n\n` +
            `> 👤 ${result.nama_anda}\n` +
            `> 💑 ${result.nama_pasangan}\n\n` +
            `✅ *الجوانب الإيجابية:*\n${result.sisi_positif}\n\n` +
            `❌ *الجوانب السلبية:*\n${result.sisi_negatif}\n\n` +
            `> _${result.catatan}_`
        
        m.react('✅')
        await m.reply(response)
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }