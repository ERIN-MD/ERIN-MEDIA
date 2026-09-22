// تغيير اسم البوت - أمر لتغيير اسم البوت في config.js

import fs from 'fs'
import path from 'path'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'تغيير_اسم_البوت',
    alias: ['ganti-namabot'],
    category: 'owner',
    description: 'تغيير اسم البوت في config.js',
    usage: '.تغيير_اسم_البوت <الاسم الجديد>',
    example: '.تغيير_اسم_البوت Maro MD',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock, config }) {
    const newName = m.args.join(' ')
    
    if (!newName) {
        return m.reply(`🤖 *تغيير اسم البوت*\n\n> الاسم الحالي: *${config.bot?.name || '-'}*\n\n*طريقة الاستخدام:*\n\`${m.prefix}تغيير_اسم_البوت <الاسم الجديد>\``)
    }
    
    try {
        const configPath = path.join(process.cwd(), 'config.js')
        let configContent = fs.readFileSync(configPath, 'utf8')
        
        configContent = configContent.replace(
            /bot:\s*\{[\s\S]*?name:\s*['"]([^'"]*)['"]/,
            (match, oldName) => match.replace(`'${oldName}'`, `'${newName}'`).replace(`"${oldName}"`, `'${newName}'`)
        )
        
        fs.writeFileSync(configPath, configContent)
        
        config.bot.name = newName
        
        m.reply(`✅ *تم بنجاح*\n\n> تم تغيير اسم البوت إلى: *${newName}*`)
        
    } catch (error) {
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }