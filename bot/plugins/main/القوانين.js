import config from '../../config.js'
import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'القوانين',
    alias: ['rules'],
    category: 'main',
    description: 'عرض قوانين البوت',
    usage: '.القوانين',
    example: '.القوانين',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

const DEFAULT_BOT_RULES = [
    'لا تقم بإرسال سبام للأوامر',
    'استخدم الميزات بحكمة',
    'يمنع إساءة استخدام البوت',
    'احترم المستخدمين الآخرين',
    'قم بالإبلاغ عن الأخطاء للمالك',
    'لا تطلب ميزات غريبة',
    'البوت لا يعمل 24/7، توجد صيانة دورية'
]

async function handler(m, { sock, config: botConfig }) {
    try {
        const db = getDatabase()
        const customRules = db.setting('botRules')

        let rulesList = DEFAULT_BOT_RULES

        if (customRules) {
            if (Array.isArray(customRules)) {
                rulesList = customRules
            } else if (typeof customRules === 'string') {
                rulesList = customRules
                    .split('\n')
                    .map(v => v.replace(/^[^a-zA-Z0-9]+/, '').trim())
                    .filter(Boolean)
            }
        }

        const tableData = rulesList.map((rule, i) => [
            `${i + 1}`,
            rule
        ])

        await sock.sendTable(
            m.chat,
            '📜 قوانين البوت',
            ['الرقم', 'القانون'],
            tableData,
            m,
            {
                headerText: `${botConfig.bot?.name || 'Maro-AI'} *القوانين*`,
                footer: 'المخالفة قد تؤدي إلى الحظر أو الطرد!'
            }
        )
    } catch (e) {
        m.reply('حدث خطأ أثناء جلب القوانين')
    }
}

export { pluginConfig as config, handler }