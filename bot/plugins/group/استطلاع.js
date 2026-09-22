const pluginConfig = {
    name: 'استطلاع',
    alias: ['poll'],
    category: 'group',
    description: 'إنشاء استطلاع/تصويت في المجموعة',
    usage: '.استطلاع <سؤال> | <خيار1>, <خيار2>, ...',
    example: '.استطلاع ماذا نأكل؟ | أرز مقلي, نودلز, كرات لحم',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 30,
    energi: 1,
    isEnabled: true
};

async function handler(m, { sock }) {
    const text = m.text || '';
    
    if (!text || text.trim() === '') {
        await m.reply(
            `⚠️ *خطأ*\n\n` +
            `> الصيغة غير صالحة!\n\n` +
            `*الصيغة:*\n` +
            `> \`.استطلاع سؤال | خيار1, خيار2\`\n\n` +
            `*مثال:*\n` +
            `> \`.استطلاع ماذا نتناول؟ | أرز مقلي, نودلز\`\n\n` +
            `*خيار إضافي:*\n` +
            `> \`.استطلاع متعدد | سؤال | خيار1, خيار2, خيار3\`\n` +
            `> (للاختيار المتعدد)`
        );
        return;
    }
    
    let isMultiple = false;
    let parts = text.split('|').map(p => p.trim());
    
    if (parts[0].toLowerCase() === 'متعدد') {
        isMultiple = true;
        parts = parts.slice(1);
    }
    
    if (parts.length < 2) {
        await m.reply(`⚠️ *خطأ*\n\n> الصيغة: \`سؤال | خيار1, خيار2, ...\``);
        return;
    }
    
    const question = parts[0];
    const options = parts[1].split(',').map(o => o.trim()).filter(o => o);
    
    if (options.length < 2) {
        await m.reply(`⚠️ *خطأ*\n\n> خيارين على الأقل!`);
        return;
    }
    
    if (options.length > 12) {
        await m.reply(`⚠️ *خطأ*\n\n> الحد الأقصى 12 خيار!`);
        return;
    }
    
    if (question.length > 255) {
        await m.reply(`⚠️ *خطأ*\n\n> السؤال طويل جداً!\n> الحد الأقصى 255 حرف.`);
        return;
    }
    
    try {
        await m.reply(`✅ تم إنشاء الاستطلاع`, { mentions: [m.sender] });
        
        await sock.sendMessage(m.chat, {
            poll: {
                name: question,
                values: options,
                selectableCount: isMultiple ? options.length : 1
            }
        });
        
    } catch (error) {
        await m.reply(`❌ *خطأ*\n\n> فشل إنشاء الاستطلاع.\n> _${error.message}_`);
    }
}

export { pluginConfig as config, handler }