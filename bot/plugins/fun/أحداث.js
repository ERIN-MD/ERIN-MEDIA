// ═══════════════════════════════════════════════
// 📁 plugins/fun/أحداث.js
// 📅 أحداث تاريخية حسب السنة
// ═══════════════════════════════════════════════

import axios from 'axios'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'أحداث',
    alias: ['حدث', 'تاريخ', 'year'],
    category: 'fun',
    description: 'عرض أحداث تاريخية لسنة معينة',
    usage: '.أحداث <سنة>',
    example: '.أحداث 2000',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock, text }) {
    const year = parseInt(text)
    if (!year || year < 1900 || year > 2030) {
        return m.reply(`📅 *أحداث تاريخية*\n\n📝 .أحداث <سنة>\n💡 .أحداث 2000`)
    }

    m.react('⏳')

    try {
        const { data } = await axios.get(`https://super-fire.vercel.app/api/mybirth?num=${year}`)
        
        if (!data || !data.result) {
            m.react('❌')
            return m.reply('❌ *لا توجد أحداث*')
        }

        m.react('✅')
        await m.reply(`📅 *أحداث سنة ${year}*\n\n${data.result}`)

    } catch (e) {
        m.react('❌')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }