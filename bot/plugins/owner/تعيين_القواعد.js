// تعيين القواعد - أمر لتعيين قواعد البوت المخصصة

import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'تعيين_القواعد',
    alias: ['setrules'],
    category: 'owner',
    description: 'تعيين قواعد البوت المخصصة',
    usage: '.تعيين_القواعد <النص>',
    example: '.تعيين_القواعد 1. لا ترسل سبام\n2. احترم الآخرين',
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
    const text = m.text?.trim() || (m.quoted?.body || m.quoted?.text || '')
    
    if (!text) {
        return m.reply(
            `📝 *تعيين قواعد البوت*\n\n` +
            `> أدخل نص القواعد الجديد\n\n` +
            `\`مثال:\`\n` +
            `\`${m.prefix}تعيين_القواعد 1. لا ترسل سبام\\n2. احترم الآخرين\``
        )
    }
    
    db.setting('botRules', text)
    
    m.reply(
        `✅ *تم تحديث قواعد البوت*\n\n` +
        `> تم تغيير قواعد البوت بنجاح!\n` +
        `> اكتب \`${m.prefix}القواعد\` للمشاهدة.`
    )
}

export { pluginConfig as config, handler }