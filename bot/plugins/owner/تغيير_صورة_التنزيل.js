// تغيير صورة التنزيل - أمر لتغيير صورة maro-demote.jpg

import fs from 'fs'
import path from 'path'
import te from '../../src/lib/maro-error.js'
import { updateAssetUrl } from '../../src/lib/maro-uploader.js'

const pluginConfig = {
    name: 'تغيير_صورة_التنزيل',
    alias: ['ganti-maro-demote.jpg'],
    category: 'owner',
    description: 'تغيير صورة maro-demote.jpg',
    usage: '.تغيير_صورة_التنزيل (رد/إرسال صورة)',
    example: '.تغيير_صورة_التنزيل',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
    if (!isImage) return m.reply(`🖼️ *تغيير صورة التنزيل*\n\n> أرسل/رد على صورة لتغييرها\n> الملف: assets/images/maro-demote.jpg`)
    try {
        let buffer = m.quoted && m.quoted.isMedia ? await m.quoted.download() : await m.download()
        if (!buffer) return m.reply('❌ فشل تحميل الصورة')
        await m.reply(`⏳ جاري رفع الصورة...`)
        try {
            const newUrl = await updateAssetUrl('maro-demote', buffer, 'maro-demote.jpg')
            m.reply(`✅ *تم بنجاح*\n\n> تم تغيير صورة maro-demote.jpg إلى رابط جديد:\n> ${newUrl}\n> تم تحديث التكوين في الوقت الفعلي!`)
        } catch (e) {
            m.reply(`❌ فشل رفع الصورة: ${e.message}`)
        }
    } catch (error) {
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }