// تجسس_انستغرام - أمر للتجسس على حسابات إنستغرام مع عرض بطاقة Meta

import axios from 'axios'
import te from '../../src/lib/maro-error.js'
import config from '../../config.js'

const pluginConfig = {
    name: 'تجسس_انستغرام',
    alias: ['igstalk'],
    category: 'stalker',
    description: 'التجسس على حساب إنستغرام مع عرض بطاقة Meta',
    usage: '.تجسس_انستغرام <اسم_المستخدم>',
    example: '.تجسس_انستغرام cristiano',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true,
}

function shortNum(num) {
    if (!num) return '0'
    num = parseInt(num)
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace('.0', '') + ' مليار'
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace('.0', '') + ' مليون'
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace('.0', '') + ' ألف'
    return num.toString()
}

function formatDate(dateStr) {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

function getAccountAge(dateStr) {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '-'
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const years = Math.floor(diffDays / 365)
    const months = Math.floor((diffDays % 365) / 30)
    if (years > 0) return `${years} سنة ${months} شهر`
    return `${diffDays} يوم`
}

async function handler(m, { sock }) {
    const username = m.args[0]?.replace('@', '')
    
    if (!username) {
        return m.reply(
            `📸 *تجسس إنستغرام*\n\n` +
            `> أدخل اسم المستخدم في إنستغرام\n\n` +
            `\`مثال: ${m.prefix}تجسس_انستغرام cristiano\``
        )
    }
    
    m.react('🔍')
    
    try {
        const res = await axios.get(
            `https://firefly.maiku.my.id/api/stalk-instagram?apikey=${config.APIkey.firefly}&username=${encodeURIComponent(username)}`,
            { timeout: 30000 }
        )
        
        const d = res.data?.data
        if (!res.data?.status || !d?.username) {
            m.react('❌')
            return m.reply(`❌ الحساب *@${username}* غير موجود`)
        }
        
        // إنشاء بطاقة Meta غنية
        const caption = `📸 *تجسس إنستغرام*\n\n` +
            `╭─〔 👤 *المعلومات الشخصية* 〕─⬣\n` +
            `│ ✦ الاسم: *${d.full_name || d.username}*\n` +
            `│ ✦ اسم المستخدم: *@${d.username}*\n` +
            `│ ✦ الحساب: ${d.is_verified ? '✅ موثق' : '📌 غير موثق'}\n` +
            `│ ✦ الحالة: ${d.is_private ? '🔒 خاص' : '🌐 عام'}\n` +
            `│ ✦ تاريخ الإنشاء: ${formatDate(d.created_at)}\n` +
            `│ ✦ عمر الحساب: ${getAccountAge(d.created_at)}\n` +
            `╰────────────────⬣\n\n` +
            `╭─〔 📊 *الإحصائيات* 〕─⬣\n` +
            `│ ✦ المتابعون: *${shortNum(d.stats?.followers)}*\n` +
            `│ ✦ المتابَعون: *${shortNum(d.stats?.following)}*\n` +
            `│ ✦ المنشورات: *${shortNum(d.stats?.posts)}*\n` +
            `│ ✦ نسبة المتابعة: *${d.stats?.followers > 0 ? ((d.stats?.following / d.stats?.followers) * 100).toFixed(1) : '0'}%*\n` +
            `╰────────────────⬣\n\n` +
            `╭─〔 📝 *السيرة الذاتية* 〕─⬣\n` +
            `│ ${d.bio || 'لا توجد سيرة ذاتية'}\n` +
            `╰────────────────⬣\n\n` +
            `🔗 *الرابط:* https://instagram.com/${d.username}\n` +
            `🆔 *المعرف:* ${d.id || '-'}`

        m.react('✅')
        
        const profilePic = d.profile_pic
        if (profilePic) {
            // إرسال كصورة مع بطاقة Meta
            await sock.sendMessage(m.chat, {
                image: { url: profilePic },
                caption: caption,
                contextInfo: {
                    externalAdReply: {
                        title: `📸 ${d.full_name || d.username}`,
                        body: `@${d.username} • ${shortNum(d.stats?.followers)} متابع`,
                        thumbnailUrl: profilePic,
                        sourceUrl: `https://instagram.com/${d.username}`,
                        mediaType: 1,
                        renderLargerThumbnail: true,
                        showAdAttribution: true
                    }
                }
            }, { quoted: m })
        } else {
            await m.reply(caption)
        }
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }