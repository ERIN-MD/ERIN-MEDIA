// تجسس_جيثب - أمر للتجسس على حسابات جيثب

import axios from 'axios'
import te from '../../src/lib/maro-error.js'
import config from '../../config.js'

const pluginConfig = {
    name: 'تجسس_جيثب',
    alias: ['githubstalk'],
    category: 'stalker',
    description: 'التجسس على حساب جيثب',
    usage: '.تجسس_جيثب <اسم_المستخدم>',
    example: '.تجسس_جيثب torvalds',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const username = m.args[0]
    
    if (!username) {
        return m.reply(`🐙 *تجسس جيثب*\n\n> أدخل اسم مستخدم جيثب\n\n\`مثال: ${m.prefix}تجسس_جيثب torvalds\``)
    }
    
    m.react('🔍')
    
    try {
        const res = await axios.get(`https://firefly.maiku.my.id/api/stalk-github?apikey=${config.APIkey.firefly}&username=${encodeURIComponent(username)}`, {
            timeout: 30000
        })
        
        if (!res.data?.status || !res.data?.data) {
            m.react('❌')
            return m.reply(`❌ اسم المستخدم *${username}* غير موجود`)
        }
        
        const d = res.data.data
        
        const caption = `🐙 *تجسس جيثب*\n\n` +
            `👤 *اسم المستخدم:* ${d.username}\n` +
            `📛 *الاسم:* ${d.name || '-'}\n` +
            `🏢 *الشركة:* ${d.company || '-'}\n` +
            `📍 *الموقع:* ${d.location || '-'}\n\n` +
            `📦 *المستودعات العامة:* ${d.public_repos}\n` +
            `👥 *المتابعون:* ${d.followers}\n` +
            `👤 *المتابَعون:* ${d.following}\n\n` +
            `📝 *السيرة الذاتية:*\n${d.bio || '-'}\n\n` +
            `🔗 ${d.url}`
        
        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            image: { url: d.avatar },
            caption
        }, { quoted: m })
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }