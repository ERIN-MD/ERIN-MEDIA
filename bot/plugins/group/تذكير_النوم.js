import { setNotifTidur, toggleNotif, getNotif, deleteNotif, parseJadwal } from '../../src/lib/maro-notif-scheduler.js'

const pluginConfig = {
    name: "تذكير_النوم",
    alias: ["notiftidur"],
    category: 'group',
    description: 'تعيين تذكير تلقائي لمواعيد النوم',
    usage: '.تذكير_النوم on <وقت1,وقت2,...> / off / edit <وقت1,وقت2,...>',
    example: '.تذكير_النوم on 22.00',
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

    const existing = getNotif('tidur', sender, chatJid)

    if (!sub || !['on', 'off', 'edit'].includes(sub)) {
        const status = existing
            ? (existing.enabled ? '✅ مفعل' : '❌ معطل')
            : '⚪ لم يتم التعيين'

        let info = `🌙 *تذكير النوم*\n\n`
        info += `📌 *الحالة:* ${status}\n`

        if (existing) {
            info += `⏰ *المواعيد:* ${existing.jadwal.map(j => `*${j}*`).join(', ')}\n`
        }

        info += `\n*📋 طريقة الاستخدام:*\n`
        info += `> \`${m.prefix}تذكير_النوم on 22.00\`\n`
        info += `> \`${m.prefix}تذكير_النوم on 22.00,23.30\`\n`
        info += `> \`${m.prefix}تذكير_النوم edit 23.00\`\n`
        info += `> \`${m.prefix}تذكير_النوم off\`\n`
        info += `\n> 💡 _يمكن استخدام النقطة أو النقطتين (22.00 / 22:00)_\n`
        info += `> 💡 _يمكن إضافة عدة مواعيد مفصولة بفواصل_`

        return m.reply(info)
    }

    if (sub === 'off') {
        if (!existing) {
            return m.reply(`❌ *لا يوجد تذكير نوم* مفعل في هذه المحادثة`)
        }
        toggleNotif('tidur', sender, chatJid, false)
        return m.reply(`✅ *تم إلغاء تذكير النوم* 🔕\n\n> اكتب \`${m.prefix}تذكير_النوم on\` لإعادة التفعيل`)
    }

    if (sub === 'on') {
        if (existing?.enabled && args.length === 1) {
            return m.reply(`⚠️ *تذكير النوم مفعل بالفعل!*\n\n⏰ المواعيد: ${existing.jadwal.map(j => `*${j}*`).join(', ')}\n\n> استخدم \`${m.prefix}تذكير_النوم edit\` لتغيير المواعيد`)
        }

        if (existing && args.length === 1) {
            toggleNotif('tidur', sender, chatJid, true)
            return m.reply(`✅ *تم إعادة تفعيل تذكير النوم!* 🔔\n\n⏰ المواعيد: ${existing.jadwal.map(j => `*${j}*`).join(', ')}`)
        }

        const timeInput = args[1]
        if (!timeInput) {
            return m.reply(`❌ *أدخل مواعيد النوم!*\n\n> مثال: \`${m.prefix}تذكير_النوم on 22.00\``)
        }

        const jadwal = parseJadwal(timeInput)
        if (jadwal.length === 0) {
            return m.reply(`❌ *صيغة الوقت خاطئة!*\n\n> استخدم صيغة *HH.MM* أو *HH:MM*\n> مثال: \`22.00\` أو \`23.30\``)
        }

        setNotifTidur(sender, chatJid, jadwal)

        let reply = `✅ *تم تفعيل تذكير النوم!* 🔔\n\n`
        reply += `⏰ *المواعيد:*\n`
        for (const j of jadwal) {
            reply += `> 🕐 *${j}*\n`
        }
        reply += `\n> 💡 _سيتم إرسال التذكير إلى هذه المحادثة يومياً_`

        return m.reply(reply)
    }

    if (sub === 'edit') {
        if (!existing) {
            return m.reply(`❌ *لا يوجد تذكير نوم!*\n\n> فعله أولاً: \`${m.prefix}تذكير_النوم on 22.00\``)
        }

        const timeInput = args[1]
        if (!timeInput) {
            return m.reply(`❌ *أدخل المواعيد الجديدة!*\n\n> مثال: \`${m.prefix}تذكير_النوم edit 23.00\``)
        }

        const jadwal = parseJadwal(timeInput)
        if (jadwal.length === 0) {
            return m.reply(`❌ *صيغة الوقت خاطئة!*\n\n> استخدم صيغة *HH.MM* أو *HH:MM*\n> مثال: \`23.00\` أو \`22.30\``)
        }

        setNotifTidur(sender, chatJid, jadwal)

        let reply = `✅ *تم تحديث مواعيد النوم!* ✏️\n\n`
        reply += `⏰ *المواعيد الجديدة:*\n`
        for (const j of jadwal) {
            reply += `> 🕐 *${j}*\n`
        }

        return m.reply(reply)
    }
}

export { pluginConfig as config, handler }