// أسماء_الله - أمر لعرض 99 اسم الله الحسنى (تصميم بسيط)

import { getRandomItem, getItemByIndex, searchItem, getAllData } from '../../src/lib/maro-game-data.js'

const pluginConfig = {
    name: 'أسماء_الله',
    alias: ['asmaulhusna', 'الاسماء', 'اسماء', 'الحسنى'],
    category: 'religi',
    description: '99 اسم الله الحسنى',
    usage: `.أسماء_الله
.أسماء_الله 47
.أسماء_الله الودود
.أسماء_الله الكل`,
    example: '.أسماء_الله 1\n.أسماء_الله الرحمن\n.أسماء_الله الكل',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

async function handler(m) {
    const query = m.args.join(' ').trim();
    let name;
    
    if (!query) {
        // عشوائي
        name = getRandomItem('asmaulhusna.json');
        
        if (name) {
            let text = `☪️ أسماء الله الحسنى\n\n`;
            text += `الاسم: ${name.arabic}\n`;
            text += `النطق: ${name.latin}\n`;
            text += `الرقم: ${name.index}/99\n\n`;
            text += `المعنى: ${name.translation_ar || '...'}\n`;
            text += `EN: ${name.translation_en || '...'}`;
            
            await m.reply(text);
        }
        return;
    }
    
    if (/^\d+$/.test(query)) {
        // بحث بالرقم
        const index = parseInt(query);
        if (index < 1 || index > 99) {
            await m.reply('الرقم يجب أن يكون بين 1 و 99');
            return;
        }
        name = getItemByIndex('asmaulhusna.json', index);
        
    } else if (query === 'الكل' || query.toLowerCase() === 'all') {
        // عرض الكل بصفحات
        const allNames = getAllData('asmaulhusna.json');
        const page = parseInt(m.args[1]) || 1;
        const perPage = 33;
        const totalPages = Math.ceil(allNames.length / perPage);
        const start = (page - 1) * perPage;
        const pageItems = allNames.slice(start, start + perPage);
        
        let text = `☪️ أسماء الله الحسنى\n`;
        text += `الصفحة ${page} من ${totalPages}\n\n`;
        
        for (const n of pageItems) {
            text += `${n.index}. ${n.arabic} - ${n.latin}\n`;
        }
        
        if (page < totalPages) {
            text += `\nللمتابعة: .أسماء_الله الكل ${page + 1}`;
        }
        
        await m.reply(text);
        return;
        
    } else {
        // بحث بالاسم
        name = searchItem('asmaulhusna.json', query, 'latin');
        if (!name) {
            name = searchItem('asmaulhusna.json', query, 'arabic');
        }
        if (!name) {
            const all = getAllData('asmaulhusna.json');
            name = all.find(n => 
                (n.arabic && n.arabic.includes(query)) ||
                (n.latin && n.latin.toLowerCase().includes(query.toLowerCase()))
            );
        }
    }
    
    if (!name) {
        await m.reply('الاسم غير موجود، جرب رقماً من 1 إلى 99');
        return;
    }
    
    let text = `☪️ أسماء الله الحسنى\n\n`;
    text += `الرقم: ${name.index} / 99\n`;
    text += `النطق: ${name.latin}\n`;
    text += `الاسم: ${name.arabic}\n\n`;
    text += `المعنى بالعربية:\n`;
    text += `${name.translation_ar || '...'}\n\n`;
    text += `المعنى بالإنجليزية:\n`;
    text += `${name.translation_en || '...'}\n\n`;
    text += `اللهم إنا نسألك بكل اسم هو لك\n`;
    text += `أن ترزقنا حبك وحب من يحبك`;
    
    await m.reply(text);
}

export { pluginConfig as config, handler }