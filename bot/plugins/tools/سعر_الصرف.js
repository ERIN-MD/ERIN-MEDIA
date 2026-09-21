import axios from 'axios';
import te from '../../src/lib/maro-error.js';

// ==============================================
// 🎨 دوال التنسيق
// ==============================================
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

// ==============================================
// 🌍 العملات الشائعة وأسمائها
// ==============================================
const currencyNames = {
    'USD': '🇺🇸 دولار أمريكي',
    'EUR': '🇪🇺 يورو',
    'GBP': '🇬🇧 جنيه إسترليني',
    'JPY': '🇯🇵 ين ياباني',
    'SAR': '🇸🇦 ريال سعودي',
    'AED': '🇦🇪 درهم إماراتي',
    'EGP': '🇪🇬 جنيه مصري',
    'KWD': '🇰🇼 دينار كويتي',
    'QAR': '🇶🇦 ريال قطري',
    'BHD': '🇧🇭 دينار بحريني',
    'OMR': '🇴🇲 ريال عماني',
    'JOD': '🇯🇴 دينار أردني',
    'LBP': '🇱🇧 ليرة لبنانية',
    'TRY': '🇹🇷 ليرة تركية',
    'INR': '🇮🇳 روبية هندية',
    'CNY': '🇨🇳 يوان صيني',
    'AUD': '🇦🇺 دولار أسترالي',
    'CAD': '🇨🇦 دولار كندي',
    'CHF': '🇨🇭 فرنك سويسري'
};

// ==============================================
// 📡 مصادر أسعار الصرف
// ==============================================
const exchangeSources = {
    primary: async (base) => {
        const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${base}`, { timeout: 8000 });
        if (response.data && response.data.rates) {
            return { rates: response.data.rates, source: 'ExchangeRate-API' };
        }
        throw new Error('No rates');
    },
    
    fallback: async (base) => {
        const response = await axios.get(`https://open.er-api.com/v6/latest/${base}`, { timeout: 8000 });
        if (response.data && response.data.rates) {
            return { rates: response.data.rates, source: 'Open ER API' };
        }
        throw new Error('No rates');
    },
    
    lastResort: async (base) => {
        const response = await axios.get(`https://api.frankfurter.app/latest?from=${base}`, { timeout: 8000 });
        if (response.data && response.data.rates) {
            return { rates: response.data.rates, source: 'Frankfurter' };
        }
        throw new Error('No rates');
    }
};

// ==============================================
// 🎯 إعدادات الأمر
// ==============================================
const pluginConfig = {
    name: "سعر_الصرف",
    alias: ["صرف_العملات"],
    category: "tools",
    description: "💱 عرض أسعار الصرف",
    usage: ".سعر_الصرف [العملة]",
    example: ".سعر_الصرف USD",
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
};

// ==============================================
// 🎯 الأمر الرئيسي
// ==============================================
async function handler(m, { sock }) {
    const text = m.text?.trim()?.toUpperCase() || '';
    const pushname = m.pushName || 'مستخدم';

    // ==============================================
    // عرض المساعدة
    // ==============================================
    if (!text) {
        let menu = `💱 *أسعار الصرف*\n\n`;
        menu += `📝 *الاستخدام:*\n`;
        menu += `• .سعر_الصرف [العملة]\n\n`;
        menu += `💡 *أمثلة:*\n`;
        menu += `• .سعر_الصرف USD\n`;
        menu += `• .سعر_الصرف SAR\n`;
        menu += `• .سعر_الصرف EGP\n\n`;
        menu += `🌍 *العملات المدعومة:*\n`;
        menu += `USD, EUR, SAR, AED, EGP, KWD, QAR, BHD, OMR, JOD, GBP, JPY`;

        return m.reply(menu);
    }

    await m.react('💱');

    // ==============================================
    // التحقق من العملة
    // ==============================================
    const baseCurrency = text;
    if (!currencyNames[baseCurrency]) {
        return m.reply(`❌ *عملة غير مدعومة*\n\n💡 العملات المدعومة:\n${Object.keys(currencyNames).join(', ')}`);
    }

    // ==============================================
    // جلب أسعار الصرف
    // ==============================================
    let rates = null;
    let sourceName = '';

    for (const [name, fetcher] of Object.entries(exchangeSources)) {
        try {
            const result = await fetcher(baseCurrency);
            if (result.rates) {
                rates = result.rates;
                sourceName = result.source;
                break;
            }
        } catch (e) {
            console.log(`⚠️ ${name} فشل:`, e.message);
        }
    }

    if (!rates) {
        await m.react('❌');
        return m.reply(`❌ *فشل جلب أسعار الصرف*\n💡 حاول مرة أخرى لاحقاً`);
    }

    // ==============================================
    // عرض أسعار الصرف للعملات الرئيسية
    // ==============================================
    const mainCurrencies = ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'KWD', 'QAR', 'BHD', 'OMR', 'JOD', 'TRY'];
    const baseName = currencyNames[baseCurrency] || baseCurrency;

    let resultText = `💱 *أسعار الصرف مقابل ${baseCurrency}*\n`;
    resultText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    resultText += `💰 *العملة الأساسية:* ${baseCurrency} (${baseName})\n\n`;

    for (const curr of mainCurrencies) {
        if (curr !== baseCurrency && rates[curr]) {
            const rate = rates[curr];
            const name = currencyNames[curr] || curr;
            resultText += `┃ ✦ 1 ${baseCurrency} = ${rate.toFixed(4)} ${curr} (${name})\n`;
        }
    }

    resultText += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    resultText += `📡 *المصدر:* ${sourceName}\n`;
    resultText += `⏰ *التحديث:* ${new Date().toLocaleString('ar-SA')}`;

    await m.reply(formatDecor(resultText));
    await m.react('✅');
}

export { pluginConfig as config, handler };