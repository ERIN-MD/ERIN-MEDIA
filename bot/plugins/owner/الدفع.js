// الدفع - أمر لعرض معلومات الدفع

import config from '../../config.js'
import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
  name: 'الدفع',
  alias: ['payment'],
  category: 'owner',
  description: 'عرض معلومات الدفع',
  usage: '.الدفع',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true
}

function buildPaymentText(paymentCfg, customText, botName, ownerName) {
  const methods = (paymentCfg.methods || []).filter(m => m.number)
  const banks = (paymentCfg.banks || []).filter(b => b.number)

  if (customText) {
    return customText
      .replace(/\{botname\}/gi, botName)
      .replace(/\{owner\}/gi, ownerName)
      .replace(/\{methods\}/gi, methods.map(m => `• *${m.name}*: ${m.number} (${m.holder || m.name})`).join('\n'))
      .replace(/\{banks\}/gi, banks.map(b => `• *${b.name}*: ${b.number} (${b.holder || b.name})`).join('\n'))
      .replace(/\{qris\}/gi, paymentCfg.qrisUrl ? '✅ متوفر' : '❌ غير مضبوط')
  }

  let text = `💳 *الدفع*\n`
  text += `━━━━━━━━━━━━━━━━━━\n\n`

  if (methods.length > 0) {
    text += `📱 *المحافظ الإلكترونية:*\n`
    for (const m of methods) {
      text += `├─ • *${m.name}*\n`
      text += `│  \`${m.number}\`\n`
      if (m.holder) text += `│  باسم: ${m.holder}\n`
    }
    text += `\n`
  }

  if (banks.length > 0) {
    text += `🏦 *التحويل البنكي:*\n`
    for (const b of banks) {
      text += `├─ • *${b.name}*\n`
      text += `│  \`${b.number}\`\n`
      if (b.holder) text += `│  باسم: ${b.holder}\n`
    }
    text += `\n`
  }

  if (paymentCfg.qrisUrl) {
    text += `📸 *QRIS:* متوفر (انظر الصورة)\n\n`
  }

  text += `━━━━━━━━━━━━━━━━━━\n`
  text += `> ${botName}`

  return text
}

async function handler(m, { sock }) {
  const db = getDatabase()
  const paymentCfg = config.payment || {}
  const customText = db.setting('customPaymentText') || paymentCfg.customText || ''
  const botName = config.bot?.name || 'البوت'
  const ownerName = config.owner?.name || 'المالك'

  const text = buildPaymentText(paymentCfg, customText, botName, ownerName)

  if (paymentCfg.qrisUrl) {
    try {
      await sock.sendMessage(m.chat, {
        image: { url: paymentCfg.qrisUrl },
        caption: text
      }, { quoted: m })
      return
    } catch {}
  }

  await sock.sendMessage(m.chat, { text }, { quoted: m })
}

export { pluginConfig as config, handler }