import { getAllPlugins } from '../../src/lib/maro-plugins.js'
import config from '../../config.js'

const pluginConfig = {
    name: 'مزايا-المالك',
    alias: ['ownerbenefits', 'ownerfitur'],
    category: 'main',
    description: 'عرض شرح وقائمة الميزات الخاصة بالمالك',
    usage: '.مزايا-المالك',
    isOwner: false,
    isGroup: false,
    isEnabled: true
}

async function handler(m, { sock }) {
    const plugins = getAllPlugins()
    const ownerCommands = plugins.filter(p => p.config.isOwner && p.config.isEnabled)
    
    const seen = new Set()
    const commandList = []
    for (const p of ownerCommands) {
        const names = Array.isArray(p.config.name) ? p.config.name : [p.config.name]
        for (const name of names) {
            if (!name || seen.has(name)) continue
            seen.add(name)
            commandList.push(`• *${config.command?.prefix || '.'}${name}*`)
        }
    }
    commandList.sort()
    
    const totalCommands = commandList.length
    
    const message = 
        `👑 *ما هو المالك؟*\n\n` +
        `المالك هو *صاحب البوت* الذي يمتلك صلاحيات كاملة لجميع الميزات والتحكم بالنظام.\n\n` +
        `╭┈┈⬡「 🔐 *مزايا المالك* 」\n` +
        `┃ ✦ \`\`\`الوصول لجميع الأوامر بدون قيود\`\`\`\n` +
        `┃ ✦ \`\`\` limitless (-1) غير محدود\`\`\`\n` +
        `┃ ✦ \`\`\`تجاوز جميع فترات التبريد\`\`\`\n` +
        `┃ ✦ \`\`\`تحكم كامل بنظام البوت\`\`\`\n` +
        `┃ ✦ \`\`\`إدارة المستخدمين والمجموعات\`\`\`\n` +
        `┃ ✦ \`\`\`الوصول للوحة التحكم والسيرفر\`\`\`\n` +
        `╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `╭┈┈⬡「 ⚙️ *كيفية العمل* 」\n` +
        `┃ \`تتم إضافة المالك من خلال:\`\n` +
        `┃ • \`\`\`${config.command?.prefix || '.'}اضف-مالك <رقم>\`\`\`\n` +
        `┃ • أو مباشرة من ملف config.js\n` +
        `╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `╭┈┈⬡「 📋 *قائمة أوامر المالك* 」\n` +
        `┃ \`المجموع: ${totalCommands} أمر\`\n` +
        `┃\n` +
        commandList.map(cmd => `┃ ${cmd}`).join('\n') +
        `\n╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `> تواصل مع المالك للحصول على الصلاحية!`
    
    await m.reply(message)
}

export { pluginConfig as config, handler }