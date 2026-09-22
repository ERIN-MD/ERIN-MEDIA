import { getQuotedStickerHash, deleteStickerCommand, listStickerCommands, findByCommand } from '../../src/lib/maro-sticker-command.js'
const pluginConfig = {
    name: 'حذف_اختصار_ملصق',
    alias: ['delstickercmd'],
    category: 'group',
    description: 'حذف اختصار أمر من ملصق',
    usage: '.حذف_اختصار_ملصق <أمر> أو رد على ملصق',
    example: '.حذف_اختصار_ملصق قائمة',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    isAdmin: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const args = m.args || []
    const commandName = args[0]
    if (!commandName && !m.quoted) {
        const existingCmds = listStickerCommands()
        if (existingCmds.length === 0) {
            return m.reply(
                `🖼️ *اختصارات الملصقات*\n\n` +
                `> لا توجد اختصارات مسجلة.\n` +
                `> أضف اختصاراً بـ \`.اضافة_ملصق\``
            )
        }
        
        let txt = `🖼️ *اختصارات الملصقات*\n\n`
        txt += `╭┈┈⬡「 📋 *القائمة* 」\n`
        
        for (const cmd of existingCmds) {
            txt += `┃ 🖼️ → \`.${cmd.command}\`\n`
        }
        txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        
        txt += `*حذف بـ:*\n`
        txt += `> \`.حذف_اختصار_ملصق <أمر>\`\n`
        txt += `> أو رد على ملصق + \`.حذف_اختصار_ملصق\``
        
        return m.reply(txt)
    }
    
    let deleted = false
    let deletedCmd = ''
    if (m.quoted) {
        const stickerHash = getQuotedStickerHash(m)
        if (stickerHash) {
            const success = deleteStickerCommand(stickerHash)
            if (success) {
                deleted = true
                deletedCmd = 'الملصق المردود عليه'
            }
        }
    }
    if (!deleted && commandName) {
        const cleanCmd = commandName.toLowerCase().replace(/^\./, '')
        const found = findByCommand(cleanCmd)
        
        if (found) {
            const success = deleteStickerCommand(found.hash)
            if (success) {
                deleted = true
                deletedCmd = cleanCmd
            }
        } else {
            return m.reply(
                `❌ الاختصار \`${cleanCmd}\` غير موجود!\n\n` +
                `> اطلع على القائمة بـ \`.حذف_اختصار_ملصق\``
            )
        }
    }
    
    if (deleted) {
        await m.react('✅')
        await m.reply(
            `✅ *تم حذف الاختصار*\n\n` +
            `> 🗑️ \`${deletedCmd}\` تم حذفه.`
        )
    } else {
        await m.reply(
            `❌ فشل الحذف!\n\n` +
            `> رد على الملصق الذي تريد حذفه، أو\n` +
            `> اكتب اسم الأمر: \`.حذف_اختصار_ملصق قائمة\``
        )
    }
}

export { pluginConfig as config, handler }