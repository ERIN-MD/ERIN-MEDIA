import axios from 'axios';
import config from '../../config.js';
import te from '../../src/lib/maro-error.js';

const API_URL = 'https://johan-vex-apis.vercel.app/api/search/apk';

const pluginConfig = {
    name: 'تحميل_تطبيق',
    alias: [],
    category: 'downloader',
    description: 'تحميل تطبيق APK',
    usage: '.تحميل_تطبيق <معرف>',
    isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
    cooldown: 30, energi: 3, isEnabled: true
};

async function handler(m, { sock }) {
    const appId = m.text?.trim();

    if (!appId) {
        const results = global.apkResults?.[m.sender];
        if (!results || results.length === 0) {
            return m.reply(`❌ لا توجد نتائج بحث\n📌 استخدم \`.تطبيق <اسم>\` أولاً`);
        }
        
        m.react('⏳');
        const app = results[0];
        
        try {
            const { data } = await axios.get(API_URL, {
                params: { q: app.id || app.package || app.name, detail: 'true' },
                timeout: 15000
            });
            
            const detail = data?.data || data?.result || app;
            const downloadUrl = detail.downloadUrl || detail.url || detail.link || detail.apkUrl;
            
            if (!downloadUrl) {
                m.react('❌');
                return m.reply('❌ رابط التحميل غير موجود');
            }

            await m.reply('📥 *جاري التحميل...*');

            const res = await axios.get(downloadUrl, {
                responseType: 'arraybuffer',
                timeout: 120000
            });

            const buffer = Buffer.from(res.data);
            const fileName = `${detail.name || detail.title || 'app'}_${detail.version || 'latest'}.apk`;
            const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);
            const caption = `✅ *${detail.name || detail.title || 'تطبيق'}*\n📦 ${sizeMB} MB | 🔖 ${detail.version || '?'}`;

            await sock.sendMessage(m.chat, {
                document: buffer,
                mimetype: 'application/vnd.android.package-archive',
                fileName: fileName,
                caption: caption
            }, { quoted: m });

            m.react('✅');
        } catch (e) {
            m.react('❌');
            m.reply(te(m.prefix, m.command, m.pushName));
        }
        return;
    }

    m.react('⏳');
    try {
        const { data } = await axios.get(API_URL, {
            params: { q: appId, detail: 'true' },
            timeout: 15000
        });
        
        const detail = data?.data || data?.result || data?.results?.[0];
        if (!detail) throw new Error('لم يتم العثور على التطبيق');
        
        const downloadUrl = detail.downloadUrl || detail.url || detail.link || detail.apkUrl;
        if (!downloadUrl) throw new Error('رابط التحميل غير موجود');

        await m.reply('📥 *جاري التحميل...*');

        const res = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 120000
        });

        const buffer = Buffer.from(res.data);
        const fileName = `${detail.name || detail.title || 'app'}_${detail.version || 'latest'}.apk`;
        const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);
        const caption = `✅ *${detail.name || detail.title || 'تطبيق'}*\n📦 ${sizeMB} MB | 🔖 ${detail.version || '?'}`;

        await sock.sendMessage(m.chat, {
            document: buffer,
            mimetype: 'application/vnd.android.package-archive',
            fileName: fileName,
            caption: caption
        }, { quoted: m });

        m.react('✅');
    } catch (e) {
        console.error('APK DL Error:', e);
        m.react('❌');
        m.reply(te(m.prefix, m.command, m.pushName));
    }
}

export { pluginConfig as config, handler };