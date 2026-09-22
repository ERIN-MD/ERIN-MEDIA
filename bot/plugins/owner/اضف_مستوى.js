import { getDatabase } from '../../src/lib/maro-database.js'
import { calculateLevel, getRole, addExpWithLevelCheck } from './../../src/lib/maro-level.js'

const pluginConfig = {
    name: 'اضف_مستوى',
    alias: ['addlevel'],
    category: 'owner',
    description: 'إضافة مستوى لمستخدم (عبر الخبرة)',
    usage: '.اضف_مستوى <الكمية> @المستخدم',
    example: '.اضف_مستوى 5 @المستخدم',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

function extractTarget(m) {
    if (m.quoted) return m.quoted.sender
    if (m.mentionedJid?.length) return m.mentionedJid[0]
    return null
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args
    
    const numArg = args.find(a => !isNaN(a) && !a.startsWith('@'))
    let levels = parseInt(numArg) || 0
    
    let targetJid = await extractTarget(m)
    
    if (!targetJid && levels > 0) {
        targetJid = m.sender
    }
    
    if (!targetJid || levels <= 0) {
        return m.reply(
            `📊 *إضافة مستوى*\n\n` +
            `╭┈┈⬡「 📋 *الاستخدام* 」\n` +
            `┃ > \`.اضف_مستوى <الكمية>\` - لنفسك\n` +
            `┃ > \`.اضف_مستوى <الكمية> @المستخدم\` - لشخص آخر\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> مثال: \`${m.prefix}اضف_مستوى 5\``
        )
    }
    
    if (levels <= 0) {
        return m.reply(`❌ *فشل*\n\n> كمية المستويات يجب أن تكون أكثر من 0`)
    }
    
    const user = db.getUser(targetJid) || db.setUser(targetJid)
    
    const oldLevel = calculateLevel(user.exp || 0)
    const expToAdd = levels * 20000
    
    const addResult = addExpWithLevelCheck(sock, m, db, user, expToAdd)
    
    await m.react('✅')
    
    await m.reply(
        `✅ تمت إضافة *${levels} مستوى* بنجاح إلى *@${targetJid.split('@')[0]}*\n\nالآن يمتلك *${addResult.newLevel || calculateLevel(user.exp)}* مستوى. ودوره *${getRole(addResult.newLevel || calculateLevel(user.exp))}*`,
        { mentions: [targetJid] }
    )
}

export { pluginConfig as config, handler }