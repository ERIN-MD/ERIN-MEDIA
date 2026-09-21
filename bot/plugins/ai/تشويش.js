import fs from 'fs';
import { execSync } from 'child_process';
import { downloadContentFromMessage } from 'maro';

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'تشويش',
    alias: ['blur'],
    category: 'ai',
    description: 'تشويش الصور وتقليل الجودة',
    usage: '.تشويش (رد على صورة) [المستوى]',
    example: '.تشويش 10',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true,
};

// ═══════════════════════════════════════════════
// 📥 تحميل الصورة
// ═══════════════════════════════════════════════
async function downloadMedia(imageMessage) {
    try {
        if (!fs.existsSync('./temp')) fs.mkdirSync('./temp', { recursive: true });

        const stream = await downloadContentFromMessage(imageMessage, 'image');
        let buffer = Buffer.from([]);

        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        if (!buffer.length) return null;

        const filePath = `./temp/${Date.now()}_original.jpg`;
        fs.writeFileSync(filePath, buffer);
        return filePath;

    } catch (err) {
        console.error('❌ فشل تحميل الوسائط:', err);
        return null;
    }
}

// ═══════════════════════════════════════════════
// 🔮 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    try {
        const isImage = m.isImage || (m.quoted && (m.quoted.isImage || m.quoted.type === 'imageMessage'));

        if (!isImage) {
            return m.reply('📸 *أرسل صورة أو رد على صورة لتشويشها*');
        }

        m.react('🔮');

        // تحميل الصورة
        let buffer;
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download();
        } else if (m.isMedia) {
            buffer = await m.download();
        }

        if (!buffer) return m.reply('❌ فشل تحميل الصورة');

        const inputPath = `./temp/blur_in_${Date.now()}.jpg`;
        fs.writeFileSync(inputPath, buffer);

        // مستوى التشويش
        let blurLevel = parseInt(m.args[0]) || 15;
        if (blurLevel < 5) blurLevel = 5;
        if (blurLevel > 50) blurLevel = 50;

        const outputPath = `./temp/blur_out_${Date.now()}.jpg`;

        execSync(`convert "${inputPath}" -blur 0x${blurLevel} "${outputPath}"`);

        await sock.sendMessage(m.chat, {
            image: fs.readFileSync(outputPath),
            caption: `🔮 *تم تشويش الصورة*\n📊 المستوى: ${blurLevel}%`
        }, { quoted: m });

        // تنظيف
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);

        m.react('✅');

    } catch (err) {
        console.error('❌ خطأ:', err);
        m.react('❌');
        m.reply('❌ حدث خطأ أثناء تشويش الصورة');
    }
}

export { pluginConfig as config, handler };