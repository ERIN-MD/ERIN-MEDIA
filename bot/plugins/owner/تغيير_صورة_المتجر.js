// تغيير صورة المتجر - أمر لتغيير صورة maro-store.jpg (صورة مصغرة للمتجر)

import fs from 'fs'
import path from 'path'
import te from '../../src/lib/maro-error.js'
import { updateAssetUrl } from '../../src/lib/maro-uploader.js'

const pluginConfig = {
    name: 'تغيير_صورة_المتجر',
    alias: ['ganti-maro-store.jpg'],
    category: 'owner',
    description: 'تغيير صورة maro-store.jpg (صورة مصغرة للمتجر)',
    usage: '.تغيير_صورة_المتجر (رد/إرسال صورة)',
    example: '.تغيير_صورة_المتجر',
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
    
    if (!isImage) {
        return m.reply(`🖼️ *تغيير صورة المتجر*\n\n> أرسل/رد على صورة لتغييرها\n> الملف: assets/images/maro-store.jpg`)
    }
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }
        
        if (!buffer) {
            return m.reply(`❌ فشل تحميل الصورة`)
        }
        
        await m.reply(`⏳ جاري رفع الصورة...`)
        try {
            const newUrl = await updateAssetUrl('maro-store', buffer, 'maro-store.jpg')
            m.reply(`✅ *تم بنجاح*\n\n> تم تغيير صورة maro-store.jpg إلى رابط جديد:\n> ${newUrl}\n> تم تحديث التكوين في الوقت الفعلي!`)
        } catch (e) {
            m.reply(`❌ فشل رفع الصورة: ${e.message}`)
        }
    } catch (error) {
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }