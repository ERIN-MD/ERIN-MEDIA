import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
  name: 'تأخير_النشر_الخاص',
  alias: ['bcpcjeda'],
  category: 'owner',
  description: 'ضبط فترة التأخير بين كل إرسال في النشر الخاص',
  usage: '.تأخير_النشر_الخاص <الوقت> (مثال: 5s, 2m, 1h)',
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true
}

function parseDelay(input) {
  if (!input) return null
  const match = input.match(/^(\d+)(s|m|h|d)$/i)
  if (!match) return null
  const val = parseInt(match[1])
  const unit = match[2].toLowerCase()
  switch (unit) {
    case 's': return val * 1000
    case 'm': return val * 60 * 1000
    case 'h': return val * 60 * 60 * 1000
    case 'd': return val * 24 * 60 * 60 * 1000
    default: return null
  }
}

function formatDelay(ms) {
  if (ms >= 86400000) return `${(ms / 86400000).toFixed(0)} يوم`
  if (ms >= 3600000) return `${(ms / 3600000).toFixed(0)} ساعة`
  if (ms >= 60000) return `${(ms / 60000).toFixed(0)} دقيقة`
  return `${(ms / 1000).toFixed(0)} ثانية`
}

async function handler(m) {
  const db = getDatabase()
  const input = m.text?.trim()
  const current = db.setting('jedaBcpc') || 5000

  if (!input) {
    return m.reply(
      `⏱️ *تأخير النشر الخاص*\n\n` +
      `التأخير الحالي: *${formatDelay(current)}* (${current}ms)\n\n` +
      `*طريقة الاستخدام:*\n` +
      `> \`${m.prefix}تأخير_النشر_الخاص <رقم><وحدة>\`\n\n` +
      `*الوحدات:*\n` +
      `• \`s\` — ثانية\n• \`m\` — دقيقة\n• \`h\` — ساعة\n• \`d\` — يوم\n\n` +
      `*مثال:*\n` +
      `> \`${m.prefix}تأخير_النشر_الخاص 5s\` → 5 ثواني\n` +
      `> \`${m.prefix}تأخير_النشر_الخاص 2m\` → دقيقتين\n` +
      `> \`${m.prefix}تأخير_النشر_الخاص 1h\` → ساعة`
    )
  }

  const ms = parseDelay(input)
  if (!ms || ms < 1000) {
    return m.reply('❌ صيغة خاطئة. مثال: `5s`, `2m`, `1h`, `1d`')
  }

  const prev = current
  db.setting('jedaBcpc', ms)

  return m.reply(
    `✅ *تم تغيير تأخير النشر الخاص*\n\n` +
    `السابق: *${formatDelay(prev)}*\n` +
    `الحالي: *${formatDelay(ms)}*`
  )
}

export { pluginConfig as config, handler }