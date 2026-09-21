import axios from 'axios';
import { prepareWAMessageMedia, generateWAMessageFromContent } from 'maro';
import config from '../../config.js';
import te from '../../src/lib/maro-error.js';
import sharp from 'sharp';
import fs from 'fs';

const API_URL = 'https://johan-vex-apis.vercel.app/api/search/apk';

async function searchAPK(query) {
    const response = await axios.get(API_URL, {
        params: { q: query },
        timeout: 30000
    });
    if (response.data?.success) return response.data.results || response.data.data || [];
    throw new Error(response.data?.error || 'فشل البحث');
}

async function getAppDetails(appId) {
    const response = await axios.get(API_URL, {
        params: { q: appId, detail: 'true' },
        timeout: 30000
    });
    if (response.data?.success) return response.data.data || response.data.result || null;
    throw new Error(response.data?.error || 'فشل جلب التفاصيل');
}

const pluginConfig = {
    name: 'تطبيق',
    alias: ['apk', 'تحميل_تطبيق'],
    category: 'search',
    description: 'بحث وتحميل تطبيقات APK',
    usage: '.تطبيق <اسم>',
    example: '.تطبيق whatsapp',
    isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
    cooldown: 15, energi: 2, isEnabled: true
};

async function handler(m, { sock }) {
    const query = m.args.join(' ')?.trim();

    if (!query) {
        return m.reply(`📦 *بحث التطبيقات*\n\n📌 مثال: \`${m.prefix}تطبيق whatsapp\``);
    }

    m.react('🔍');

    try {
        const results = await searchAPK(query);

        if (!results || results.length === 0) {
            m.react('❌');
            return m.reply(`❌ لا توجد نتائج لـ "${query}"`);
        }

        // تخزين النتائج
        if (!global.apkResults) global.apkResults = {};
        global.apkResults[m.sender] = results;

        // صورة البوت
        let botThumbnail = null;
        try {
            const imgBuffer = fs.readFileSync(config.assets["maro"]);
            botThumbnail = await sharp(imgBuffer).resize(300, 170).jpeg().toBuffer();
        } catch (e) {}

        // قائمة النتائج
        const rows = results.slice(0, 10).map((app, i) => ({
            title: `${i + 1}. ${(app.name || app.title || 'تطبيق').substring(0, 25)}`,
            description: `📦 ${app.size || '?'} | 🔖 ${app.version || '?'}`,
            id: `.تحميل_تطبيق ${app.id || app.package || i}`,
        }));

        const textBody = `📦 *نتائج البحث:* ${query}\n🔢 ${results.length} نتيجة\n\n_اختر تطبيق من القائمة للتحميل_`;

        const content = {
            buttonsMessage: {
                buttons: [{
                    buttonText: { displayText: '📂 اختر تطبيق' },
                    buttonId: 'select',
                    type: 1,
                    nativeFlowInfo: {
                        name: 'single_select',
                        paramsJson: JSON.stringify({
                            title: `📦 نتائج: ${query}`,
                            sections: [{ title: 'اختر تطبيق للتحميل', rows: rows }],
                        }),
                    },
                }],
                locationMessage: {
                    jpegThumbnail: botThumbnail,
                    name: '📦 تطبيقات',
                    address: `🔢 ${results.length} نتيجة | 🔍 ${query}`
                },
                contentText: textBody,
                footerText: '📦 تطبيقات APK',
                headerType: 6,
            },
        };

        const msg = generateWAMessageFromContent(m.chat, content, { userJid: sock.user.jid });
        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
        m.react('✅');
    } catch (error) {
        console.error('APK Error:', error);
        m.react('❌');
        m.reply(te(m.prefix, m.command, m.pushName));
    }
}

export { pluginConfig as config, handler };