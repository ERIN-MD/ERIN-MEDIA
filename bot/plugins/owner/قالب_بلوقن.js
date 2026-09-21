// قالب_بلوقن - أمر لإنشاء قالب بلوقن جديد

import config from '../../config.js'

const pluginConfig = {
    name: 'قالب_بلوقن',
    alias: ['templateplugin'],
    category: 'owner',
    description: 'إنشاء قالب بلوقن جديد (للمالك فقط)',
    usage: '.قالب_بلوقن',
    example: '.قالب_بلوقن',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true
}

function handler(m, { sock }) {
    if (!config.isOwner(m.sender)) {
        return m.reply('❌ *للمالك فقط!*')
    }
    
    const template = `
// مثال - بلوقن مثال للتعلم

const pluginConfig = {
    name: 'مثال',
    alias: ['م'],
    category: 'عام',
    description: 'بلوقن مثال',
    usage: '.مثال',
    example: '.مثال',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        await m.reply('هذا بلوقن مثال!')
    } catch (error) {
        console.error('خطأ في البلوقن:', error)
        await m.reply('❌ *فشل*\\n\\n> ' + error.message)
    }
}

export { pluginConfig as config, handler }
`

    m.reply(`\`\`\`${template}\`\`\``)
}

export { pluginConfig as config, handler }