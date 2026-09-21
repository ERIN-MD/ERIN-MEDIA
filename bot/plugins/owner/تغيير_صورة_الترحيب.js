// تغيير صورة الترحيب - أمر لتغيير صورة maro-welcome.jpg (صورة مصغرة للترحيب)

import fs from 'fs'
import path from 'path'
import te from '../../src/lib/maro-error.js'
import { updateAssetUrl } from '../../src/lib/maro-uploader.js'

const pluginConfig = {
    name: 'تغيير_صورة_الترحيب',
    alias: ['ganti-maro-welcome.jpg'],
    category: 'owner',
    description: 'تغيير صورة maro-welcome.jpg (صورة مصغرة للترحيب)',
    usage: '.تغيير_صورة_الترحيب (رد/إرسال صورة)',
    example: '.تغيير_صورة_الترحيب',
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
        return m.reply(`🖼️ *تغيير صورة الترحيب*\n\n> أرسل/رد على صورة لتغييرها\n> الملف: assets/images/maro-welcome.jpg`)
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
            const newUrl = await updateAssetUrl('maro-welcome', buffer, 'maro-welcome.jpg')
            m.reply(`✅ *تم بنجاح*\n\n> تم تغيير صورة maro-welcome.jpg إلى رابط جديد:\n> ${newUrl}\n> تم تحديث التكوين في الوقت الفعلي!`)
        } catch (e) {
            m.reply(`❌ فشل رفع الصورة: ${e.message}`)
        }
    } catch (error) {
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }