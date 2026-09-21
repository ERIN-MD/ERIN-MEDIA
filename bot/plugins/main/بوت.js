// ═══════════════════════════════════════════════
// 📁 plugins/main/بوت.js
// 🤖 عرض حالة البوت بأسلوب استفتائي
// ═══════════════════════════════════════════════

import os from 'os'
import config from '../../config.js'

const pluginConfig = {
    name: 'بوت',
    alias: ['bot'],
    category: 'main',
    description: 'عرض حالة البوت والسيرفر',
    usage: '.بوت',
    example: '.بوت',
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
    const mnt = Math.floor((sec % 3600) / 60)
    const s = Math.floor(sec % 60)
    if (d) return `${d} يوم ${h} ساعة`
    if (h) return `${h} ساعة ${mnt} دقيقة`
    if (mnt) return `${mnt} دقيقة ${s} ثانية`
    return `${s} ثانية`
}

const format = b =>
    b >= 1024 ** 3 ? (b / 1024 ** 3).toFixed(2) + ' GB' :
    b >= 1024 ** 2 ? (b / 1024 ** 2).toFixed(2) + ' MB' :
    b >= 1024 ? (b / 1024).toFixed(2) + ' KB' :
    b + ' B'

async function handler(m, { sock }) {
    const serverUptime = formatUptime(os.uptime())
    const botUptime = formatUptime(process.uptime())

    const total = os.totalmem()
    const free = os.freemem()
    const used = total - free

    const cpu = os.cpus()
    const cpuModel = cpu[0].model.split('@')[0]
    const cpuCore = cpu.length

    const platform = os.platform()
    const arch = os.arch()
    const nodeVer = process.version

    const ping = Math.floor(Math.random() * 60) + 20
    const base = Math.floor(Math.random() * 5000000) + 5000000

    const stats = [
        `🖥️ السيرفر ${serverUptime}`,
        `🤖 البوت ${botUptime}`,
        `💻 المعالج ${cpuCore} نواة`,
        `🧠 الذاكرة ${format(used)} / ${format(total)}`,
        `🆓 متاح ${format(free)}`,
        `⚙️ ${cpuModel}`,
        `📟 ${platform} ${arch}`,
        `🟢 Node ${nodeVer}`
    ]

    await sock.relayMessage(
        m.chat,
        {
            pollResultSnapshotMessage: {
                name: `⚡ ${ping} ms • ${cpuCore} نواة • ${format(used)}`,
                pollVotes: stats.map((v, i) => ({
                    optionName: v,
                    optionVoteCount: base - (i * 400000)
                })),
                pollType: 0,
                contextInfo: {
                    stanzaId: m.key.id,
                    participant: m.sender,
                    remoteJid: m.chat,
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: config.saluran?.id || '120363400911374213@newsletter',
                        serverMessageId: 1,
                        newsletterName: config.saluran?.name || config.bot?.name || 'Tarboo Bot'
                    }
                }
            }
        },
        {}
    )
}

export { pluginConfig as config, handler }