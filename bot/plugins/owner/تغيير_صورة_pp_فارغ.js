// تغيير صورة pp-kosong - أمر لتغيير صورة pp-kosong.jpg

import fs from 'fs'
import path from 'path'
import te from '../../src/lib/maro-error.js'
import { updateAssetUrl } from '../../src/lib/maro-uploader.js'

const pluginConfig = {
    name: 'تغيير_صورة_pp_فارغ',
    alias: ['ganti-pp-kosong.jpg'],
    category: 'owner',
    description: 'تغيير صورة pp-kosong.jpg',
    usage: '.تغيير_صورة_pp_فارغ (رد/إرسال صورة)',
    example: '.تغيير_صورة_pp_فارغ',
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
    if (!isImage) return m.reply(`🖼️ *تغيير صورة pp فارغ*\n\n> أرسل/رد على صورة لتغييرها\n> الملف: assets/images/pp-kosong.jpg`)
    try {
        let buffer = m.quoted && m.quoted.isMedia ? await m.quoted.download() : await m.download()
        if (!buffer) return m.reply('❌ فشل تحميل الصورة')
        await m.reply(`⏳ جاري رفع الصورة...`)
        try {
            const newUrl = await updateAssetUrl('pp-kosong', buffer, 'pp-kosong.jpg')
            m.reply(`✅ *تم بنجاح*\n\n> تم تغيير صورة pp-kosong.jpg إلى رابط جديد:\n> ${newUrl}\n> تم تحديث التكوين في الوقت الفعلي!`)
        } catch (e) {
            m.reply(`❌ فشل رفع الصورة: ${e.message}`)
        }
    } catch (error) {
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }