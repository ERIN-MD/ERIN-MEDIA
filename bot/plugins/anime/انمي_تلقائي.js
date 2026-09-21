import { loadSent, saveSent, loadState, saveState, getOngoingAnimeList, startAutoCheck, stopAutoCheck, runCheck, isRunning } from '../../src/lib/maro-auto-anime.js'
import config from '../../config.js'
import te from '../../src/lib/maro-error.js'

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'انمي_تلقائي',
    alias: ['aaw'],
    category: 'anime',
    description: 'تحميل تلقائي للأنمي من winbu.net',
    usage: '.انمي_تلقائي <start|stop|status|cek|list|reset|addgrup|delgrup>',
    example: '.انمي_تلقائي start',
    isOwner: true, isPremium: false, isGroup: false, isPrivate: false,
    cooldown: 10, energi: 0, isEnabled: true
}

// ═══════════════════════════════════════════════
// 🎬 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock, args }) {
    const sub = m.text
    const state = loadState()

    switch (sub) {
        case 'start': {
            if (isRunning()) return m.reply(`⚠️ التحميل التلقائي يعمل بالفعل!`)

            const groups = state.groups || []
            if (groups.length === 0) {
                return m.reply(
                    `❌ لا توجد مجموعات مستهدفة!\n\n` +
                    `> أضف مجموعة أولاً:\n` +
                    `> \`${m.prefix}انمي_تلقائي addgrup\` (داخل المجموعة)\n` +
                    `> \`${m.prefix}انمي_تلقائي addgrup 120363xxx@g.us\``
                )
            }

            const interval = state.interval || 5
            startAutoCheck(sock, interval)
            saveState({ ...state, enabled: true })

            return sock.sendMessage(m.chat, {
                text: `✅ *تم التشغيل*\n\n` +
                    `> 📲 المجموعات: *${groups.length}*\n` +
                    `> ⏱️ الفاصل: *${interval} دقائق*\n` +
                    `> 🎞️ الجودة: *Pixeldrain 720p+*\n\n` +
                    `بدء الفحص الأول...`,
                interactiveButtons: [
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '📊 الحالة', id: `${m.prefix}انمي_تلقائي status` }) },
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🛑 إيقاف', id: `${m.prefix}انمي_تلقائي stop` }) }
                ]
            }, { quoted: m })
        }

        case 'stop': {
            stopAutoCheck()
            saveState({ ...state, enabled: false })
            return m.reply(`🛑 *تم إيقاف التحميل التلقائي*`)
        }

        case 'status': {
            const sent = loadSent()
            const running = isRunning()
            const groups = state.groups || []

            let txt = `📊 *حالة التحميل التلقائي*\n\n`
            txt += `> 🔄 الحالة: *${running ? '🟢 يعمل' : '🔴 متوقف'}*\n`
            txt += `> 📋 تم الإرسال: *${sent.size}* حلقة\n`
            txt += `> ⏱️ الفاصل: *${state.interval || 5} دقائق*\n`
            txt += `> 📲 المجموعات: *${groups.length}*\n`

            if (groups.length > 0) {
                txt += `\n*المجموعات:*\n`
                groups.forEach((g, i) => { txt += `> ${i + 1}. \`${g}\`\n` })
            }

            return sock.sendMessage(m.chat, { text: txt }, { quoted: m })
        }

        case 'cek':
        case 'check': {
            if (!isRunning()) startAutoCheck(sock, state.interval || 5)
            await m.reply('🔍 جاري فحص الأنمي الجديد...')
            try {
                await runCheck()
                return m.reply('✅ اكتمل الفحص')
            } catch (e) { m.reply(te(m.prefix, m.command, m.pushName)) }
            break
        }

        case 'list': {
            await m.reply('📺 جاري جلب القائمة...')
            try {
                const list = await getOngoingAnimeList()
                if (list.length === 0) return m.reply('❌ لا يوجد أنمي')

                let txt = `📺 *قائمة الأنمي*\n\n> المجموع: *${list.length}*\n\n`
                list.slice(0, 15).forEach((a, i) => { txt += `*${i + 1}.* ${a.title}\n` })
                if (list.length > 15) txt += `\n> ...و ${list.length - 15} آخرين`

                return sock.sendMessage(m.chat, { text: txt }, { quoted: m })
            } catch (e) { m.reply(te(m.prefix, m.command, m.pushName)) }
            break
        }

        case 'reset': {
            const sent = loadSent()
            const count = sent.size
            saveSent(new Set())
            return m.reply(`✅ تم إعادة التعيين! *${count}* حلقة محذوفة من السجل.`)
        }

        case 'addgrup':
        case 'addgroup': {
            const rest = (typeof args === 'string' ? args : '').replace(/^(addgrup|addgroup)\s*/i, '').trim()
            let grupId = rest
            if (!grupId && m.isGroup) grupId = m.chat

            if (!grupId || !grupId.includes('@g.us')) {
                return m.reply(`❌ معرف المجموعة غير صالح\n\n> استخدم داخل المجموعة أو:\n> \`${m.prefix}انمي_تلقائي addgrup 120363xxx@g.us\``)
            }

            const groups = state.groups || []
            if (groups.includes(grupId)) return m.reply(`⚠️ المجموعة موجودة بالفعل`)

            groups.push(grupId)
            saveState({ ...state, groups })
            return m.reply(`✅ تمت إضافة المجموعة\n> المجموع: *${groups.length}*`)
        }

        case 'delgrup':
        case 'delgroup': {
            const rest = (typeof args === 'string' ? args : '').replace(/^(delgrup|delgroup)\s*/i, '').trim()
            let grupId = rest
            if (!grupId && m.isGroup) grupId = m.chat

            const groups = state.groups || []
            const idx = groups.indexOf(grupId)
            if (idx === -1) return m.reply(`❌ المجموعة غير موجودة`)

            groups.splice(idx, 1)
            saveState({ ...state, groups })
            return m.reply(`✅ تم حذف المجموعة\n> المتبقي: *${groups.length}*`)
        }

        case 'interval': {
            const rest = (typeof args === 'string' ? args : '').replace(/^interval\s*/i, '').trim()
            const mins = parseInt(rest)
            if (!mins || mins < 1 || mins > 60) {
                return m.reply(`❌ الفاصل يجب أن يكون 1-60 دقيقة\n\n> مثال: \`${m.prefix}انمي_تلقائي interval 10\``)
            }
            saveState({ ...state, interval: mins })
            if (isRunning()) { stopAutoCheck(); startAutoCheck(sock, mins) }
            return m.reply(`✅ تم تغيير الفاصل إلى *${mins} دقيقة*`)
        }

        default: {
            const running = isRunning()
            return sock.sendMessage(m.chat, {
                text: `🎬 *تحميل الأنمي التلقائي*\n\n` +
                    `> الحالة: *${running ? '🟢 يعمل' : '🔴 متوقف'}*\n\n` +
                    `*الأوامر:*\n` +
                    `> \`${m.prefix}انمي_تلقائي start\` — بدء\n` +
                    `> \`${m.prefix}انمي_تلقائي stop\` — إيقاف\n` +
                    `> \`${m.prefix}انمي_تلقائي status\` — الحالة\n` +
                    `> \`${m.prefix}انمي_تلقائي cek\` — فحص يدوي\n` +
                    `> \`${m.prefix}انمي_تلقائي list\` — قائمة الأنمي\n` +
                    `> \`${m.prefix}انمي_تلقائي addgrup\` — إضافة مجموعة\n` +
                    `> \`${m.prefix}انمي_تلقائي delgrup\` — حذف مجموعة\n` +
                    `> \`${m.prefix}انمي_تلقائي interval 10\` — تغيير الفاصل\n` +
                    `> \`${m.prefix}انمي_تلقائي reset\` — إعادة تعيين`,
                interactiveButtons: [
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: running ? '🛑 إيقاف' : '▶️ بدء', id: `${m.prefix}انمي_تلقائي ${running ? 'stop' : 'start'}` }) },
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '📊 الحالة', id: `${m.prefix}انمي_تلقائي status` }) }
                ]
            }, { quoted: m })
        }
    }
}

export { pluginConfig as config, handler }