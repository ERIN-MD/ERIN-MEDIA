// ═══════════════════════════════════════════════
// 📁 plugins/owner/طلب.js
// 🌐 أداة طلب HTTP - عرض الرد في جدول
// ═══════════════════════════════════════════════

import config from "../../config.js";
import axios from "axios";
import { AIRich } from '../../src/lib/maro-builder.js'

const pluginConfig = {
  name: "طلب",
  alias: ["get", "fetch", "http"],
  category: "owner",
  description: "أداة طلبات HTTP مع عرض الرد في جدول",
  usage: ".طلب <رابط>",
  example: '.طلب https://api.example.com',
  isOwner: true,
  cooldown: 3,
  isEnabled: true,
};

function formatSize(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 2 : 0)} ${units[i]}`;
}

async function handler(m, { sock, text }) {
  if (!text) {
    return m.reply(`🌐 *طلب HTTP*\n\n📝 .طلب <رابط>\n💡 .طلب https://api.example.com`)
  }

  let url = text.trim()
  if (!url.startsWith("http")) url = "https://" + url

  m.react('⏳')

  try {
    const startTime = Date.now()
    const response = await axios.get(url, { responseType: "arraybuffer", timeout: 30000 })
    const elapsed = Date.now() - startTime
    const contentType = response.headers["content-type"] || ""
    const buffer = Buffer.from(response.data)
    const size = buffer.length

    let body = ""
    try {
      body = buffer.toString("utf8")
      if (body.length > 3000) body = body.substring(0, 3000) + "\n... (مقتطع)"
    } catch {}

    const msg = new AIRich(sock)
    msg.setTitle(`🌐 HTTP ${response.status}`)
    msg.addText(`📡 *الرابط:* ${url}`)
    msg.addTable([
      ["المعلومة", "القيمة"],
      ["📊 الحالة", String(response.status)],
      ["⏱️ الوقت", `${elapsed}ms`],
      ["📦 الحجم", formatSize(size)],
      ["📄 النوع", contentType || "غير معروف"]
    ])
    
    if (body) {
      msg.addCode("json", body)
    }

    await msg.send(m.chat, { quoted: m })
    m.react('✅')

  } catch (e) {
    m.react('❌')
    await m.reply(`❌ *فشل*\n\`\`\`\n${e.message}\n\`\`\``)
  }
}

export { pluginConfig as config, handler }