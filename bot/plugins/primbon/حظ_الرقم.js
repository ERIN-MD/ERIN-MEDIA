// حظ_الرقم - أمر لمعرفة حظ رقم الهاتف

import axios from 'axios'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'حظ_الرقم',
    alias: ['nomerhoki'],
    category: 'primbon',
    description: 'معرفة حظ رقم الهاتف',
    usage: '.حظ_الرقم <الرقم>',
    example: '.حظ_الرقم 6281234567890',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    let nomor = m.args.join('').replace(/[^0-9]/g, '')
    if (!nomor) {
        return m.reply(`🍀 *حظ الرقم*\n\n> أدخل رقم الهاتف\n\n\`مثال: ${m.prefix}حظ_الرقم 6281234567890\``)
    }
    
    m.react('🍀')
    
    try {
        const url = `https://api.siputzx.my.id/api/primbon/nomorhoki?phoneNumber=${nomor}`
        const { data } = await axios.get(url, { timeout: 30000 })
        
        if (!data?.status || !data?.data) {
            m.react('❌')
            return m.reply(`❌ *فشل*\n\n> فشل تحليل الرقم`)
        }
        
        const r = data.data
        const ep = r.energi_positif.details
        const en = r.energi_negatif.details
        
        const response = `🍀 *حظ الرقم*\n\n` +
            `> الرقم: *${r.nomor}*\n\n` +
            `📊 *رقم الباغوا:* ${r.angka_bagua_shuzi.value}%\n\n` +
            `✅ *الطاقة الإيجابية:* ${r.energi_positif.total}%\n` +
            `├ الثروة: ${ep.kekayaan}\n` +
            `├ الصحة: ${ep.kesehatan}\n` +
            `├ الحب: ${ep.cinta}\n` +
            `└ الاستقرار: ${ep.kestabilan}\n\n` +
            `❌ *الطاقة السلبية:* ${r.energi_negatif.total}%\n` +
            `├ الخلافات: ${en.perselisihan}\n` +
            `├ الخسارة: ${en.kehilangan}\n` +
            `├ الكوارث: ${en.malapetaka}\n` +
            `└ الدمار: ${en.kehancuran}\n\n` +
            `> الحالة: ${r.analisis.status ? '✅ محظوظ' : '❌ غير محظوظ'}`
        
        m.react('✅')
        await m.reply(response)
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }