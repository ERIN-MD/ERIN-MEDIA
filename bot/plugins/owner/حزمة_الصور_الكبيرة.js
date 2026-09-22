// حزمة الصور الكبيرة - أمر لتغيير مجموعة صور maro الكبيرة دفعة واحدة

import fs from 'fs'
import path from 'path'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'حزمة_الصور_الكبيرة',
    alias: ['maro-large'],
    category: 'owner',
    description: 'حزمة مسبقة: تغيير صورة maro.jpg، بالإضافة إلى maro-v8.jpg و maro-v10.jpg دفعة واحدة',
    usage: '.حزمة_الصور_الكبيرة (رد/إرسال صورة)',
    example: '.حزمة_الصور_الكبيرة',
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
        return m.reply(`🖼️ *حزمة الصور الكبيرة*\n\n> أرسل/رد على صورة لتغيير مجموعة الصور الكبيرة (maro.jpg, maro-v8.jpg, maro-v10.jpg) دفعة واحدة.\n> تأكد من أن نسبة الصورة مناسبة حسب الرغبة.`)
    }
    
    await m.react('🕕')
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }
        
        if (!buffer) {
            await m.react('❌')
            return m.reply(`❌ فشل تحميل الصورة`)
        }
        
        const targetImages = [
            'maro.jpg',
            'maro-v8.jpg',
            'maro-v10.jpg'
        ]
        
        const assetsDir = path.join(process.cwd(), 'assets', 'images')
        if (!fs.existsSync(assetsDir)) {
            fs.mkdirSync(assetsDir, { recursive: true })
        }
        
        for (const imgName of targetImages) {
            const targetPath = path.join(assetsDir, imgName)
            fs.writeFileSync(targetPath, buffer)
        }
        
        await m.react('✅')
        m.reply(`✅ *تم بنجاح*\n\n> تم تغيير حزمة الصور *حزمة الصور الكبيرة* بنجاح.\n> تشمل: ${targetImages.join(', ')}\n> أعد تشغيل البوت إذا لم تتغير الصور فوراً.`)
        
    } catch (error) {
        await m.react('☢')
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }