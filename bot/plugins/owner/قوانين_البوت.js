import config from '../../config.js'
import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'قوانين_البوت',
    alias: ['setrules', 'saverules'],
    category: 'owner',
    description: 'تحديث قوانين البوت في قاعدة البيانات',
    usage: '.تحديث-القوانين (رد على رسالة)',
    example: '.تحديث-القوانين',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock, config: botConfig }) {
    try {
        // إذا كان رداً على رسالة، نأخذ القوانين منها
        if (m.quoted && m.quoted.body) {
            const rules = m.quoted.body
                .split('\n')
                .map(v => v.replace(/^\d+[\.\)\-]\s*/, '').trim())
                .filter(Boolean)

            const db = getDatabase()
            db.setting('botRules', rules)
            await db.save()

            await m.reply(`✅ تم حفظ ${rules.length} قانون في قاعدة البيانات`)
            return
        }

        // إذا كان نصاً بعد الأمر
        if (m.text) {
            const rules = m.text
                .split('\n')
                .map(v => v.replace(/^\d+[\.\)\-]\s*/, '').trim())
                .filter(Boolean)

            const db = getDatabase()
            db.setting('botRules', rules)
            await db.save()

            await m.reply(`✅ تم حفظ ${rules.length} قانون في قاعدة البيانات`)
            return
        }

        // إذا لم يكن هناك قوانين مرسلة
        await m.reply(
            `❌ *يرجى إرسال القوانين*\n\n` +
            `*طريقة الاستخدام:*\n` +
            `1. أرسل القوانين في رسالة (كل قانون في سطر)\n` +
            `2. رد على الرسالة بـ .تحديث-القوانين\n\n` +
            `*مثال:*\n` +
            `ممنوع استخدام بوتات أخرى\n` +
            `ممنوع إرسال الروابط\n` +
            `ممنوع السب والشتم`
        )

    } catch (e) {
        m.reply('❌ حدث خطأ أثناء حفظ القوانين')
    }
}

export { pluginConfig as config, handler }