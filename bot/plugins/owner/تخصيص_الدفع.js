import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
  name: 'تخصيص_الدفع',
  alias: ['custompayment'],
  category: 'owner',
  description: 'تخصيص نص الدفع مع متغيرات',
  usage: '.تخصيص_الدفع <نص> / .تخصيص_الدفع reset',
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true
}

async function handler(m) {
  const db = getDatabase()
  const input = m.text?.trim()
  const current = db.setting('customPaymentText') || ''

  if (!input) {
    return m.reply(
      `📝 *تخصيص نص الدفع*\n\n` +
      `النص الحالي:\n${current || '_(لم يتم التخصيص بعد، يستخدم الافتراضي)_'}\n\n` +
      `*المتغيرات المتاحة:*\n` +
      `• \`{botname}\` — اسم البوت\n` +
      `• \`{owner}\` — اسم المالك\n` +
      `• \`{methods}\` — قائمة المحافظ\n` +
      `• \`{banks}\` — قائمة البنوك\n` +
      `• \`{qris}\` — حالة QRIS\n\n` +
      `*مثال:*\n` +
      `> \`${m.prefix}تخصيص_الدفع مرحباً! ادفع عبر {methods}\`\n\n` +
      `> \`${m.prefix}تخصيص_الدفع reset\` — العودة للافتراضي`
    )
  }

  if (input.toLowerCase() === 'reset') {
    db.setting('customPaymentText', '')
    return m.reply('✅ تم إعادة تعيين نص الدفع المخصص إلى الافتراضي.')
  }

  db.setting('customPaymentText', input)
  return m.reply(`✅ تم حفظ نص الدفع المخصص!\n\nمعاينة:\n${input}`)
}

export { pluginConfig as config, handler }