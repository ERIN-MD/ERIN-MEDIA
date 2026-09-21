import config from '../../config.js'
import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'اضف_شريك',
    alias: ['addpartner'],
    category: 'owner',
    description: 'إدارة قائمة شركاء البوت',
    usage: '.اضف_شريك <رقم/@منشن> [يوم]',
    example: '.اضف_شريك 6281234567890 30',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

function extractNumber(m) {
    if (m.mentionedJid?.length) return m.mentionedJid[0]
    if (m.quoted?.sender) return m.quoted.sender

    const text = m.args?.join(' ')?.trim() || ''
    const match = text.match(/(\d{10,15})/)
    if (match) return `${match[1]}@s.whatsapp.net`

    return null
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const cmd = m.command?.toLowerCase()
    if (!db.data.partner) db.data.partner = []

    if (cmd === 'اضف_شريك' || cmd === 'addpartner') {
        const target = await extractNumber(m)
        if (!target) {
            return m.reply(
                `🤝 *إضافة شريك*\n\n` +
                `> طريقة الاستخدام:\n` +
                `> \`${m.prefix}اضف_شريك @منشن [يوم]\`\n` +
                `> \`${m.prefix}اضف_شريك 6281xxx 30\`\n\n` +
                `> الافتراضي: 30 يوم`
            )
        }
        let targetNumber = target.replace(/@.+/g, '')
        if (targetNumber.startsWith('08')) {
            targetNumber = '62' + targetNumber.slice(1)
        }
        if (config.isOwner(targetNumber)) {
            return m.reply(`⚠️ @${targetNumber} مالك بالفعل!`, { mentions: [target] })
        }
        const existingIndex = db.data.partner.findIndex(p => p.id === targetNumber)
        const days = parseInt(m.args?.find(a => /^\d+$/.test(a) && a.length <= 4)) || 30
        const pushName = m.quoted?.pushName || m.pushName || 'غير معروف'
        const now = Date.now()
        let newExpired
        if (existingIndex !== -1) {
            const currentExpired = db.data.partner[existingIndex].expired || now
            const baseTime = currentExpired > now ? currentExpired : now
            newExpired = baseTime + (days * 24 * 60 * 60 * 1000)
            
            db.data.partner[existingIndex].expired = newExpired
            db.data.partner[existingIndex].name = pushName
        } else {
            newExpired = now + (days * 24 * 60 * 60 * 1000)
            db.data.partner.push({
                id: targetNumber,
                expired: newExpired,
                name: pushName,
                addedAt: now
            })
        }

        db.save()

        const expDate = new Date(newExpired).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

        await m.reply(
            `✅ ${existingIndex !== -1 ? 'تم تجديد' : 'تمت إضافة'} الشريك @${targetNumber} لمدة *${days} يوم*\nتاريخ الانتهاء: *${expDate}*`,
            { mentions: [target] }
        )
        return
    }

    if (cmd === 'delpartner') {
        const target = await extractNumber(m)
        if (!target) {
            return m.reply(`⚠️ قم بعمل منشن أو رد على المستخدم المراد حذفه من الشركاء.`)
        }
        let targetNumber = target.replace(/@.+/g, '')
        if (targetNumber.startsWith('08')) {
            targetNumber = '62' + targetNumber.slice(1)
        }

        const initialLength = db.data.partner.length
        db.data.partner = db.data.partner.filter(p => p.id !== targetNumber)
        
        if (db.data.partner.length < initialLength) {
            db.save()
            await m.reply(`✅ تم حذف @${targetNumber} من الشركاء بنجاح`, { mentions: [target] })
        } else {
            return m.reply(`⚠️ هذا المستخدم ليس شريكاً.`)
        }
        return
    }

    if (cmd === 'listpartner') {
        const partners = db.data.partner
        if (!partners.length) {
            return m.reply(`🤝 *قائمة الشركاء*\n\n> لا يوجد شركاء بعد.`)
        }

        let txt = `🤝 *قائمة الشركاء*\n\n`
        const mentions = []
        partners.forEach((p, i) => {
            const num = p.id
            const expDate = new Date(p.expired).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
            const remaining = Math.ceil((p.expired - Date.now()) / (1000 * 60 * 60 * 24))
            txt += `${i + 1}. @${num} — ${expDate} (${remaining > 0 ? remaining + ' يوم' : 'منتهي'})\n`
            mentions.push(`${num}@s.whatsapp.net`)
        })
        txt += `\nالمجموع: *${partners.length}* شريك`
        await m.reply(txt, { mentions })
        return
    }
}

export { pluginConfig as config, handler }