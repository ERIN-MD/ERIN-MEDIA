// حذف البيانات - أمر لإعادة تعيين جميع بيانات قاعدة البيانات إلى الوضع الافتراضي

import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'حذف_البيانات',
    alias: ['hapusdata'],
    category: 'owner',
    description: 'إعادة تعيين جميع بيانات قاعدة البيانات إلى الوضع الافتراضي',
    usage: '.حذف_البيانات',
    example: '.حذف_البيانات',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 0,
    isEnabled: true
}

const pendingReset = new Map()

async function handler(m, { sock }) {
    const args = m.text

    if (args === 'ya' || args === 'yes' || args === 'confirm' || args === 'نعم') {
        const pending = pendingReset.get(m.sender)
        if (!pending || Date.now() - pending > 60000) {
            pendingReset.delete(m.sender)
            return m.reply(`❌ لا يوجد طلب إعادة تعيين نشط.\n\n> اكتب \`${m.prefix}حذف_البيانات\` أولاً`)
        }

        pendingReset.delete(m.sender)
        await m.react('🕕')

        const db = getDatabase()
        const result = db.resetToDefaults()

        await m.react('✅')

        await sock.sendMessage(m.chat, {
            text:
                `🗑️ *تم إعادة تعيين البيانات*\n\n` +
                `> 📁 تم إعادة تعيين الملفات: *${result.resetCount}/${result.total}*\n` +
                `> 💾 النسخة الاحتياطية: \`${result.backupFolder}/\`\n\n` +
                `تم إعادة جميع البيانات إلى الوضع الافتراضي.\n\n` +
                `> ⚠️ أعد تشغيل البوت لضمان مزامنة البيانات`
        }, { quoted: m })
        return
    }

    const db = getDatabase()
    const dbPath = db.dbPath
    const fileMap = [
        { key: 'users', label: '👥 المستخدمين' },
        { key: 'groups', label: '👥 المجموعات' },
        { key: 'settings', label: '⚙️ الإعدادات' },
        { key: 'stats', label: '📊 الإحصائيات' },
        { key: 'sewa', label: '🏪 الإيجار' },
        { key: 'premium', label: '⭐ البريميوم' },
        { key: 'owner', label: '👑 المالك' },
        { key: 'partner', label: '🤝 الشركاء' },
    ]

    const existing = []
    let totalSize = 0

    for (const { key, label } of fileMap) {
        const data = db.db.data[key]
        if (!data) continue
        const entries = Array.isArray(data) ? data.length : Object.keys(data).length
        const size = Buffer.byteLength(JSON.stringify(data))
        totalSize += size
        existing.push({ label, key, entries, size: `${(size / 1024).toFixed(1)} كيلوبايت` })
    }

    if (existing.length === 0) {
        return m.reply(`❌ لم يتم العثور على بيانات في قاعدة البيانات`)
    }

    pendingReset.set(m.sender, Date.now())

    let txt = `⚠️ *تحذير — حذف البيانات*\n\n`
    txt += `سيؤدي هذا الإجراء إلى حذف *جميع* البيانات التالية:\n\n`

    for (const { label, entries, size } of existing) {
        txt += `> ${label}: *${entries}* بيانات (${size})\n`
    }

    txt += `\n> 📦 الإجمالي: *${(totalSize / 1024).toFixed(1)} كيلوبايت*\n`
    txt += `> 💾 يتم إنشاء نسخة احتياطية تلقائياً قبل إعادة التعيين\n\n`
    txt += `اكتب \`${m.prefix}حذف_البيانات نعم\` خلال 60 ثانية للمتابعة.`

    await sock.sendMessage(m.chat, {
        text: txt,
        interactiveButtons: [
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    display_text: '✅ نعم، حذف الكل',
                    id: `${m.prefix}حذف_البيانات نعم`
                })
            },
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    display_text: '❌ إلغاء',
                    id: `${m.prefix}القائمة`
                })
            }
        ]
    }, { quoted: m })

    setTimeout(() => { pendingReset.delete(m.sender) }, 60000)
}

export { pluginConfig as config, handler }