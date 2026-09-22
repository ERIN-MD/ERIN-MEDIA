import { getQuotedStickerHash, addStickerCommand, listStickerCommands } from '../../src/lib/maro-sticker-command.js'
import { getPlugin } from '../../src/lib/maro-plugins.js'
const pluginConfig = {
    name: 'اضافة_ملصق',
    alias: ['addcmdsticker'],
    category: 'group',
    description: 'اجعل الملصق اختصاراً لأمر',
    usage: '.اضافة_ملصق <أمر> (رد على ملصق)',
    example: '.اضافة_ملصق قائمة',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    isAdmin: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const args = m.args || []
    const commandName = args[0]
    
    if (!commandName) {
        const existingCmds = listStickerCommands()
        
        let txt = `🖼️ *ملصق إلى أمر*\n\n`
        txt += `> رد على ملصق + اكتب الأمر الذي تريد اختصاره.\n\n`
        txt += `*مثال:*\n`
        txt += `> رد على ملصق، ثم اكتب:\n`
        txt += `> \`.اضافة_ملصق قائمة\`\n\n`
        
        if (existingCmds.length > 0) {
            txt += `╭┈┈⬡「 📋 *النشطة* 」\n`
            for (const cmd of existingCmds.slice(0, 10)) {
                txt += `┃ 🖼️ → \`${cmd.command}\`\n`
            }
            if (existingCmds.length > 10) {
                txt += `┃ ... و ${existingCmds.length - 10} أخرى\n`
            }
            txt += `╰┈┈┈┈┈┈┈┈⬡`
        }
        
        return m.reply(txt)
    }
    
    if (!m.quoted) {
        return m.reply('⚠️ *رد على ملصق* تريد تحويله لأمر!')
    }
    
    const stickerHash = getQuotedStickerHash(m)
    if (!stickerHash) {
        return m.reply('⚠️ الرسالة المردود عليها ليست *ملصقاً*!')
    }
    
    const cleanCmd = commandName.toLowerCase().replace(/^\./, '')
    const plugin = getPlugin(cleanCmd)
    
    if (!plugin) {
        return m.reply(
            `❌ الأمر \`${cleanCmd}\` غير موجود!\n\n` +
            `> تأكد من أن الأمر الذي تريد اختصاره صالح.`
        )
    }
    
    const success = addStickerCommand(stickerHash, cleanCmd, m.sender)
    
    if (success) {
        await m.react('✅')
        await m.reply(
            `✅ *تمت إضافة اختصار الملصق*\n\n` +
            `> 🖼️ ملصق → \`.${cleanCmd}\`\n\n` +
            `_أرسل الملصق لتشغيل الأمر!_`
        )
    } else {
        await m.reply('❌ فشل حفظ اختصار الملصق!')
    }
}

export { pluginConfig as config, handler }