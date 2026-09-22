// صورة_لنص - أمر لتحويل الصورة إلى نص توصيفي للذكاء الاصطناعي

import imgtoprompt from '../../src/scraper/img2prompt.js'
import fs from 'fs'
import path from 'path'
import te from '../../src/lib/maro-error.js'
import sharp from 'sharp'

const pluginConfig = {
    name: 'صورة_لنص',
    alias: ['imgtoprompt'],
    category: 'tools',
    description: 'تحويل الصورة إلى نص توصيفي للذكاء الاصطناعي',
    usage: '.صورة_لنص (رد على صورة)',
    example: '.صورة_لنص',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
};

async function handler(m, { sock }) {
    try {
        const isImage = m.isImage || (m.quoted && m.quoted.isImage);
        if (!isImage) {
            return await m.reply('❌ *الصورة مطلوبة*\n\n> رد أو أرسل صورة مع تعليق .صورة_لنص');
        }
        
        await m.reply('🕕 *جاري معالجة الصورة...*\n\n> تحليل الصورة لإنشاء نص توصيفي');
        
        let mediaBuffer;
        if (m.isImage && m.download) {
            mediaBuffer = await m.download();
        } else if (m.quoted && m.quoted.isImage && m.quoted.download) {
            mediaBuffer = await m.quoted.download();
        } else {
            return await m.reply('❌ فشل تحميل الصورة');
        }
        
        if (!mediaBuffer || !Buffer.isBuffer(mediaBuffer)) {
            return await m.reply('❌ بيانات الصورة غير صالحة');
        }

        // ضغط الصورة مع الحفاظ على الجودة العالية
        let imageBuffer = mediaBuffer;
        const originalSize = mediaBuffer.length;
        
        // فقط إذا كانت الصورة أكبر من 2 ميجابايت
        if (mediaBuffer.length > 2 * 1024 * 1024) {
            await m.reply('🔄 *تحسين الصورة...*\n\n> الصورة كبيرة، جاري تحسينها للحصول على أفضل وصف');
            
            try {
                // استخدام حجم أكبر للحفاظ على التفاصيل (768 بدلاً من 512)
                imageBuffer = await sharp(mediaBuffer)
                    .resize(768, 768, { 
                        fit: 'inside', 
                        withoutEnlargement: true,
                        kernel: sharp.kernel.lanczos3 // أفضل جودة للتصغير
                    })
                    .jpeg({ 
                        quality: 92, // جودة عالية (92 بدلاً من 80)
                        chromaSubsampling: '4:4:4' // الحفاظ على تفاصيل الألوان
                    })
                    .toBuffer();
                    
                console.log(`[صورة_لنص] تم ضغط الصورة من ${(originalSize / 1024 / 1024).toFixed(2)}MB إلى ${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB`);
                
            } catch (compressErr) {
                console.error('[صورة_لنص] فشل الضغط:', compressErr.message);
                imageBuffer = mediaBuffer;
            }
        } else {
            // إذا كانت الصورة صغيرة، استخدمها كما هي
            console.log(`[صورة_لنص] حجم الصورة مناسب: ${(originalSize / 1024 / 1024).toFixed(2)}MB`);
        }

        const tmpDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }
        
        // استخدام امتداد jpg للحفاظ على الجودة
        const tmpFile = path.join(tmpDir, `img2prompt_${Date.now()}.jpg`);
        fs.writeFileSync(tmpFile, imageBuffer);
        
        const result = await imgtoprompt(tmpFile);
        
        try {
            fs.unlinkSync(tmpFile);
        } catch (e) {}
        
        if (result.status === 'eror' || !result.prompt) {
            return await m.reply(`❌ *فشل*\n\n> ${result.msg || 'لا يمكن إنشاء نص توصيفي من هذه الصورة'}`);
        }
        
        const responseText = `🎨 *من الصورة إلى النص*\n\n` +
            `\`\`\`${result.prompt}\`\`\`\n\n` +
            `> _تم الإنشاء: ${result.generatedAt || new Date().toISOString()}_`;
        await m.reply(responseText);
        
    } catch (error) {
        console.error('[ImgToPrompt Error]', error);
        m.reply(te(m.prefix, m.command, m.pushName));
    }
}

export { pluginConfig as config, handler }