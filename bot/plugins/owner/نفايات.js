// نفايات - أمر لحذف جميع الملفات المؤقتة في مجلد temp

import fs from 'fs'
import path from 'path'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'نفايات',
    alias: ['sampah'],
    category: 'owner',
    description: 'حذف جميع الملفات المؤقتة في مجلد temp',
    usage: '.نفايات',
    example: '.نفايات',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    const tempPath = path.join(process.cwd(), 'temp')

    if (!fs.existsSync(tempPath)) {
        return m.reply('❌ مجلد temp غير موجود!')
    }

    await m.react('🗑️')

    try {
        const files = fs.readdirSync(tempPath)

        if (!files.length) {
            return m.reply('📁 مجلد temp فارغ بالفعل!')
        }

        let deleted = 0

        for (const file of files) {
            const filePath = path.join(tempPath, file)

            fs.rmSync(filePath, { recursive: true, force: true })
            deleted++
        }

        await m.react('✅')
        await m.reply(
            `🗑️ *تم تنظيف الملفات المؤقتة!*\n\n` +
            `> إجمالي الملفات/المجلدات المحذوفة: *${deleted}*`
        )

    } catch (error) {
        await m.react('☢')
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }