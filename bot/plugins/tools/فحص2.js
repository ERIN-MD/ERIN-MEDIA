import axios from 'axios';
import dns from 'dns';
import net from 'net';

const pluginConfig = {
    name: 'فحص2',
    alias: ['scan2', 'orb2', 'domain2'],
    category: 'tools',
    description: 'فحص أمني شامل لنطاق | ORB Scanner v2',
    usage: '.فحص2 <نطاق>',
    example: '.فحص2 example.com',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 3,
    isEnabled: true
};

function cleanDomain(raw) {
    return raw.trim().toLowerCase()
        .replace(/https?:\/\//, '')
        .split('/')[0]
        .split(':')[0];
}

function resolveDomain(domain) {
    return new Promise((resolve) => {
        dns.resolve4(domain, (err, addresses) => {
            resolve(err ? null : addresses[0]);
        });
    });
}

function getDNSRecords(domain) {
    return new Promise((resolve) => {
        const records = [];
        let done = 0;
        const types = ['A', 'MX', 'NS', 'TXT'];
        types.forEach(type => {
            dns.resolve(domain, type, (err, result) => {
                done++;
                if (!err && result) {
                    if (type === 'MX') result.forEach(r => records.push(`MX: ${r.exchange} (${r.priority})`));
                    else if (type === 'NS') result.forEach(r => records.push(`NS: ${r}`));
                    else if (type === 'TXT') result.slice(0, 2).forEach(r => records.push(`TXT: ${r.substring(0, 50)}...`));
                    else result.forEach(r => records.push(`${type}: ${r}`));
                }
                if (done === types.length) resolve(records);
            });
        });
        setTimeout(() => resolve(records), 5000);
    });
}

function scanPort(host, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(2000);
        socket.connect(port, host, () => {
            socket.destroy();
            resolve(port);
        });
        socket.on('error', () => resolve(null));
        socket.on('timeout', () => resolve(null));
    });
}

async function geoIP(ip) {
    try {
        const { data } = await axios.get(`http://ip-api.com/json/${ip}`, { timeout: 5000 });
        if (data.status === 'success') {
            return {
                country: data.country,
                city: data.city,
                isp: data.isp,
                org: data.org
            };
        }
    } catch {}
    return null;
}

async function checkWAF(domain) {
    try {
        const { headers } = await axios.get(`http://${domain}`, { timeout: 5000 });
        if (headers['cf-ray']) return 'Cloudflare 🛡️';
        if (headers['x-sucuri-id']) return 'Sucuri 🛡️';
        return 'لا يوجد ✅';
    } catch { return 'تعذر الفحص'; }
}

async function crtSh(domain) {
    try {
        const { data } = await axios.get(`https://crt.sh/?q=%.${domain}&output=json`, { timeout: 10000 });
        return [...new Set(data.map(e => e.name_value).filter(n => n.endsWith(domain)))].slice(0, 10);
    } catch { return []; }
}

async function handler(m, { sock, text }) {
    if (!text) {
        return m.reply(
            `🔍 *ORB Scanner v2*\n\n` +
            `📌 *الاستخدام:* \`${m.prefix}فحص2 <نطاق>\`\n` +
            `📌 *مثال:* \`${m.prefix}فحص2 example.com\`\n\n` +
            `⚡ *المميزات:*\n` +
            `• تحليل النطاق + IP\n` +
            `• معلومات جغرافية\n` +
            `• كشف جدران الحماية\n` +
            `• سجلات DNS\n` +
            `• فحص المنافذ\n` +
            `• ساب دومينات`
        );
    }

    const domain = cleanDomain(text);
    await m.react('🔍');
    await m.reply(`⏳ *جاري فحص* ${domain}...`);

    try {
        const ip = await resolveDomain(domain);
        if (!ip) {
            await m.react('❌');
            return m.reply(`❌ فشل تحليل النطاق: ${domain}`);
        }

        const ports = [21, 22, 25, 53, 80, 110, 143, 443, 465, 587, 993, 995, 3306, 3389, 5432, 8080, 8443, 27017];
        const [geo, waf, subs, dnsRecords, portResults] = await Promise.all([
            geoIP(ip),
            checkWAF(domain),
            crtSh(domain),
            getDNSRecords(domain),
            Promise.all(ports.map(p => scanPort(ip, p)))
        ]);

        const openPorts = portResults.filter(p => p !== null);

        let txt = `╭─🔍 *ORB Scanner v2* ─╮\n\n`;
        txt += `🌐 *النطاق:* ${domain}\n`;
        txt += `📡 *IP:* ${ip}\n`;
        
        if (geo) {
            txt += `🌍 *الدولة:* ${geo.country}\n`;
            txt += `🏙️ *المدينة:* ${geo.city}\n`;
            txt += `📶 *ISP:* ${geo.isp}\n`;
        }
        
        txt += `🛡️ *الحماية:* ${waf}\n`;
        txt += `🚪 *المنافذ:* ${openPorts.length > 0 ? openPorts.join(', ') : 'لا يوجد'}\n\n`;

        if (dnsRecords.length > 0) {
            txt += `📋 *سجلات DNS:*\n`;
            dnsRecords.slice(0, 5).forEach(r => txt += `  • ${r}\n`);
            if (dnsRecords.length > 5) txt += `  ... و ${dnsRecords.length - 5} سجل آخر\n`;
            txt += `\n`;
        }

        if (subs.length > 0) {
            txt += `🔗 *ساب دومينات:*\n`;
            subs.slice(0, 5).forEach(s => txt += `  • ${s}\n`);
            if (subs.length > 5) txt += `  ... و ${subs.length - 5} آخرين\n`;
        }

        txt += `\n╰───────────────╯`;

        await m.reply(txt);
        await m.react('✅');

    } catch (e) {
        await m.react('❌');
        await m.reply(`❌ خطأ: ${e.message}`);
    }
}

export { pluginConfig as config, handler };