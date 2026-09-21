import { setNotifMakan, toggleNotif, getNotif, deleteNotif, parseJadwal } from '../../src/lib/maro-notif-scheduler.js'

const pluginConfig = {
    name: "تذكير_الوجبات",
    alias: ["notifmakan"],
    category: 'group',
    description: 'تعيين تذكير تلقائي لمواعيد الوجبات',
    usage: '.تذكير_الوجبات on <وقت1,وقت2,...> [الوجبة] / off / edit <وقت1,وقت2,...> [الوجبة]',
    example: '.تذكير_الوجبات on 07.00,12.00,19.00 أرز',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function handler(m) {
    const args = m.args || []
    const sub = args[0]?.toLowerCase()
    const chatJid = m.chat
    const sender = m.sender

    const existing = getNotif('makan', sender, chatJid)

    if (!sub || !['on', 'off', 'edit'].includes(sub)) {
        const status = existing
            ? (existing.enabled ? '✅ مفعل' : '❌ معطل')
            : '⚪ لم يتم التعيين'

        let info = `🍽️ *تذكير الوجبات*\n\n`
        info += `📌 *الحالة:* ${status}\n`

        if (existing) {
            info += `⏰ *المواعيد:* ${existing.jadwal.map(j => `*${j}*`).join(', ')}\n`
            if (existing.menu) info += `🍴 *الوجبة:* _${existing.menu}_\n`
        }

        info += `\n*📋 طريقة الاستخدام:*\n`
        info += `> \`${m.prefix}تذكير_الوجبات on 07.00,12.00,19.00\`\n`
        info += `> \`${m.prefix}تذكير_الوجبات on 07.00,12.00 أرز مقلي\`\n`
        info += `> \`${m.prefix}تذكير_الوجبات edit 08.00,13.00\`\n`
        info += `> \`${m.prefix}تذكير_الوجبات off\`\n`
        info += `\n> 💡 _يمكن استخدام النقطة أو النقطتين (07.00 / 07:00)_\n`
        info += `> 💡 _يمكن إضافة عدة مواعيد مفصولة بفواصل_`

        return m.reply(info)
    }

    if (sub === 'off') {
        if (!existing) {
            return m.reply(`❌ *لا يوجد تذكير وجبات* مفعل في هذه المحادثة`)
        }
        toggleNotif('makan', sender, chatJid, false)
        return m.reply(`✅ *تم إلغاء تذكير الوجبات* 🔕\n\n> اكتب \`${m.prefix}تذكير_الوجبات on\` لإعادة التفعيل`)
    }

    if (sub === 'on') {
        if (existing?.enabled && args.length === 1) {
            return m.reply(`⚠️ *تذكير الوجبات مفعل بالفعل!*\n\n⏰ المواعيد: ${existing.jadwal.map(j => `*${j}*`).join(', ')}\n\n> استخدم \`${m.prefix}تذكير_الوجبات edit\` لتغيير المواعيد`)
        }

        if (existing && args.length === 1) {
            toggleNotif('makan', sender, chatJid, true)
            return m.reply(`✅ *تم إعادة تفعيل تذكير الوجبات!* 🔔\n\n⏰ المواعيد: ${existing.jadwal.map(j => `*${j}*`).join(', ')}`)
        }

        const timeInput = args[1]
        if (!timeInput) {
            return m.reply(`❌ *أدخل مواعيد الوجبات!*\n\n> مثال: \`${m.prefix}تذكير_الوجبات on 07.00,12.00,19.00\``)
        }

        const jadwal = parseJadwal(timeInput)
        if (jadwal.length === 0) {
            return m.reply(`❌ *صيغة الوقت خاطئة!*\n\n> استخدم صيغة *HH.MM* أو *HH:MM*\n> مثال: \`07.00,12.30,19.00\``)
        }

        const menu = args.slice(2).join(' ').trim()
        setNotifMakan(sender, chatJid, jadwal, menu)

        let reply = `✅ *تم تفعيل تذكير الوجبات!* 🔔\n\n`
        reply += `⏰ *المواعيد:*\n`
        for (const j of jadwal) {
            const label = getMealLabel(j)
            reply += `> 🕐 *${j}* _(${label})_\n`
        }
        if (menu) reply += `\n🍴 *الوجبة:* _${menu}_`
        reply += `\n\n> 💡 _سيتم إرسال التذكير إلى هذه المحادثة يومياً_`

        return m.reply(reply)
    }

    if (sub === 'edit') {
        if (!existing) {
            return m.reply(`❌ *لا يوجد تذكير وجبات!*\n\n> فعله أولاً: \`${m.prefix}تذكير_الوجبات on 07.00,12.00,19.00\``)
        }

        const timeInput = args[1]
        if (!timeInput) {
            return m.reply(`❌ *أدخل المواعيد الجديدة!*\n\n> مثال: \`${m.prefix}تذكير_الوجبات edit 08.00,13.00,20.00\``)
        }

        const jadwal = parseJadwal(timeInput)
        if (jadwal.length === 0) {
            return m.reply(`❌ *صيغة الوقت خاطئة!*\n\n> استخدم صيغة *HH.MM* أو *HH:MM*\n> مثال: \`08.00,13.00,20.00\``)
        }

        const menu = args.slice(2).join(' ').trim() || existing.menu || ''
        setNotifMakan(sender, chatJid, jadwal, menu)

        let reply = `✅ *تم تحديث مواعيد الوجبات!* ✏️\n\n`
        reply += `⏰ *المواعيد الجديدة:*\n`
        for (const j of jadwal) {
            const label = getMealLabel(j)
            reply += `> 🕐 *${j}* _(${label})_\n`
        }
        if (menu) reply += `\n🍴 *الوجبة:* _${menu}_`

        return m.reply(reply)
    }
}

function getMealLabel(jam) {
    const hour = parseInt(jam.split(':')[0], 10)
    if (hour >= 4 && hour < 10) return 'الصباح'
    if (hour >= 10 && hour < 15) return 'الظهر'
    if (hour >= 15 && hour < 18) return 'العصر'
    return 'المساء'
}

export { pluginConfig as config, handler }