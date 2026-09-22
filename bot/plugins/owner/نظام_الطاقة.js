// تعطيل/تفعيل الطاقة - أمر لتعطيل أو تفعيل نظام الطاقة

import { getDatabase } from '../../src/lib/maro-database.js'
import config from '../../config.js'

const pluginConfig = {
    name: ['تعطيل_الطاقة', 'تفعيل_الطاقة'],
    alias: ['disableenergi'],
    category: 'owner',
    description: 'تعطيل/تفعيل نظام الطاقة',
    usage: '.تعطيل_الطاقة أو .تفعيل_الطاقة',
    example: '.تعطيل_الطاقة',
    isOwner: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    const db = getDatabase()
    const cmd = m.command.toLowerCase()
    const isEnable = ['تفعيل_الطاقة', 'enableenergi'].includes(cmd)

    db.setting('energi', isEnable)
    db.save()

    await m.react(isEnable ? '⚡' : '🔌')
    return m.reply(
        isEnable
            ? '⚡ *تم تفعيل نظام الطاقة*\n\n> كل أمر الآن يتطلب طاقة.'
            : '🔌 *تم تعطيل نظام الطاقة*\n\n> الأوامر لم تعد تتطلب طاقة.'
    )
}

export { pluginConfig as config, handler }