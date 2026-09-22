import axios from 'axios';
import config from '../../config.js';
import te from '../../src/lib/maro-error.js';

async function checkWebsite(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    
    const domain = url.replace(/https?:\/\//, '').replace(/\/.*/, '');
    const results = {
        url, domain,
        status: null, statusText: '', responseTime: 0,
        server: '', contentType: '', ssl: null,
        screenshot: '', security: null, ip: '', cert: ''
    };
    
    const startTime = Date.now();
    
    // 1. فحص الموقع مباشرة
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const response = await fetch(url, {
            method: 'GET', signal: controller.signal, redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive'
            }
        });
        clearTimeout(timeout);
        results.responseTime = Date.now() - startTime;
        results.server = response.headers.get('server') || 'غير معروف';
        results.contentType = response.headers.get('content-type') || 'غير معروف';
        results.ssl = url.startsWith('https://') ? '✅ مفعل' : '❌ غير مفعل';
        results.status = response.ok ? `✅ ${response.status} (ناجح)` : 
                        response.status >= 300 && response.status < 400 ? `🔄 ${response.status} (إعادة توجيه)` :
                        response.status >= 400 && response.status < 500 ? `⚠️ ${response.status} (خطأ عميل)` : `❌ ${response.status} (خطأ خادم)`;
    } catch (error) {
        results.status = '❌ فشل الاتصال';
        results.statusText = error.message;
        results.responseTime = Date.now() - startTime;
    }

    // 2. فحص Sucuri
    try {
        const { data } = await axios.get(`https://sitecheck.sucuri.net/api/v3/?scan=${domain}`, {
            headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        results.security = data.ratings?.security?.rating || '?';
        results.tls = data.ratings?.tls?.rating || '?';
        results.ip = data.site?.ip || '';
        results.cert = data.tls?.cert_issuer || '';
    } catch (e) {}

    // 3. لقطة شاشة
    results.screenshot = `https://image.thum.io/get/png/noanimate/fullpage/${url}`;

    return results;
}

const pluginConfig = {
    name: 'فحص_موقع',
    alias: ['site', 'فحص'],
    category: 'tools',
    description: '🌐 فحص المواقع والروابط',
    usage: '.فحص_موقع <رابط>',
    example: '.فحص_موقع github.com',
    isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
    cooldown: 15, energi: 2, isEnabled: true
};

async function handler(m, { sock }) {
    let url = m.args.join(' ').trim();
    
    if (!url) {
        return m.reply(`🌐 *فحص_موقع*\n\n📌 مثال: \`${m.prefix}فحص_موقع github.com\``);
    }
    
    m.react('🌐');
    
    try {
        const r = await checkWebsite(url);
        
        let caption = `🌐 *تقرير فحص الموقع*\n\n` +
            `🔗 *الرابط:* ${r.url}\n` +
            `📊 *الحالة:* ${r.status}\n` +
            (r.statusText ? `📝 *تفاصيل:* ${r.statusText}\n` : '') +
            `⏱️ *الاستجابة:* ${r.responseTime}ms\n` +
            `🖥️ *الخادم:* ${r.server}\n` +
            `📄 *المحتوى:* ${r.contentType}\n` +
            `🔒 *SSL:* ${r.ssl}\n`;
        
        if (r.security) {
            caption += `\n🛡️ *الأمان:* ${r.security}\n` +
                       `🔐 *TLS:* ${r.tls || '?'}\n` +
                       `📍 *IP:* ${r.ip || '?'}\n` +
                       `📜 *الشهادة:* ${r.cert || '?'}`;
        }

        await sock.sendMessage(m.chat, {
            image: { url: r.screenshot },
            caption
        }, { quoted: m });

        m.react(r.status?.startsWith('✅') ? '✅' : '❌');
    } catch (error) {
        console.error('Scan Error:', error);
        m.react('❌');
        m.reply(te(m.prefix, m.command, m.pushName));
    }
}

export { pluginConfig as config, handler };