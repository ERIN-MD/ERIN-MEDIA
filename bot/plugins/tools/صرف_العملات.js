import axios from 'axios';
import te from '../../src/lib/maro-error.js';
import { generateWAMessageFromContent, proto } from 'maro';

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
    'CHF': '🇨🇭 فرنك سويسري',
    'NZD': '🇳🇿 دولار نيوزيلندي',
    'SGD': '🇸🇬 دولار سنغافوري',
    'HKD': '🇭🇰 دولار هونغ كونغ',
    'KRW': '🇰🇷 وون كوري',
    'THB': '🇹🇭 بات تايلندي',
    'PHP': '🇵🇭 بيزو فلبيني',
    'MYR': '🇲🇾 رينغيت ماليزي',
    'PKR': '🇵🇰 روبية باكستانية',
    'IQD': '🇮🇶 دينار عراقي',
    'DZD': '🇩🇿 دينار جزائري',
    'MAD': '🇲🇦 درهم مغربي',
    'TND': '🇹🇳 دينار تونسي',
    'LYD': '🇱🇾 دينار ليبي',
    'SDG': '🇸🇩 جنيه سوداني',
    'YER': '🇾🇪 ريال يمني',
    'SYP': '🇸🇾 ليرة سورية'
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
    name: "صرف_العملات",
    alias: ["اسعار_الصرف"],
    category: "tools",
    description: "💱 تحويل العملات ومقارنة الأسعار",
    usage: ".صرف_العملات [المبلغ] [من] [الى]",
    example: ".صرف_العملات 100 USD EGP",
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
    const args = m.args || [];
    const pushname = m.pushName || 'مستخدم';
    const senderId = m.sender;
    const prefix = m.prefix || '.';

    // ==============================================
    // عرض القائمة مع أزرار
    // ==============================================
    if (!text) {
        let menu = `💱 *محول العملات*\n\n`;
        menu += `📝 *الاستخدام:*\n`;
        menu += `• .صرف_العملات [المبلغ] [من] [الى]\n`;
        menu += `• .صرف_العملات [من] [الى]\n\n`;
        menu += `💡 *أمثلة:*\n`;
        menu += `• .صرف_العملات 100 USD EGP\n`;
        menu += `• .صرف_العملات USD SAR\n\n`;
        menu += `🌍 *العملات الشائعة:*\n`;
        menu += `USD, EUR, SAR, AED, EGP, KWD, QAR, BHD, OMR, JOD, GBP, JPY, TRY, INR, CNY`;

        // أزرار تفاعلية للمقارنات السريعة
        try {
            const buttons = [
                { 
                    name: 'quick_reply', 
                    buttonParamsJson: JSON.stringify({ 
                        display_text: '🇪🇬 EGP → 🇺🇸 USD', 
                        id: `${prefix}صرف_العملات EGP USD` 
                    }) 
                },
                { 
                    name: 'quick_reply', 
                    buttonParamsJson: JSON.stringify({ 
                        display_text: '🇺🇸 USD → 🇪🇬 EGP', 
                        id: `${prefix}صرف_العملات USD EGP` 
                    }) 
                },
                { 
                    name: 'quick_reply', 
                    buttonParamsJson: JSON.stringify({ 
                        display_text: '🇸🇦 SAR → 🇪🇬 EGP', 
                        id: `${prefix}صرف_العملات SAR EGP` 
                    }) 
                },
                { 
                    name: 'quick_reply', 
                    buttonParamsJson: JSON.stringify({ 
                        display_text: '🇺🇸 USD → 🇸🇦 SAR', 
                        id: `${prefix}صرف_العملات USD SAR` 
                    }) 
                },
                { 
                    name: 'quick_reply', 
                    buttonParamsJson: JSON.stringify({ 
                        display_text: '🇪🇺 EUR → 🇺🇸 USD', 
                        id: `${prefix}صرف_العملات EUR USD` 
                    }) 
                },
                { 
                    name: 'quick_reply', 
                    buttonParamsJson: JSON.stringify({ 
                        display_text: '🇬🇧 GBP → 🇺🇸 USD', 
                        id: `${prefix}صرف_العملات GBP USD` 
                    }) 
                }
            ];

            const msg = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                            body: proto.Message.InteractiveMessage.Body.create({ text: menu }),
                            footer: proto.Message.InteractiveMessage.Footer.create({ text: '💱 محول العملات' }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({ buttons })
                        })
                    }
                }
            }, { userJid: senderId });

            await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
        } catch (e) {
            await m.reply(menu);
        }
        return;
    }

    // ==============================================
    // تحويل العملات
    // ==============================================
    const parts = text.split(' ');
    let amount, from, to;

    if (parts.length === 2) {
        amount = 1;
        from = parts[0];
        to = parts[1];
    } else if (parts.length >= 3) {
        amount = parseFloat(parts[0]);
        from = parts[1];
        to = parts[2];
    } else {
        return m.reply(`❌ *صيغة غير صحيحة*\n💡 مثال: .صرف_العملات 100 USD EGP`);
    }

    if (isNaN(amount) || amount <= 0) {
        return m.reply(`❌ *المبلغ غير صحيح*\n💡 يجب أن يكون رقماً موجباً`);
    }

    if (!currencyNames[from]) {
        return m.reply(`❌ *عملة غير مدعومة:* ${from}\n💡 العملات المدعومة: ${Object.keys(currencyNames).join(', ')}`);
    }
    if (!currencyNames[to]) {
        return m.reply(`❌ *عملة غير مدعومة:* ${to}\n💡 العملات المدعومة: ${Object.keys(currencyNames).join(', ')}`);
    }

    await m.react('💱');

    let rates = null;
    let sourceName = '';

    for (const [name, fetcher] of Object.entries(exchangeSources)) {
        try {
            const result = await fetcher(from);
            if (result.rates && result.rates[to]) {
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
        return m.reply(`❌ *فشل جلب سعر الصرف*\n💡 تأكد من رموز العملات وحاول لاحقاً`);
    }

    const rate = rates[to];
    const result = (amount * rate).toFixed(4);
    const reverseRate = (1 / rate).toFixed(4);

    const fromName = currencyNames[from] || from;
    const toName = currencyNames[to] || to;

    let resultText = `💱 *تحويل العملات*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    resultText += `💰 *المبلغ:* ${amount.toLocaleString()} ${from} (${fromName})\n\n`;
    resultText += `💵 *يساوي:* ${parseFloat(result).toLocaleString()} ${to} (${toName})\n\n`;
    resultText += `📊 *سعر الصرف:*\n`;
    resultText += `   • 1 ${from} = ${rate.toFixed(4)} ${to}\n`;
    resultText += `   • 1 ${to} = ${reverseRate} ${from}\n\n`;
    resultText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    resultText += `📡 *المصدر:* ${sourceName}\n`;
    resultText += `⏰ *التحديث:* ${new Date().toLocaleString('ar-SA')}`;

    await m.reply(formatDecor(resultText));
    await m.react('✅');

    // ==============================================
    // عرض مقارنة مع عملات أخرى
    // ==============================================
    const popularCurrencies = ['USD', 'EUR', 'SAR', 'AED', 'EGP', 'GBP', 'KWD', 'QAR', 'TRY'];
    let compareText = `📊 *مقارنة سريعة: 1 ${from}*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    let hasComparisons = false;
    for (const curr of popularCurrencies) {
        if (curr !== from && rates[curr]) {
            compareText += `┃ ✦ ${rates[curr].toFixed(4)} ${curr} (${currencyNames[curr] || curr})\n`;
            hasComparisons = true;
        }
    }

    if (hasComparisons) {
        await m.reply(formatDecor(compareText));
    }
}

export { pluginConfig as config, handler };