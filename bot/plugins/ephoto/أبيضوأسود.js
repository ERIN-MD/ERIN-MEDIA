import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

const TEMP_DIR = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

function formatDecor(text) {
    if (!text) return '';
    const top = '╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮';
    const bottom = '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯';
    const linePrefix = '┃ ✦ ';
    
    const lines = text.split(/\r?\n/);
    const formattedLines = lines.map(line => {
        if (!line.trim()) return '┃';
        return `${linePrefix}${line}`;
    });

    return [top, ...formattedLines, bottom].join('\n');
}

const filters = {
    '1': { name: 'أبيض وأسود', apply: async (image) => image.greyscale() },
    '2': { name: 'ضبابي', apply: async (image) => image.blur(5) },
    '3': { name: 'عكس الألوان', apply: async (image) => image.invert() },
    '4': { name: 'سيبيا (قديم)', apply: async (image) => image.sepia() },
    '5': { name: 'تفتيح', apply: async (image) => image.brightness(0.3) },
    '6': { name: 'تعتيم', apply: async (image) => image.brightness(-0.3) },
    '7': { name: 'تباين عالي', apply: async (image) => image.contrast(0.5) },
    '8': { name: 'تدوير 90°', apply: async (image) => image.rotate(90) },
    '9': { name: 'عكس أفقي', apply: async (image) => image.flip({ horizontal: true, vertical: false }) },
    '10': { name: 'عكس رأسي', apply: async (image) => image.flip({ horizontal: false, vertical: true }) },
    '11': { name: 'دائري', apply: async (image) => image.circle() },
    '12': { name: 'بكسل', apply: async (image) => image.pixelate(10) }
};

async function extractImage(m) {
    if (m.quoted?.message?.imageMessage) return await m.quoted.download();
    if (m.message?.imageMessage) return await m.download();
    return null;
}

const pluginConfig = {
    name: 'فلتر',
    alias: ['filter'],
    category: 'ephoto',
    description: '🎨 إضافة فلاتر وتأثيرات على الصور (محلياً)',
    usage: '.فلتر <رقم>',
    example: '.فلتر 1',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
};

async function handler(m, { sock }) {
    const args = m.args || [];
    const filterNum = args[0];
    
    if (!filterNum || !filters[filterNum]) {
        let menuText = `🎨 *فلاتر الصور*\n\n`;
        menuText += `📝 *الاستخدام:*\n`;
        menuText += `• رد على صورة: .فلتر [الرقم]\n\n`;
        menuText += `🎭 *الفلاتر المتاحة:*\n`;
        
        for (const [num, filter] of Object.entries(filters)) {
            menuText += `  ${num} - ${filter.name}\n`;
        }
        
        return m.reply(menuText);
    }
    
    const filter = filters[filterNum];
    await m.react('🎨');
    
    const buffer = await extractImage(m);
    
    if (!buffer) {
        return m.reply(`❌ *لم يتم العثور على صورة*\n\nرد على صورة: .فلتر ${filterNum}`);
    }
    
    await m.reply(`🎨 *جاري تطبيق فلتر ${filter.name}...*`);
    
    try {
        const image = await Jimp.read(buffer);
        await filter.apply(image);
        const resultBuffer = await image.getBuffer('image/jpeg');
        
        await sock.sendMessage(m.chat, {
            image: resultBuffer,
            caption: `🎨 *${filter.name}*\n👤 ${m.pushName}`
        }, { quoted: m });
        
        await m.react('✅');
        
    } catch (error) {
        await m.react('❌');
        await m.reply(`❌ *فشل تطبيق الفلتر*\n${error.message}`);
    }
}

export { pluginConfig as config, handler };