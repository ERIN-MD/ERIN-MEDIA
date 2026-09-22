// بحث_روبلوكس - أمر للبحث عن لاعبين في روبلوكس

import axios from 'axios'
import config from '../../config.js'
import te from '../../src/lib/maro-error.js'

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-MaroMD'

const pluginConfig = {
    name: 'بحث_روبلوكس',
    alias: ['robloxplayer'],
    category: 'stalker',
    description: 'البحث عن لاعبين في روبلوكس حسب اسم المستخدم',
    usage: '.بحث_روبلوكس <اسم_المستخدم>',
    example: '.بحث_روبلوكس linkmon',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    
    if (!query) {
        return m.reply(
            `🎮 *بحث لاعبين روبلوكس*\n\n` +
            `> أدخل اسم المستخدم للبحث\n\n` +
            `\`${m.prefix}بحث_روبلوكس linkmon\``
        )
    }
    
    m.react('🔍')
    
    try {
        const res = await axios.get(`https://api.neoxr.eu/api/roblox-search?q=${encodeURIComponent(query)}&apikey=${NEOXR_APIKEY}`, {
            timeout: 30000
        })
        
        if (!res.data?.status || !res.data?.data?.length) {
            m.react('❌')
            return m.reply(`❌ لم يتم العثور على لاعبين باسم: ${query}`)
        }
        
        const players = res.data.data.slice(0, 10)
        
        let text = `🎮 *بحث لاعبين روبلوكس*\n\n`
        text += `> الكلمة: \`${query}\`\n`
        text += `> تم العثور على: *${players.length}* لاعب\n\n`
        
        players.forEach((player, i) => {
            text += `╭┈┈⬡「 ${i + 1}. *${player.displayName}* 」\n`
            text += `┃ 🆔 المعرف: \`${player.id}\`\n`
            text += `┃ 👤 اسم المستخدم: \`${player.name}\`\n`
            text += `┃ 📛 الاسم المعروض: *${player.displayName}*\n`
            text += `┃ ✅ موثق: ${player.hasVerifiedBadge ? 'نعم' : 'لا'}\n`
            if (player.previousUsernames?.length > 0) {
                text += `┃ 📜 الأسماء السابقة: ${player.previousUsernames.join(', ')}\n`
            }
            text += `╰┈┈⬡\n\n`
        })
        
        text += `> _استخدم \`.تجسس_روبلوكس <اسم_المستخدم>\` للحصول على معلومات تفصيلية_`
        
        await m.reply(text)
        m.react('✅')
        
    } catch (err) {
        console.error('[RobloxPlayer] Error:', err.message)
        m.react('☢')
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }