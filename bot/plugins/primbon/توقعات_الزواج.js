// توقعات_الزواج - أمر لتوقعات الزواج حسب علم التنجيم الجاوي

import axios from 'axios'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'توقعات_الزواج',
    alias: ['ramalanjodoh'],
    category: 'primbon',
    description: 'توقعات الزواج حسب علم التنجيم الجاوي',
    usage: '.توقعات_الزواج الاسم1 اليوم1 الشهر1 السنة1 الاسم2 اليوم2 الشهر2 السنة2',
    example: '.توقعات_الزواج محمد 16 11 2007 سارة 1 1 2008',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    if (m.args.length < 8) {
        return m.reply(`💑 *توقعات الزواج*\n\n> الصيغة:\nالاسم1 اليوم1 الشهر1 السنة1 الاسم2 اليوم2 الشهر2 السنة2\n\n\`مثال:\n${m.prefix}توقعات_الزواج محمد 16 11 2007 سارة 1 1 2008\``)
    }
    
    const [nama1, tgl1, bln1, thn1, nama2, tgl2, bln2, thn2] = m.args
    
    m.react('💑')
    
    try {
        const url = `https://api.siputzx.my.id/api/primbon/ramalanjodoh?nama1=${encodeURIComponent(nama1)}&tgl1=${tgl1}&bln1=${bln1}&thn1=${thn1}&nama2=${encodeURIComponent(nama2)}&tgl2=${tgl2}&bln2=${bln2}&thn2=${thn2}`
        const { data } = await axios.get(url, { timeout: 30000 })
        
        if (!data?.status || !data?.data?.result) {
            m.react('❌')
            return m.reply(`❌ *فشل*\n\n> فشل التوقع`)
        }
        
        const r = data.data.result
        let response = `💑 *توقعات الزواج*\n\n`
        response += `👤 *${r.orang_pertama.nama}*\n> ${r.orang_pertama.tanggal_lahir}\n\n`
        response += `👤 *${r.orang_kedua.nama}*\n> ${r.orang_kedua.tanggal_lahir}\n\n`
        response += `📜 *نتيجة التوقع:*\n`
        
        r.hasil_ramalan.forEach((h, i) => {
            response += `${i+1}. ${h}\n\n`
        })
        
        response += `> ⚠️ _${data.data.peringatan}_`
        
        m.react('✅')
        await m.reply(response)
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }