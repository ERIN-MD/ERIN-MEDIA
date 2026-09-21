// ═══════════════════════════════════════════════
// 📁 plugins/tools/جيميل.js
// 📧 فحص حساب Gmail
// ═══════════════════════════════════════════════

import axios from 'axios'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'جيميل',
    alias: ['gmail', 'ايميل', 'email'],
    category: 'tools',
    description: 'فحص معلومات حساب Gmail',
    usage: '.جيميل <البريد>',
    example: '.جيميل example@gmail.com',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 2,
    isEnabled: true
}

async function handler(m, { sock, text }) {
    if (!text) {
        return m.reply(`📧 *فحص Gmail*\n\n📝 .جيميل <البريد>\n💡 .جيميل example@gmail.com`)
    }

    if (!text.includes('@gmail.com')) {
        return m.reply('❌ *يرجى إدخال Gmail صحيح*')
    }

    m.react('⏳')

    try {
        const { data } = await axios.get(`https://super-fire.vercel.app/api/gmail?text=${encodeURIComponent(text)}`)

        if (!data?.status || !data?.data) {
            m.react('❌')
            return m.reply('❌ *فشل الفحص*')
        }

        const d = data.data

        let reply = `📧 *فحص Gmail*\n\n`
        reply += `📧 *البريد:* ${d.email || text}\n`
        reply += `🆔 *Google ID:* ${d.googleID || 'غير معروف'}\n`
        reply += `🖼️ *الصورة:* ${d.photoProfile || 'لا يوجد'}\n`
        reply += `📅 *آخر تعديل:* ${d.lastEditProfile || 'غير معروف'}\n`
        reply += `🌍 *IP:* ${d.ipAddress || 'غير معروف'}\n`
        reply += `📅 *التقويم:* ${d.calendar || 'لا يوجد'}\n`
        reply += `👤 *نوع المستخدم:* ${d.userTypes || 'لا يوجد'}\n`
        if (d.mapsData?.profilePage) {
            reply += `🗺️ *الخرائط:* ${d.mapsData.profilePage}\n`
        }

        m.react('✅')
        await m.reply(reply)

    } catch (e) {
        m.react('❌')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }