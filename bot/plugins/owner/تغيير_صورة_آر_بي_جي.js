// تغيير صورة آر بي جي - أمر لتغيير صورة maro-rpg.jpg (صورة مصغرة للعب)

import fs from 'fs'
import path from 'path'
import te from '../../src/lib/maro-error.js'
import { updateAssetUrl } from '../../src/lib/maro-uploader.js'

const pluginConfig = {
    name: 'تغيير_صورة_آر_بي_جي',
    alias: ['ganti-maro-rpg.jpg'],
    category: 'owner',
    description: 'تغيير صورة maro-rpg.jpg (صورة مصغرة للعب)',
    usage: '.تغيير_صورة_آر_بي_جي (رد/إرسال صورة)',
    example: '.تغيير_صورة_آر_بي_جي',
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
        return m.reply(`🖼️ *تغيير صورة آر بي جي*\n\n> أرسل/رد على صورة لتغييرها\n> الملف: assets/images/maro-rpg.jpg`)
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
            const newUrl = await updateAssetUrl('maro-rpg', buffer, 'maro-rpg.jpg')
            m.reply(`✅ *تم بنجاح*\n\n> تم تغيير صورة maro-rpg.jpg إلى رابط جديد:\n> ${newUrl}\n> تم تحديث التكوين في الوقت الفعلي!`)
        } catch (e) {
            m.reply(`❌ فشل رفع الصورة: ${e.message}`)
        }
    } catch (error) {
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }