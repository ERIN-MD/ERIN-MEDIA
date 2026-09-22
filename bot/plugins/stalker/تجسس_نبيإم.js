// تجسس_نبيإم - أمر للتجسس على حسابات NPM (مدير حزم Node.js)

import axios from 'axios'
import te from '../../src/lib/maro-error.js'
import config from '../../config.js'

const pluginConfig = {
    name: 'تجسس_نبيإم',
    alias: ['npmstalk'],
    category: 'stalker',
    description: 'التجسس على حساب NPM (مدير حزم Node.js)',
    usage: '.تجسس_نبيإم <اسم_المستخدم>',
    example: '.تجسس_نبيإم hanya_zann',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

function shortNum(num) {
    if (!num) return '0'
    num = parseInt(num)
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace('.0', '') + ' مليار'
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace('.0', '') + ' مليون'
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace('.0', '') + ' ألف'
    return num.toString()
}

async function handler(m, { sock }) {
    const username = m.args[0]
    
    if (!username) {
        return m.reply(`📦 *تجسس NPM*\n\n> أدخل اسم المستخدم في NPM\n\n\`مثال: ${m.prefix}تجسس_نبيإم hanya_zann\``)
    }
    
    m.react('🔍')
    
    try {
        const res = await axios.get(`https://firefly.maiku.my.id/api/stalk-npm?apikey=${config.APIkey.firefly}&username=${encodeURIComponent(username)}`, {
            timeout: 30000
        })
        
        if (!res.data?.status || !res.data?.data) {
            m.react('❌')
            return m.reply(`❌ اسم المستخدم *${username}* غير موجود`)
        }
        
        const d = res.data.data
        const s = d.stats || {}
        
        let caption = `📦 *تجسس NPM*\n\n` +
            `╭─〔 👤 *المعلومات الشخصية* 〕─⬣\n` +
            `│ ✦ اسم المستخدم: *${d.username}*\n` +
            `│ ✦ الاسم: *${d.name || '-'}*\n` +
            `│ ✦ البريد الإلكتروني: *${d.email || '-'}*\n` +
            `│ ✦ تاريخ الانضمام: *${d.joined ? new Date(d.joined).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}*\n` +
            `╰────────────────⬣\n\n` +
            `╭─〔 📊 *الإحصائيات* 〕─⬣\n` +
            `│ ✦ إجمالي الحزم: *${s.total_packages || 0}*\n` +
            `│ ✦ التنزيلات الشهرية: *${shortNum(s.total_monthly_downloads)}*\n` +
            `│ ✦ عدد المتابعين: *${shortNum(s.followers || 0)}*\n` +
            `│ ✦ عدد المتابَعين: *${shortNum(s.following || 0)}*\n` +
            `╰────────────────⬣`

        if (d.packages && d.packages.length > 0) {
            caption += `\n╭─〔 📦 *أشهر الحزم* 〕─⬣\n`
            d.packages.slice(0, 5).forEach((pkg, i) => {
                caption += `│ ${i+1}. *${pkg.name}* (الإصدار ${pkg.version})\n`
                caption += `│    📉 ${shortNum(pkg.downloads_monthly)} تحميل/شهر\n`
                caption += `│    📝 ${pkg.description || 'لا يوجد وصف'}\n`
                if (i < d.packages.slice(0, 5).length - 1) caption += `│\n`
            })
            caption += `╰────────────────⬣`
        }
        
        caption += `\n\n🔗 *الرابط:* ${d.profile}`

        m.react('✅')
        
        // إرسال مع بطاقة Meta
        if (d.avatar) {
            await sock.sendMessage(m.chat, {
                image: { url: d.avatar },
                caption: caption,
                contextInfo: {
                    externalAdReply: {
                        title: `📦 ${d.username}`,
                        body: `مطور NPM • ${s.total_packages || 0} حزمة`,
                        thumbnailUrl: d.avatar,
                        sourceUrl: d.profile,
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