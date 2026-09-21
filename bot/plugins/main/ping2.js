// ═══════════════════════════════════════════════
// 📁 plugins/main/ping2.js
// ⚡ Ping 2 - عرض تفاعلي مزدوج
// ═══════════════════════════════════════════════

import os from 'os'
import { performance } from 'perf_hooks'

const pluginConfig = {
    name: 'ping2',
    alias: ['سرعة2', 'بينج2', 'p2'],
    category: 'main',
    description: 'عرض سرعة البوت برسالتين تفاعليتين',
    usage: '.ping2',
    example: '.ping2',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const formatUptime = (sec) => {
    const d = Math.floor(sec / 86400)
    const h = Math.floor((sec % 86400) / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = Math.floor(sec % 60)
    if (d) return `${d} يوم ${h} ساعة`
    if (h) return `${h} ساعة ${m} دقيقة`
    return `${m} دقيقة ${s} ثانية`
}

const fmtSize = b => b >= 1024**3 ? (b/1024**3).toFixed(1)+' GB' : (b/1024**2).toFixed(1)+' MB'

async function handler(m, { sock }) {
    const start = performance.now()
    const latency = Math.max(1, Date.now() - (m.messageTimestamp * 1000 || Date.now()))
    const processTime = (performance.now() - start).toFixed(0)
    const total = os.totalmem()
    const used = total - os.freemem()
    const cpu = (os.loadavg()[0] / os.cpus().length * 100).toFixed(1)
    const uptime = formatUptime(process.uptime())

    // الرسالة الأولى - ESM Style
    const text1 = `📝 *سرعة البوت*\n\n› 🏓 البينج: ${latency}ms\n› ⚙️ المعالجة: ${processTime}ms\n› 🧠 الذاكرة: ${fmtSize(used)} / ${fmtSize(total)}\n› 💻 المعالج: ${cpu}%\n› ⏱️ التشغيل: ${uptime}`

    const msg1 = {
        interactiveMessage: {
            body: { text: text1 },
            footer: { text: "  " },
            nativeFlowMessage: {
                buttons: [
                    { name: "inapp_signup", buttonParamsJson: "{}" },
                    { name: "request_contact_info" },
                    { name: "cta_call", buttonParamsJson: JSON.stringify({ display_text: " ", phone_number: "628123456789" }) },
                    { name: "cta_cancel_reminder", buttonParamsJson: JSON.stringify({ display_text: " " }) },
                    { name: "call_permission_request", buttonParamsJson: JSON.stringify({ has_multiple_buttons: true }) }
                ],
                messageParamsJson: JSON.stringify({ limited_time_offer: { text: "Tarboo Bot ESM", url: "https://google.com/" } })
            },
            contextInfo: { forwardingScore: 999, isForwarded: true }
        }
    }

    await sock.relayMessage(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {},
                interactiveMessage: msg1.interactiveMessage
            }
        }
    }, {})

    // الرسالة الثانية - Header Style
    const text2 = `oba aja؟\n*همم، أعتقد أنك محتار.*\n\n⚡ ${latency}ms | 🧠 ${fmtSize(used)} | ⏱️ ${uptime}`

    const msg2 = {
        interactiveMessage: {
            header: { title: "Tarboo Bot" },
            body: { text: text2 },
            nativeFlowMessage: {
                buttons: [{ name: "inapp_signup", buttonParamsJson: "{}" }],
                messageParamsJson: ""
            },
            contextInfo: { forwardingScore: 999, isForwarded: true }
        }
    }

    await sock.relayMessage(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {},
                interactiveMessage: msg2.interactiveMessage
            }
        }
    }, {})
}

export { pluginConfig as config, handler }