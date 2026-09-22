import axios from 'axios';

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'ويكي',
    alias: ['wiki'],
    category: 'ai',
    description: 'بحث في ويكيبيديا',
    usage: '.ويكي <كلمة البحث>',
    example: '.ويكي محمد صلاح',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🔍 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    const query = m.args.join(' ').trim();
    
    if (!query) {
        return m.reply(`🔍 *ويكي*\n\n📝 الاستخدام: \`${m.prefix}ويكي [كلمة البحث]\`\n💡 مثال: \`${m.prefix}ويكي محمد صلاح\``);
    }
    
    m.react('🔍');
    
    try {
        const isArabic = /[\u0600-\u06FF]/.test(query);
        const wikiLang = isArabic ? 'ar' : 'en';
        
        const searchUrl = `https://${wikiLang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json`;
        const searchRes = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000
        });
        
        const firstResult = searchRes.data.query.search[0];
        
        if (!firstResult) {
            m.react('❌');
            return m.reply(`❌ لم يتم العثور على نتائج للبحث: "${query}"`);
        }
        
        const pageTitle = firstResult.title;
        
        const summaryUrl = `https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
        const summaryRes = await axios.get(summaryUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000
        });
        
        const summary = summaryRes.data.extract || '❌ لا يوجد ملخص.';
        const imageUrl = summaryRes.data.thumbnail?.source;
        const pageUrl = `https://${wikiLang}.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`;
        
        if (imageUrl) {
            try {
                const imgResponse = await axios.get(imageUrl, {
                    responseType: 'arraybuffer', timeout: 15000,
                    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.wikipedia.org/' }
                });
                
                if (imgResponse.data && imgResponse.status === 200) {
                    await sock.sendMessage(m.chat, {
                        image: Buffer.from(imgResponse.data)
                    }, { quoted: m });
                }
            } catch (imgErr) {}
        }
        
        await m.reply(`🔍 *نتيجة البحث عن: ${query}*\n\n📚 *${pageTitle}*\n\n${summary}\n\n🔗 ${pageUrl}`);
        m.react('✅');
        
    } catch (error) {
        console.error('خطأ في البحث:', error);
        m.react('❌');
        await m.reply(`❌ حدث خطأ أثناء البحث`);
    }
}

export { pluginConfig as config, handler };