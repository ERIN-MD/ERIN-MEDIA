import axios from 'axios';

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'جيميني',
    alias: ['gemini'],
    category: 'ai',
    description: 'اسأل نموذج Gemini',
    usage: '.جيميني <سؤال>',
    example: '.جيميني ما هو الذكاء الاصطناعي؟',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true,
};

// ═══════════════════════════════════════════════
// ✨ دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m) {
    let question = m.args.join(' ');
    
    if (!question && m.quoted) {
        const quotedMsg = m.quoted.message;
        question = quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text || '';
    }
    
    if (!question) {
        return m.reply(`✨ *Gemini AI*\n\n▸ \`${m.prefix}جيميني سؤالك هنا\`\n▸ رد على رسالة ثم \`${m.prefix}جيميني\``);
    }
    
    m.react('⏳');
    
    try {
        const response = await axios.post(
            'https://api.aqronix-host.site/api/v1/ai/chat/gemini',
            { message: question },
            { headers: { 'Content-Type': 'application/json' }, timeout: 45000 }
        );
        
        let answer = response.data?.reply || response.data?.response || response.data?.message || "لا يوجد رد";
        
        m.react('✅');
        await m.reply(`✨ *Gemini*\n━━━━━━━━━━━━━━━━━━\n\n${answer.substring(0, 4000)}`);
        
    } catch (error) {
        m.react('❌');
        
        let errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
        if (errorMsg.includes('CONCURRENCY')) errorMsg = "النموذج مشغول حالياً، حاول بعد دقيقة";
        
        m.reply(`❌ *خطأ:* ${errorMsg}`);
    }
}

export { pluginConfig as config, handler };