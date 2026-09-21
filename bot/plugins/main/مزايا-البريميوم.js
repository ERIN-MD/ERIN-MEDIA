import { getAllPlugins } from '../../src/lib/maro-plugins.js'
import config from '../../config.js'

const pluginConfig = {
    name: 'مزايا-البريميوم',
    alias: ['benefitpremium'],
    category: 'main',
    description: 'عرض شرح وقائمة الميزات الخاصة بالبريميوم',
    usage: '.مزايا-البريميوم',
    isOwner: false,
    isGroup: false,
    isEnabled: true
}

async function handler(m, { sock }) {
    const plugins = getAllPlugins()
    const premiumCommands = plugins.filter(p => p.config.isPremium && p.config.isEnabled)
    
    const seen = new Set()
    const commandList = []
    for (const p of premiumCommands) {
        const names = Array.isArray(p.config.name) ? p.config.name : [p.config.name]
        for (const name of names) {
            if (!name || seen.has(name)) continue
            seen.add(name)
            commandList.push(`• *${config.command?.prefix || '.'}${name}*`)
        }
    }
    commandList.sort()
    
    const totalCommands = commandList.length
    const defaultLimit = config.limits?.default || 25
    const premiumLimit = config.limits?.premium || 100
    
    const message = 
        `⭐ *ما هو البريميوم؟*\n\n` +
        `البريميوم هو *مستخدم مدفوع* يحصل على ميزات حصرية وامتيازات إضافية.\n\n` +
        `╭┈┈⬡「 💎 *مزايا البريميوم* 」\n` +
        `┃ ✦ \`\`\`الحد اليومي: ${premiumLimit}x (vs ${defaultLimit}x مستخدم عادي)\`\`\`\n` +
        `┃ ✦ \`\`\`فترة تبريد أقل\`\`\`\n` +
        `┃ ✦ \`\`\`الوصول للميزات الحصرية\`\`\`\n` +
        `┃ ✦ \`\`\`أولوية في الاستجابة\`\`\`\n` +
        `┃ ✦ \`\`\`بدون علامة مائية في بعض الميزات\`\`\`\n` +
        `┃ ✦ \`\`\`دعم ذو أولوية\`\`\`\n` +
        `╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `╭┈┈⬡「 ⚙️ *كيفية الحصول* 」\n` +
        `┃ \`يتم الحصول على البريميوم من خلال:\`\n` +
        `┃ • تواصل مع مالك البوت\n` +
        `┃ • \`\`\`${config.command?.prefix || '.'}addprem <رقم> <المدة>\`\`\`\n` +
        `┃ • مثال: .addprem 628xxx 30d\n` +
        `╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `╭┈┈⬡「 📋 *قائمة أوامر البريميوم* 」\n` +
        `┃ \`المجموع: ${totalCommands} أمر\`\n` +
        `┃\n` +
        (totalCommands > 0 
            ? commandList.map(cmd => `┃ ${cmd}`).join('\n')
            : `┃ جميع الأوامر متاحة للمستخدم العادي`) +
        `\n╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `هل تريد الترقية؟ تواصل مع مالك البوت\n${config.owner.number.map(num => `- wa.me/${num}`).join('\n') }`
    
    await m.reply(message)
}

export { pluginConfig as config, handler }