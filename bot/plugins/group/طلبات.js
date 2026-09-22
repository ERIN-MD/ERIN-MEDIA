import config from '../../config.js'
import te from '../../src/lib/maro-error.js'
const pluginConfig = {
    name: 'طلبات',
    alias: ['acc'],
    category: 'group',
    description: 'إدارة طلبات الانضمام للمجموعة (قبول/رفض)',
    usage: '.طلبات <قائمة|قبول|رفض> [الكل|رقم]',
    example: '.طلبات قبول الكل',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    isBotAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function formatDate(timestamp) {
    return new Intl.DateTimeFormat('ar-SA', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(timestamp * 1000))
}

async function handler(m, { sock }) {
    const args = m.args || []
    const sub = args[0]?.toLowerCase()
    const option = args.slice(1).join(' ')?.trim()

    if (!sub || !['قائمة', 'قبول', 'رفض'].includes(sub)) {
        return m.reply(
            `📋 *إدارة طلبات الانضمام*\n\n` +
            `╭┈┈⬡「 📌 *الأوامر* 」\n` +
            `┃ ${m.prefix}طلبات قائمة\n` +
            `┃ ${m.prefix}طلبات قبول الكل\n` +
            `┃ ${m.prefix}طلبات رفض الكل\n` +
            `┃ ${m.prefix}طلبات قبول 1|2|3\n` +
            `┃ ${m.prefix}طلبات رفض 1|2|3\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        )
    }

    await m.react('🕕')

    try {
        const pendingList = await sock.groupRequestParticipantsList(m.chat)

        if (!pendingList?.length) {
            await m.react('📭')
            return m.reply(`📭 لا توجد طلبات انضمام معلقة.`)
        }

        if (sub === 'قائمة') {
            let text = `📋 *قائمة طلبات الانضمام*\n\n`
            text += `> المجموع: ${pendingList.length} طلب\n\n`

            for (let i = 0; i < pendingList.length; i++) {
                const req = pendingList[i]
                const number = req.jid?.split('@')[0] || 'غير معروف'
                const method = req.request_method || '-'
                const time = req.request_time ? formatDate(req.request_time) : '-'

                text += `*${i + 1}.* @${number}\n`
                text += `   📱 ${number}\n`
                text += `   📨 ${method}\n`
                text += `   🕐 ${time}\n\n`
            }

            text += `> استخدم \`${m.prefix}طلبات قبول الكل\` أو \`${m.prefix}طلبات رفض الكل\``

            const mentions = pendingList.map(r => r.jid)
            await m.react('📋')
            return m.reply(text, { mentions })
        }

        const action = sub === 'قبول' ? 'approve' : 'reject'

        if (option === 'الكل') {
            const jids = pendingList.map(r => r.jid)
            const results = await sock.groupRequestParticipantsUpdate(m.chat, jids, action)
            const success = results.filter(r => r.status === '200' || !r.status || r.status === 200).length
            const failed = results.length - success
            const label = action === 'approve' ? 'مقبول' : 'مرفوض'
            await m.react('✅')
            return m.reply(
                `✅ *${label} الكل*\n\n` +
                `> ✅ نجح: ${success}\n` +
                `> ❌ فشل: ${failed}\n` +
                `> 📊 المجموع: ${results.length}`
            )
        }

        const indices = option.split('|').map(n => parseInt(n.trim()) - 1).filter(n => !isNaN(n) && n >= 0 && n < pendingList.length)

        if (!indices.length) {
            await m.react('❌')
            return m.reply(
                `❌ رقم غير صالح.\n\n` +
                `> استخدم \`${m.prefix}طلبات قائمة\` للاطلاع على القائمة.\n` +
                `> مثال: \`${m.prefix}طلبات ${sub} 1|2|3\``
            )
        }

        const targets = indices.map(i => pendingList[i])
        let text = ''
        const label = action === 'approve' ? 'مقبول' : 'مرفوض'
        let successCount = 0

        for (const target of targets) {
            try {
                const result = await sock.groupRequestParticipantsUpdate(m.chat, [target.jid], action)
                const status = result[0]?.status
                const ok = status === '200' || !status || status === 200
                const number = target.jid.split('@')[0]
                text += `${ok ? '✅' : '❌'} ${number} — ${ok ? label : 'فشل'}\n`
                if (ok) successCount++
            } catch {
                const number = target.jid.split('@')[0]
                text += `❌ ${number} — خطأ\n`
            }
        }

        await m.react('✅')
        return m.reply(
            `📋 *نتيجة ${label}*\n\n` +
            text + `\n` +
            `> ✅ ${successCount}/${targets.length} نجح`
        )
    } catch (error) {
        await m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }