import { createCanvas } from "@napi-rs/canvas"
import { performance } from "perf_hooks"
import { generateWAMessageFromContent } from "maro"
import sharp from "sharp"
import os from "os"
import fs from "fs"
import config from "../../config.js"

const pluginConfig = {
  name: "بينغ",
  alias: ["ping", "speed", "p", "latency", "sys", "status", "بنغ"],
  category: "main",
  description: "فحص أداء وحالة نظام البوت",
  usage: ".بينغ",
  example: ".بينغ",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
}

function fmtSize(b) {
  if (!b || b === 0) return "0 B"
  const u = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(b) / Math.log(1024))
  return (b / Math.pow(1024, i)).toFixed(2) + " " + u[i]
}

function fmtUp(s) {
  s = Number(s)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sc = Math.floor(s % 60)
  
  let res = []
  if (d > 0) res.push(`${d} يوم`)
  if (h > 0) res.push(`${h} ساعة`)
  if (m > 0) res.push(`${m} دقيقة`)
  if (sc > 0) res.push(`${sc} ثانية`)
  return res.length > 0 ? res.join(" ") : "0s"
}

function bar(percent) {
  const p = Math.min(Math.max(Math.round(percent), 0), 100)
  const filled = Math.round(p / 10)
  return "▓".repeat(filled) + "░".repeat(10 - filled)
}

function getDiskUsage() {
  try {
    const stat = fs.statfsSync(process.cwd())
    const total = stat.blocks * stat.bsize
    const free = stat.bfree * stat.bsize
    const used = total - free
    const pct = ((used / total) * 100).toFixed(1)
    return { total, used, free, pct }
  } catch {
    return { total: 0, used: 0, free: 0, pct: "0" }
  }
}

// ═══════════════════════════════════
// 🖼️ صورة بالانجليزي
// ═══════════════════════════════════
function drawCyberBox(ctx, x, y, w, h, title, glowColor) {
  const boxGradient = ctx.createLinearGradient(x, y, x, y + h)
  boxGradient.addColorStop(0, "rgba(30, 41, 59, 0.8)")
  boxGradient.addColorStop(1, "rgba(15, 23, 42, 0.6)")

  ctx.fillStyle = boxGradient
  ctx.fillRect(x, y, w, h)

  ctx.lineWidth = 1
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
  ctx.strokeRect(x, y, w, h)

  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + w, y)
  ctx.lineWidth = 4
  ctx.strokeStyle = glowColor
  ctx.shadowBlur = 20
  ctx.shadowColor = glowColor
  ctx.stroke()
  ctx.shadowBlur = 0

  ctx.fillStyle = glowColor
  ctx.font = "bold 22px sans-serif"
  ctx.fillText(`⌖ ${title.toUpperCase()}`, x + 20, y + 35)
}

function drawGauge(ctx, x, y, radius, percentage, color, label) {
  ctx.beginPath()
  ctx.arc(x, y, radius, 0.75 * Math.PI, 2.25 * Math.PI)
  ctx.lineWidth = 30
  ctx.strokeStyle = "rgba(255, 255, 255, 0.03)"
  ctx.lineCap = "round"
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(x, y, radius, 0.75 * Math.PI, 0.75 * Math.PI + 1.5 * Math.PI * (percentage / 100))
  ctx.lineWidth = 30

  const grad = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius)
  grad.addColorStop(0, color)
  grad.addColorStop(1, "#ffffff")

  ctx.strokeStyle = grad
  ctx.shadowBlur = 25
  ctx.shadowColor = color
  ctx.lineCap = "round"
  ctx.stroke()
  ctx.shadowBlur = 0

  ctx.fillStyle = "#ffffff"
  ctx.font = "bold 70px sans-serif"
  ctx.textAlign = "center"
  ctx.shadowBlur = 15
  ctx.shadowColor = color
  ctx.fillText(`${percentage}%`, x, y + 15)
  ctx.shadowBlur = 0

  ctx.fillStyle = color
  ctx.font = "bold 24px sans-serif"
  ctx.fillText(label, x, y + 60)
  ctx.textAlign = "left"
}

async function createEpicPingCanvas(data, botName, ownerName) {
  const width = 1200
  const height = 800
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")

  const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 100, width / 2, height / 2, width)
  bgGrad.addColorStop(0, "#0f172a")
  bgGrad.addColorStop(1, "#020617")
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = "rgba(56, 189, 248, 0.04)"
  ctx.lineWidth = 1
  for (let i = 0; i < width; i += 40) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke()
  }
  for (let i = 0; i < height; i += 40) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke()
  }

  ctx.fillStyle = "#38bdf8"
  ctx.font = "bold 50px sans-serif"
  ctx.shadowBlur = 20
  ctx.shadowColor = "#38bdf8"
  ctx.fillText(`${botName} - SYSTEM DIAGNOSTICS`, 50, 70)
  ctx.shadowBlur = 0

  ctx.fillStyle = "#cbd5e1"
  ctx.font = "bold 24px Courier New"
  ctx.fillText(`STATUS: ONLINE | OWNER: ${ownerName}`, 50, 110)

  ctx.beginPath()
  ctx.moveTo(50, 130)
  ctx.lineTo(width - 50, 130)
  ctx.lineWidth = 3
  const lineGrad = ctx.createLinearGradient(50, 130, width - 50, 130)
  lineGrad.addColorStop(0, "#38bdf8")
  lineGrad.addColorStop(0.5, "#c084fc")
  lineGrad.addColorStop(1, "transparent")
  ctx.strokeStyle = lineGrad
  ctx.stroke()

  const col1X = 50, colWidth = 330

  drawCyberBox(ctx, col1X, 160, colWidth, 180, "LATENCY PING", "#4ade80")
  const pingColor = data.ping < 100 ? "#4ade80" : data.ping < 500 ? "#facc15" : "#f87171"
  ctx.fillStyle = pingColor
  ctx.font = "bold 70px sans-serif"
  ctx.textAlign = "center"
  ctx.shadowBlur = 20
  ctx.shadowColor = pingColor
  ctx.fillText(`${data.ping}`, col1X + colWidth / 2 - 20, 260)
  ctx.shadowBlur = 0
  ctx.font = "bold 30px sans-serif"
  ctx.fillText(`ms`, col1X + colWidth / 2 + ctx.measureText(`${data.ping}`).width / 2 + 10, 260)
  ctx.textAlign = "left"
  ctx.fillStyle = "#cbd5e1"
  ctx.font = "bold 18px sans-serif"
  const pStatus = data.ping < 100 ? "EXCELLENT" : data.ping < 500 ? "MODERATE" : "POOR"
  ctx.fillText(`CONNECTION: ${pStatus}`, col1X + 20, 310)

  drawCyberBox(ctx, col1X, 360, colWidth, 230, "CPU PROCESSOR", "#fbbf24")
  ctx.fillStyle = "#94a3b8"
  ctx.font = "bold 20px sans-serif"
  ctx.fillText(`Cores:`, col1X + 20, 520)
  ctx.fillStyle = "#fbbf24"
  ctx.fillText(`${data.cpuCores} Threads`, col1X + 110, 520)
  ctx.fillStyle = "#94a3b8"
  ctx.fillText(`Speed:`, col1X + 20, 555)
  ctx.fillStyle = "#fbbf24"
  ctx.fillText(`${data.cpuSpeed} MHz`, col1X + 110, 555)

  drawCyberBox(ctx, col1X, 610, colWidth, 140, "SYSTEM LOAD", "#f43f5e")
  ctx.fillStyle = "#f8fafc"
  ctx.font = "bold 24px Courier New"
  ctx.fillText(`1m:  ${data.load[0]}`, col1X + 20, 680)
  ctx.fillText(`5m:  ${data.load[1]}`, col1X + 20, 710)
  ctx.fillText(`15m: ${data.load[2]}`, col1X + 180, 680)

  const col2X = 410, col2Width = 380
  const gaugeX = col2X + col2Width / 2
  const gaugeY = 380

  ctx.fillStyle = "#c084fc"
  ctx.font = "bold 30px sans-serif"
  ctx.textAlign = "center"
  ctx.shadowBlur = 10
  ctx.shadowColor = "#c084fc"
  ctx.fillText("MEMORY USAGE", gaugeX, 200)
  ctx.shadowBlur = 0
  ctx.textAlign = "left"

  drawGauge(ctx, gaugeX, gaugeY, 140, data.memPct, "#c084fc", "USED RAM")

  ctx.fillStyle = "#94a3b8"
  ctx.font = "bold 22px sans-serif"
  ctx.textAlign = "center"
  ctx.fillText(`Used: ${fmtSize(data.usedMem)}`, gaugeX, 580)
  ctx.fillText(`Free: ${fmtSize(data.freeMem)}`, gaugeX, 615)
  ctx.fillStyle = "#f8fafc"
  ctx.font = "bold 28px sans-serif"
  ctx.fillText(`TOTAL: ${fmtSize(data.totalMem)}`, gaugeX, 660)
  ctx.textAlign = "left"

  const col3X = 820, col3Width = 330

  drawCyberBox(ctx, col3X, 160, col3Width, 230, "NODE.JS ENGINE", "#38bdf8")
  const nY = 220
  const nColor = "#38bdf8"
  ctx.fillStyle = "#94a3b8"; ctx.font = "bold 20px sans-serif"
  ctx.fillText(`RSS:`, col3X + 20, nY); ctx.fillStyle = nColor; ctx.fillText(fmtSize(data.memNode.rss), col3X + 140, nY)
  ctx.fillStyle = "#94a3b8"; ctx.fillText(`Heap Used:`, col3X + 20, nY + 35); ctx.fillStyle = nColor; ctx.fillText(fmtSize(data.memNode.heapUsed), col3X + 140, nY + 35)
  ctx.fillStyle = "#94a3b8"; ctx.fillText(`Heap Total:`, col3X + 20, nY + 70); ctx.fillStyle = nColor; ctx.fillText(fmtSize(data.memNode.heapTotal), col3X + 140, nY + 70)
  ctx.fillStyle = "#94a3b8"; ctx.fillText(`V8 Engine:`, col3X + 20, nY + 105); ctx.fillStyle = "#f8fafc"; ctx.fillText(data.v8, col3X + 140, nY + 105)

  drawCyberBox(ctx, col3X, 410, col3Width, 180, "SYSTEM SPECS", "#a855f7")
  const osY = 470
  ctx.fillStyle = "#94a3b8"; ctx.font = "bold 20px sans-serif"
  ctx.fillText(`OS:`, col3X + 20, osY); ctx.fillStyle = "#f8fafc"; ctx.fillText(`${data.osType} ${data.osRel}`, col3X + 80, osY)
  ctx.fillStyle = "#94a3b8"; ctx.fillText(`Arch:`, col3X + 20, osY + 35); ctx.fillStyle = "#f8fafc"; ctx.fillText(`${data.osPlatform} (${data.osArch})`, col3X + 80, osY + 35)
  ctx.fillStyle = "#94a3b8"; ctx.fillText(`Node:`, col3X + 20, osY + 70); ctx.fillStyle = "#f8fafc"; ctx.fillText(`${data.nodeVer}`, col3X + 80, osY + 70)

  drawCyberBox(ctx, col3X, 610, col3Width, 140, "UPTIME", "#ec4899")
  ctx.fillStyle = "#94a3b8"; ctx.font = "bold 20px sans-serif"
  ctx.fillText(`Server:`, col3X + 20, 670); ctx.fillStyle = "#ec4899"; ctx.font = "bold 22px sans-serif"; ctx.fillText(data.upOS, col3X + 100, 670)
  ctx.fillStyle = "#94a3b8"; ctx.font = "bold 20px sans-serif"
  ctx.fillText(`Bot:`, col3X + 20, 715); ctx.fillStyle = "#ec4899"; ctx.font = "bold 22px sans-serif"; ctx.fillText(data.upBot, col3X + 100, 715)

  return canvas.toBuffer("image/png")
}

// ═══════════════════════════════════
// 📝 النص بالعربي
// ═══════════════════════════════════
async function handler(m, { sock }) {
  const tStart = performance.now()

  const cpus = os.cpus()
  const loadAvg = os.loadavg()
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem
  const memPct = ((usedMem / totalMem) * 100).toFixed(1)
  const disk = getDiskUsage()

  const loadPct = ((loadAvg[0] / cpus.length) * 100).toFixed(1)
  const cpuSpeedGHz = cpus[0]?.speed ? (cpus[0].speed / 1000).toFixed(2) : "?"
  const cpuModel = cpus[0]?.model || "معالج غير معروف"

  const tEnd = performance.now()
  const ping = (tEnd - tStart).toFixed(0)

  const timeStr = new Date().toLocaleTimeString("ar-EG", { timeZone: "Africa/Cairo" })

  const data = {
    ping,
    cpuCores: cpus.length,
    cpuSpeed: cpus[0]?.speed || 0,
    load: [loadAvg[0].toFixed(2), loadAvg[1].toFixed(2), loadAvg[2].toFixed(2)],
    totalMem, freeMem, usedMem, memPct,
    memNode: process.memoryUsage(),
    osType: os.type(),
    osRel: os.release(),
    osPlatform: os.platform(),
    osArch: os.arch(),
    nodeVer: process.version,
    v8: process.versions.v8,
    upOS: fmtUp(os.uptime()),
    upBot: fmtUp(process.uptime()),
  }

  await m.react("🕕")

  const botName = config.bot?.name || "مارو"
  const ownerName = config.owner?.name || "مارو"
  const prefix = m.prefix || "."
  const botVersion = config.bot?.version || "3.0.0"

  let thumbnail = null
  try {
    const canvasBuffer = await createEpicPingCanvas(data, botName, ownerName)
    thumbnail = await sharp(canvasBuffer).resize(300, 170).toBuffer()
  } catch (e) {
    console.error("[Ping] Canvas error:", e.message)
  }

  const pingEmoji = ping < 100 ? '🟢' : ping < 500 ? '🟡' : '🔴'
  const memEmoji = memPct < 60 ? '🟢' : memPct < 85 ? '🟡' : '🔴'
  const diskEmoji = disk.pct < 60 ? '🟢' : disk.pct < 85 ? '🟡' : '🔴'
  const loadEmoji = loadPct < 60 ? '🟢' : loadPct < 85 ? '🟡' : '🔴'

  const contentText =
`╭━━━━━━━━━━━━━━━━━━━━╮
┃   ⚡ *${botName} - تشخيص النظام* ⚡
╰━━━━━━━━━━━━━━━━━━━━╯

👤 *المطور* : ${ownerName}
📦 *الإصدار* : v${botVersion}

${pingEmoji} *سرعة الاستجابة* : ${ping} مللي
⏱️ *مدة التشغيل* : ${data.upBot}
🕒 *الوقت* : ${timeStr}

╭─「 💾 *الذاكرة* 」
│ 📦 *الإجمالي* : ${fmtSize(totalMem)}
│ 🔥 *المستخدم* : ${fmtSize(usedMem)}
│ ✨ *المتاح* : ${fmtSize(freeMem)}
│ ${bar(memPct)} ${memEmoji} ${memPct}%
╰───────────────

╭─「 💿 *المساحة* 」
│ 📦 *الإجمالي* : ${disk.total ? fmtSize(disk.total) : "غير معروف"}
│ 🔥 *المستخدم* : ${disk.used ? fmtSize(disk.used) : "غير معروف"}
│ ✨ *المتاح* : ${disk.free ? fmtSize(disk.free) : "غير معروف"}
│ ${bar(disk.pct)} ${diskEmoji} ${disk.pct}%
╰───────────────

╭─「 ⚙️ *المعالج* 」
│ 💻 *الموديل* : ${cpuModel}
│ ⚡ *السرعة* : ${cpuSpeedGHz} جيجاهرتز
│ 🎛️ *الأنوية* : ${cpus.length} نواة
│ 📊 *الضغط* : ${loadPct}%
│ ${bar(loadPct)} ${loadEmoji} ${loadPct}%
╰───────────────

╭─「 🤖 *النظام* 」
│ 🖥️ *OS* : ${data.osType} (${data.osArch})
│ 🟢 *Node.js* : ${process.version}
│ 🏷️ *الإصدار* : v${botVersion}
╰───────────────`

  const footerText = `© ${botName.toUpperCase()} • ${ownerName}`

  const content = {
    buttonsMessage: {
      buttons: [
        {
          buttonId: `${prefix}${m.command}`,
          buttonText: { displayText: "🔄 تحديث" },
          type: 1,
        },
        {
          buttonId: `${prefix}menu`,
          buttonText: { displayText: "📋 القائمة" },
          type: 1,
        },
      ],
      ...(thumbnail ? {
        locationMessage: {
          jpegThumbnail: thumbnail,
          name: `— 「 ${botName} System 」 —`,
          address: `⚡ ${ping}ms  •  💾 ${memPct}% RAM  •  🟢 Online`,
        },
      } : {}),
      contentText,
      footerText,
      headerType: thumbnail ? 6 : 1,
      contextInfo: {},
    },
  }

  const msg = generateWAMessageFromContent(m.chat, content, { userJid: sock.user.jid })
  await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })

  await m.react("✅")
}

export { pluginConfig as config, handler }