// تغيير الصوت - أمر لتغيير ملف maro.mp3

import fs from 'fs'
import path from 'path'
import te from '../../src/lib/maro-error.js'
import { updateAssetUrl } from '../../src/lib/maro-uploader.js'

const pluginConfig = {
    name: 'تغيير_الصوت',
    alias: ['ganti-maro.mp3'],
    category: 'owner',
    description: 'تغيير ملف maro.mp3',
    usage: '.تغيير_الصوت (رد/إرسال صوت)',
    example: '.تغيير_الصوت',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isAudio = m.type === 'audioMessage' || (m.quoted && m.quoted.type === 'audioMessage')
    
    if (!isAudio) {
        return m.reply(`🎵 *تغيير الصوت*\n\n> أرسل/رد على ملف صوتي لتغييره\n> الملف: assets/audio/maro.mp3`)
    }
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }
        
        if (!buffer) {
            return m.reply(`❌ فشل تحميل الملف الصوتي`)
        }
        
        await m.reply(`⏳ جاري رفع الملف الصوتي...`)
        try {
            const newUrl = await updateAssetUrl('maro-mp3', buffer, 'maro.mp3')
            m.reply(`✅ *تم بنجاح*\n\n> تم تغيير ملف maro.mp3 إلى رابط جديد:\n> ${newUrl}\n> تم تحديث التكوين في الوقت الفعلي!`)
        } catch (e) {
            m.reply(`❌ فشل رفع الملف: ${e.message}`)
        }
    } catch (error) {
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }