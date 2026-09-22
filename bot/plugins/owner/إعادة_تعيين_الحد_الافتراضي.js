// إعادة تعيين الحد الافتراضي - أمر لإعادة تعيين الحد الافتراضي إلى الإعدادات الأصلية

import { getDatabase } from '../../src/lib/maro-database.js'
import config from '../../config.js'

const pluginConfig = {
    name: 'إعادة_تعيين_الحد_الافتراضي',
    alias: ['resetlimitdefault'],
    category: 'owner',
    description: 'إعادة تعيين الحد الافتراضي إلى الإعدادات الأصلية',
    usage: '.إعادة_تعيين_الحد_الافتراضي',
    example: '.إعادة_تعيين_الحد_الافتراضي',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const configDefault = config.limits?.default || 25
    
    db.setting('defaultLimit', null)
    
    await m.reply(
        `✅ *تم بنجاح*\n\n` +
        `> تم إعادة تعيين الحد الافتراضي إلى الإعدادات: \`${configDefault}\`\n` +
        `> سيحصل المستخدمون الجدد على الحد من الإعدادات`
    )
}

export { pluginConfig as config, handler }