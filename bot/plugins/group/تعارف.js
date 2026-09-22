import { getDatabase } from '../../src/lib/maro-database.js'
import config from '../../config.js'
import moment from 'moment-timezone'
const pluginConfig = {
    name: 'تعارف',
    alias: ['intro'],
    category: 'group',
    description: 'عرض رسالة التعارف للمجموعة',
    usage: '.تعارف',
    example: '.تعارف',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

const DEFAULT_INTRO = `مرحباً @user 🖐

تعال تعرف علينا
- الاسم : 
- العمر : 
- من : 
- الهواية : 
- الحالة : 

نتمنى تنبسط معنا في مجموعة @group

> للمالك:
تغيير الرسالة الافتراضية بـ .ضبط_التعارف <نص>`
 function parsePlaceholders(text, m, groupMeta) {
    const now = moment().tz('Asia/Jakarta')
    const dateStr = now.format('D MMMM YYYY')
    const timeStr = now.format('HH:mm')
    
    return text
        .replace(/@user/gi, `@${m.sender.split('@')[0]}`)
        .replace(/@group/gi, groupMeta?.subject || 'المجموعة')
        .replace(/@count/gi, groupMeta?.participants?.length || '0')
        .replace(/@date/gi, dateStr)
        .replace(/@time/gi, timeStr)
        .replace(/@desc/gi, groupMeta?.desc || 'لا يوجد وصف')
        .replace(/@botname/gi, config.bot?.name || 'Maro-AI')
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const groupData = db.getGroup(m.chat) || db.setGroup(m.chat)
    const groupMeta = m.groupMetadata
    
    const introText = groupData.intro || DEFAULT_INTRO
    const parsed = parsePlaceholders(introText, m, groupMeta)
    
    await m.reply(parsed, { mentions: [m.sender] })
}

export { pluginConfig as config, handler, parsePlaceholders, DEFAULT_INTRO }