import { sendStoreBackup, SCHEMA_VERSION } from '../../src/lib/maro-store-backup.js'

const pluginConfig = {
    name: 'نسخ_قاعدة_البيانات',
    alias: ['backupdb'],
    category: 'owner',
    description: 'نسخ احتياطي لقاعدة البيانات وإرساله إلى المالك',
    usage: '.نسخ_قاعدة_البيانات',
    isOwner: true,
    isGroup: false,
    isEnabled: true
}

async function handler(m, { sock }) {
    const backupContents = [
        '📁 database/*.json (جميع ملفات JSON)',
        '📁 database/cpanel/* (بيانات cPanel)',
        '📄 storage/database.json (قاعدة البيانات الرئيسية)',
        '📄 db.json (قاعدة البيانات الجذرية)',
        '📄 database/main/*.json (قاعدة البيانات الرئيسية)',
        '📋 backup_metadata.json (معلومات المخطط)'
    ]
    
    await m.reply(
        `🕕 *جاري إنشاء نسخة احتياطية...*\n\n` +
        `╭┈┈⬡「 📦 *ماذا سيتم نسخه* 」\n` +
        backupContents.map(c => `┃ ${c}`).join('\n') +
        `\n╰┈┈┈┈┈┈┈┈⬡`
    )
    
    const result = await sendStoreBackup(sock)
    
    if (result.success) {
        await m.reply(
            `✅ *تم النسخ الاحتياطي بنجاح!*\n\n` +
            `📦 الحجم: ${result.size}\n` +
            `📁 الملفات: ${result.files}\n` +
            `🔖 المخطط: v${SCHEMA_VERSION}\n\n` +
            `> نسخ احتياطي آمن، متوافق مع التحديثات القادمة.\n` +
            `> تم إرسال النسخة إلى المالك الرئيسي.`
        )
    } else {
        await m.reply(`❌ فشل النسخ الاحتياطي: ${result.error}`)
    }
}

export { pluginConfig as config, handler }