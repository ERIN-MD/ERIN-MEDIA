// ═══════════════════════════════════════════════
// 📁 plugins/main/ping2.js
// ⚡ فحص أداء النظام - Tarboo Bot (جدول)
// ═══════════════════════════════════════════════

import os from 'os'
import { performance } from 'perf_hooks'
import { execSync } from 'child_process'
import config from '../../config.js'
import { getDatabase } from '../../src/lib/maro-database.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'بينغ2',
    alias: ['ping2', 'status2'],
    category: 'main',
    description: 'فحص أداء النظام في جدول',
    usage: '.فحص',
    example: '.فحص',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const fmtSize = (b) => {
    if (!b || b === 0) return '0 بايت'
    const u = ['بايت', 'ك.ب', 'م.ب', 'ج.ب', 'ت.ب']
    const i = Math.floor(Math.log(b) / Math.log(1024))
    return (b / Math.pow(1024, i)).toFixed(1) + ' ' + u[i]
}

const fmtUp = (s) => {
    s = Number(s)
    const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sc = Math.floor(s % 60)
    if (d > 0) return `${d} يوم ${h} ساعة`
    if (h > 0) return `${h} ساعة ${m} دقيقة`
    return `${m} دقيقة ${sc} ثانية`
}

function getNetwork() {
    try {
        const ifaces = os.networkInterfaces()
        let active = 'غير معروف'
        for (const [name, addrs] of Object.entries(ifaces)) {
            if (name.toLowerCase().includes('lo')) continue
            for (const a of addrs) {
                if (a.family === 'IPv4' && !a.internal) {
                    active = name
                    break
                }
            }
        }
        return { iface: active }
    } catch {
        return { iface: 'غير معروف' }
    }
}

async function handler(m, { sock }) {
    const execStart = performance.now()
    m.react('⏳')

    try {
        const t0 = m.messageTimestamp ? (m.messageTimestamp * 1000) : Date.now()
        const waRoundtrip = Math.max(1, Date.now() - t0)

        const cpus = os.cpus()
        const totalMem = os.totalmem()
        const freeMem = os.freemem()

        let cpuPct = Math.max(1, Math.min(100, os.loadavg()[0] / cpus.length * 100)).toFixed(1)

        let diskTotal = 0, diskUsed = 0
        try {
            if (process.platform === 'win32') {
                const w = execSync("wmic logicaldisk where \"DeviceID='C:'\" get Size,FreeSpace /format:value", { encoding: 'utf-8' })
                const fm = w.match(/FreeSpace=(\d+)/), sm = w.match(/Size=(\d+)/)
                if (sm && fm) {
                    diskTotal = parseInt(sm[1])
                    diskUsed = diskTotal - parseInt(fm[1])
                }
            } else {
                const df = execSync('df -k --output=size,used /').toString().trim().split('\n')
                if (df.length > 1) {
                    const p = df[1].trim().split(/\s+/).map(Number)
                    if (p.length >= 2) {
                        diskTotal = p[0] * 1024
                        diskUsed = p[1] * 1024
                    }
                }
            }
        } catch {}

        const heap = process.memoryUsage()
        const net = getNetwork()

        let dbUsers = 0, dbGroups = 0, dbPremium = 0
        try {
            const db = getDatabase()
            if (db?.data) {
                dbUsers = Object.keys(db.data.users || {}).length
                dbGroups = Object.keys(db.data.groups || {}).length
                dbPremium = Object.values(db.data.users || {}).filter(u => u.isPremium).length
            }
        } catch {}

        const totalExec = Math.round(performance.now() - execStart)

        const tableData = [
            ['⏱️ سرعة واتساب', `${waRoundtrip} ms`],
            ['⚡ سرعة الاستجابة', `${totalExec} ms`],
            ['📊 الحالة', '🟢 متصل'],
            ['🏠 المضيف', os.hostname()],
            ['💻 المنصة', `${os.platform()} ${os.arch()}`],
            ['🟢 Node.js', process.version],
            ['🖥️ المعالج', `${cpus[0]?.model?.slice(0, 25)}`],
            ['🔢 الأنوية', `${cpus.length}`],
            ['📈 حمل المعالج', `${cpuPct}%`],
            ['🧠 الذاكرة', `${fmtSize(totalMem - freeMem)} / ${fmtSize(totalMem)}`],
            ['📦 Heap', `${fmtSize(heap.heapUsed)} / ${fmtSize(heap.heapTotal)}`],
            ['💾 القرص', `${fmtSize(diskUsed)} / ${fmtSize(diskTotal)}`],
            ['🌐 الشبكة', net.iface],
            ['👥 المستخدمين', `${dbUsers}`],
            ['💎 المميزين', `${dbPremium}`],
            ['👥 المجموعات', `${dbGroups}`],
            ['⏱️ تشغيل البوت', fmtUp(process.uptime())],
            ['⏱️ تشغيل السيرفر', fmtUp(os.uptime())],
        ]

        await sock.sendTable(
            m.chat,
            '⚡ أداء النظام',
            ['البيان', 'القيمة'],
            tableData,
            m,
            {
                headerText: `🖥️ *${config.bot?.name || 'Tarboo Bot'}* — حالة النظام\n\n📊 إحصائيات وأداء السيرفر`,
                footer: '🍃 مراقبة مباشرة'
            }
        )

        m.react('✅')
    } catch (error) {
        m.react('❌')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }