import moment from 'moment-timezone'
import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'غائب',
    alias: ['botafk'],
    category: 'owner',
    description: 'وضع الغياب للبوت - البوت لا يستجيب للأوامر، فقط يرد برسالة غياب',
    usage: '.غائب <السبب>',
    example: '.غائب في استراحة',
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
    const currentAfk = db.setting('botAfk')
    
    if (currentAfk && currentAfk.active) {
        db.setting('botAfk', { active: false })
        await m.react('✅')
        
        const afkDuration = Date.now() - currentAfk.since
        const duration = formatDuration(afkDuration)
        
        return m.reply(
            `✅ *عاد البوت للإتصال*\n\n` +
            `╭┈┈⬡「 📊 *إحصائيات الغياب* 」\n` +
            `┃ ⏱️ المدة: \`${duration}\`\n` +
            `┃ 📝 السبب: \`${currentAfk.reason || '-'}\`\n` +
            `╰┈┈⬡\n\n` +
            `> البوت جاهز لاستقبال الأوامر!`
        )
    } else {
        const reason = m.args.join(' ') || 'غائب'
        
        db.setting('botAfk', {
            active: true,
            reason: reason,
            since: Date.now()
        })
        
        await m.react('💤')
        return m.reply(
            `💤 *تم تفعيل وضع الغياب*\n\n` +
            `╭┈┈⬡「 📋 *معلومات* 」\n` +
            `┃ 📝 السبب: \`${reason}\`\n` +
            `┃ ⏰ منذ: \`${moment().tz('Asia/Jakarta').format('HH:mm:ss')}\`\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 🔒 *الصلاحيات* 」\n` +
            `┃ ✅ مالك البوت\n` +
            `┃ ✅ البوت نفسه (fromMe)\n` +
            `┃ ❌ جميع المستخدمين الآخرين\n` +
            `╰┈┈⬡\n\n` +
            `> المستخدمون الآخرون سيحصلون على رسالة غياب\n` +
            `> اكتب \`${m.prefix}غائب\` للعودة للإتصال`
        )
    }
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days} يوم ${hours % 24} ساعة`
    if (hours > 0) return `${hours} ساعة ${minutes % 60} دقيقة`
    if (minutes > 0) return `${minutes} دقيقة ${seconds % 60} ثانية`
    return `${seconds} ثانية`
}

export { pluginConfig as config, handler }