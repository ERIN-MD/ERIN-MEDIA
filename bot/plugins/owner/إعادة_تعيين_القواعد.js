// إعادة تعيين القواعد - أمر لإعادة تعيين قواعد البوت إلى الوضع الافتراضي

import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'إعادة_تعيين_القواعد',
    alias: ['resetrules'],
    category: 'owner',
    description: 'إعادة تعيين قواعد البوت إلى الوضع الافتراضي',
    usage: '.إعادة_تعيين_القواعد',
    example: '.إعادة_تعيين_القواعد',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function handler(m) {
    const db = getDatabase()
    
    db.setting('botRules', null)
    
    m.reply(
        `✅ *تم إعادة تعيين قواعد البوت*\n\n` +
        `> تم إعادة تعيين قواعد البوت إلى الوضع الافتراضي!\n` +
        `> اكتب \`${m.prefix}القواعد\` للمشاهدة.`
    )
}

export { pluginConfig as config, handler }