// تغيير الفيديو - أمر لتغيير ملف maro.mp4

import fs from 'fs'
import path from 'path'
import te from '../../src/lib/maro-error.js'
import { updateAssetUrl } from '../../src/lib/maro-uploader.js'

const pluginConfig = {
    name: 'تغيير_الفيديو',
    alias: ['ganti-maro.mp4'],
    category: 'owner',
    description: 'تغيير ملف maro.mp4',
    usage: '.تغيير_الفيديو (رد/إرسال فيديو)',
    example: '.تغيير_الفيديو',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isVideo = m.type === 'videoMessage' || (m.quoted && m.quoted.type === 'videoMessage')
    
    if (!isVideo) {
        return m.reply(`🎬 *تغيير الفيديو*\n\n> أرسل/رد على فيديو لتغييره\n> الملف: assets/video/maro.mp4`)
    }
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }
        
        if (!buffer) {
            return m.reply(`❌ فشل تحميل الفيديو`)
        }
        
        await m.reply(`⏳ جاري رفع الفيديو...`)
        try {
            const newUrl = await updateAssetUrl('maro-mp4', buffer, 'maro.mp4')
            m.reply(`✅ *تم بنجاح*\n\n> تم تغيير ملف maro.mp4 إلى رابط جديد:\n> ${newUrl}\n> تم تحديث التكوين في الوقت الفعلي!`)
        } catch (e) {
            m.reply(`❌ فشل رفع الملف: ${e.message}`)
        }
    } catch (error) {
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }