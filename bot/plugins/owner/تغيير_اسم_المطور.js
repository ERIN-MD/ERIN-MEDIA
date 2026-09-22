// تغيير اسم المطور - أمر لتغيير اسم المطور في config.js

import fs from 'fs'
import path from 'path'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'تغيير_اسم_المطور',
    alias: ['ganti-namadev'],
    category: 'owner',
    description: 'تغيير اسم المطور في config.js',
    usage: '.تغيير_اسم_المطور <الاسم الجديد>',
    example: '.تغيير_اسم_المطور Mabrok Gmal',
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
        return m.reply(`👨‍💻 *تغيير اسم المطور*\n\n> الاسم الحالي: *${config.bot?.developer || '-'}*\n\n*طريقة الاستخدام:*\n\`${m.prefix}تغيير_اسم_المطور <الاسم الجديد>\``)
    }
    
    try {
        const configPath = path.join(process.cwd(), 'config.js')
        let configContent = fs.readFileSync(configPath, 'utf8')
        
        configContent = configContent.replace(
            /developer:\s*['"]([^'"]*)['"]/,
            `developer: '${newName}'`
        )
        
        fs.writeFileSync(configPath, configContent)
        
        config.bot.developer = newName
        
        m.reply(`✅ *تم بنجاح*\n\n> تم تغيير اسم المطور إلى: *${newName}*`)
        
    } catch (error) {
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }