// تغيير صورة الوداع - أمر لتغيير صورة maro-goodbye.jpg (صورة مصغرة للوداع)

import fs from 'fs'
import path from 'path'
import te from '../../src/lib/maro-error.js'
import { updateAssetUrl } from '../../src/lib/maro-uploader.js'

const pluginConfig = {
    name: 'تغيير_صورة_الوداع',
    alias: ['ganti-maro-goodbye.jpg'],
    category: 'owner',
    description: 'تغيير صورة maro-goodbye.jpg (صورة مصغرة للوداع)',
    usage: '.تغيير_صورة_الوداع (رد/إرسال صورة)',
    example: '.تغيير_صورة_الوداع',
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
        return m.reply(`🖼️ *تغيير صورة الوداع*\n\n> أرسل/رد على صورة لتغييرها\n> الملف: assets/images/maro-goodbye.jpg`)
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
            const newUrl = await updateAssetUrl('maro-goodbye', buffer, 'maro-goodbye.jpg')
            m.reply(`✅ *تم بنجاح*\n\n> تم تغيير صورة maro-goodbye.jpg إلى رابط جديد:\n> ${newUrl}\n> تم تحديث التكوين في الوقت الفعلي!`)
        } catch (e) {
            m.reply(`❌ فشل رفع الصورة: ${e.message}`)
        }
    } catch (error) {
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }