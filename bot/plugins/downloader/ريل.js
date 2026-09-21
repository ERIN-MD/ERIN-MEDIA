import fetch from 'node-fetch';
import { generateWAMessageFromContent } from 'maro';
import { createErrorMessage } from '../../src/lib/maro-formatter.js';
import config from '../../config.js';
import fs from 'fs';

const SEARCH_URL = 'https://search.brave.com/search';
const DUCKDUCKGO_URL = 'https://html.duckduckgo.com/html/';
const USER_AGENT = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
const MAX_RESULTS = 10;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
const REQUEST_TIMEOUT = 20000;
const SEARCH_TTL = 5 * 60 * 1000;

function decodeHtml(value = '') {
    return value.replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#x27;|&#39;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');
}

function cleanText(value = '') {
    return decodeHtml(value.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function unescapeUrl(value = '') {
    return decodeHtml(value).replace(/\\\//g, '/').replace(/\\u0026/gi, '&');
}

function canonicalInstagramUrl(rawUrl) {
    try {
        const url = new URL(rawUrl);
        if (!['instagram.com', 'www.instagram.com'].includes(url.hostname)) return null;
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length < 2 || !['reel', 'p', 'tv'].includes(parts[0])) return null;
        return `https://www.instagram.com/${parts[0]}/${parts[1]}/`;
    } catch { return null; }
}

function extractSearchResults(html, limit) {
    const found = [];
    const linkRegex = /href=["'](https:\/\/(?:www\.)?instagram\.com\/(?:reel|p|tv)\/[^"']+)["']/gi;
    let match;
    while ((match = linkRegex.exec(html)) && found.length < limit * 2) {
        const permalink = canonicalInstagramUrl(match[1]);
        if (!permalink) continue;
        const context = html.slice(match.index, match.index + 5000);
        const titleMatch = /class=["'][^"']*search-snippet-title[^"']*["'][^>]*title=["']([^"']*)["']/i.exec(context);
        found.push({ permalink, title: cleanText(titleMatch?.[1] || '') || 'Instagram Reel', description: '' });
    }
    return [...new Map(found.map(item => [item.permalink, item])).values()].slice(0, limit);
}

function extractDuckDuckGoResults(html, limit) {
    const found = [];
    const resultRegex = /<a[^>]+class=["'][^"']*result__a[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = resultRegex.exec(html)) && found.length < limit * 2) {
        try {
            const raw = match[1].startsWith('//') ? `https:${match[1]}` : match[1];
            const searchUrl = new URL(raw);
            const target = searchUrl.searchParams.get('uddg');
            const permalink = canonicalInstagramUrl(target ? decodeURIComponent(target) : raw);
            if (!permalink) continue;
            found.push({ permalink, title: cleanText(match[2]) || 'Instagram Reel', description: '' });
        } catch {}
    }
    return [...new Map(found.map(item => [item.permalink, item])).values()].slice(0, limit);
}

async function fetchText(url, timeout = REQUEST_TIMEOUT) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': USER_AGENT, Accept: 'text/html', 'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8', Referer: 'https://www.google.com/' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.text();
    } finally { clearTimeout(timer); }
}

function findBalancedArray(html, start) {
    let depth = 0, inString = false, escaped = false;
    for (let index = start; index < html.length; index += 1) {
        const char = html[index];
        if (inString) { if (escaped) escaped = false; else if (char === '\\') escaped = true; else if (char === '"') inString = false; continue; }
        if (char === '"') inString = true;
        else if (char === '[') depth += 1;
        else if (char === ']') { depth -= 1; if (depth === 0) return html.slice(start, index + 1); }
    }
    return null;
}

function extractJsonArrayAfter(html, propertyName) {
    const markers = [`"${propertyName}"`, `\\"${propertyName}\\"`, propertyName];
    for (const marker of markers) {
        let from = 0;
        while (from < html.length) {
            const markerIndex = html.indexOf(marker, from);
            if (markerIndex < 0) break;
            const start = html.indexOf('[', markerIndex + marker.length);
            if (start >= 0) { const raw = findBalancedArray(html, start); if (raw) return raw; }
            from = markerIndex + marker.length;
        }
    }
    return null;
}

function parseJsonArray(raw) {
    if (!raw) return null;
    for (const candidate of [raw, raw.replace(/\\"/g, '"')]) {
        try { const value = JSON.parse(candidate); if (Array.isArray(value)) return value; } catch {}
    }
    return null;
}

function extractDirectVideoUrl(html) {
    const versions = parseJsonArray(extractJsonArrayAfter(html, 'video_versions'))
        ?.filter(item => item && typeof item.url === 'string')
        .map(item => ({ ...item, url: unescapeUrl(item.url) }))
        .filter(item => item.url.startsWith('http'));
    if (versions?.length) {
        versions.sort((a, b) => (Number(b.width || 0) * Number(b.height || 0)) - (Number(a.width || 0) * Number(a.height || 0)));
        return versions[0].url;
    }
    return null;
}

async function downloadVideo(videoUrl) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
        const response = await fetch(videoUrl, { signal: controller.signal, headers: { 'User-Agent': USER_AGENT, Accept: 'video/mp4,video/*', Referer: 'https://www.instagram.com/' } });
        if (!response.ok) throw new Error(`Video HTTP ${response.status}`);
        const buffer = Buffer.from(await response.arrayBuffer());
        if (!buffer.length) throw new Error('الفيديو فارغ');
        if (buffer.length > MAX_VIDEO_BYTES) throw new Error('الفيديو أكبر من 25 ميجابايت');
        return { buffer, mimetype: (response.headers.get('content-type') || 'video/mp4').split(';')[0] };
    } finally { clearTimeout(timer); }
}

async function searchInstagram(query, limit) {
    const q = `site:instagram.com/reel ${query}`;
    const sources = [
        { url: `${SEARCH_URL}?${new URLSearchParams({ q, source: 'web' })}`, parse: extractSearchResults },
        { url: `${DUCKDUCKGO_URL}?${new URLSearchParams({ q })}`, parse: extractDuckDuckGoResults }
    ];
    for (const source of sources) {
        try { const results = source.parse(await fetchText(source.url), limit); if (results.length) return results; } catch {}
    }
    throw new Error('لا توجد نتائج');
}

function resultStore() {
    global.insta_results = global.insta_results || Object.create(null);
    return global.insta_results;
}

const pluginConfig = {
    name: 'ريل',
    alias: ['instareel', 'انستا', 'insta'],
    category: 'downloader',
    description: '♤ بحث وتحميل ريلز إنستجرام',
    usage: '.ريل [كلمة البحث]',
    example: '.ريل cats',
    isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
    cooldown: 10, energi: 2, isEnabled: true
};

async function handler(m, { sock }) {
    const args = m.args || [];
    const command = m.command || '';
    const prefix = m.prefix || '.';
    const sharp = (await import('sharp')).default;

    // تحميل
    if (command === 'ريل' && args[0] === 'تحميل' && args[1]) {
        const num = parseInt(args[1], 10);
        if (!num || num < 1) return m.reply(createErrorMessage('رقم غير صحيح'));

        const data = resultStore()[m.sender];
        if (!data || Date.now() - data.timestamp > SEARCH_TTL) {
            return m.reply(createErrorMessage('انتهت صلاحية البحث\nاستخدم .ريل [كلمة] للبحث من جديد'));
        }

        const c = data.candidates[num - 1];
        if (!c) return m.reply(createErrorMessage(`اختر من 1 إلى ${data.candidates.length}`));

        await m.react('⏳');

        try {
            const pageHtml = await fetchText(c.permalink);
            const videoUrl = extractDirectVideoUrl(pageHtml);
            if (!videoUrl) throw new Error('لم يتم العثور على رابط الفيديو');

            const dl = await downloadVideo(videoUrl);
            await sock.sendMessage(m.chat, {
                video: dl.buffer,
                mimetype: dl.mimetype || 'video/mp4',
                caption: `♤ ${c.title || 'Instagram Reel'}`
            }, { quoted: m });

            await m.react('✅');
            delete resultStore()[m.sender];
        } catch (e) {
            await m.react('❌');
            return m.reply(createErrorMessage(e.message));
        }
        return;
    }

    // بحث
    const text = m.text || '';
    if (!text) return m.reply(createErrorMessage('يرجى إدخال كلمة البحث\nمثال: .ريل cats'));

    await m.react('🔍');

    let candidates;
    try {
        candidates = await searchInstagram(text, MAX_RESULTS);
    } catch {
        await m.react('❌');
        return m.reply(createErrorMessage('تعذر البحث'));
    }

    if (!candidates.length) {
        await m.react('❌');
        return m.reply(createErrorMessage(`لا توجد نتائج لـ: ${text}`));
    }

    resultStore()[m.sender] = { candidates, timestamp: Date.now() };

    const rows = candidates.map((c, i) => ({
        title: (c.title || 'Instagram Reel').slice(0, 40),
        description: 'اضغط للتحميل',
        id: `${prefix}ريل تحميل ${i + 1}`
    }));

    const thumbBuffer = fs.existsSync(config.assets["maro"]) 
        ? await sharp(fs.readFileSync(config.assets["maro"])).resize(300, 170).toBuffer()
        : null;

    const content = {
        buttonsMessage: {
            buttons: [{
                buttonText: { displayText: '♤ اختر الفيديو' },
                buttonId: 'select_video',
                type: 1,
                nativeFlowInfo: {
                    name: 'single_select',
                    paramsJson: JSON.stringify({
                        title: '♤ اختر الفيديو للتحميل',
                        sections: [{ title: `۩ ${text}`, rows }]
                    })
                }
            }],
            locationMessage: {
                jpegThumbnail: thumbBuffer || Buffer.alloc(0),
                name: '♤ INSTAGRAM',
                address: `۩ ${candidates.length} نتيجة  ♤  ${text}`
            },
            contentText: `♘ *نتائج البحث*\n\n۩ *${text}*\n♤ ${candidates.length} نتيجة\n\nاختر الفيديو من الزر أدناه`,
            footerText: '♤ Tarboo Bot  ♤',
            headerType: 6
        }
    };

    const msg = generateWAMessageFromContent(m.chat, content, { userJid: sock.user.jid, quoted: m });
    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    await m.react('✅');
}

export { pluginConfig as config, handler };