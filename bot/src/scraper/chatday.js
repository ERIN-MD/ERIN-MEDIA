// ═══════════════════════════════════════════════
// 📁 src/scraper/chatday.js
// 🤖 ChatDay Scraper - GPT-4o مجاني مع تخطي الحدود
// ═══════════════════════════════════════════════

import axios from 'axios';
import crypto from 'crypto';

let BASE_URL = "https://www.chatday.ai/";
let globalProxy = null;

function setProxy(proxyUrl) {
    globalProxy = proxyUrl;
}

function setBaseUrl(url) {
    if (url) {
        BASE_URL = url.endsWith('/') ? url : `${url}/`;
    }
}

function getRequestConfig(config = {}) {
    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "ar-EG,ar;q=0.9",
        "Origin": BASE_URL.replace(/\/$/, ''),
        "Referer": BASE_URL,
        ...config.headers
    };
    
    const requestConfig = {
        ...config,
        headers,
        timeout: config.timeout || 30000
    };
    
    if (globalProxy) {
        try {
            const parsed = new URL(globalProxy);
            requestConfig.proxy = {
                protocol: parsed.protocol.replace(':', ''),
                host: parsed.hostname,
                port: parseInt(parsed.port)
            };
            if (parsed.username) {
                requestConfig.proxy.auth = {
                    username: parsed.username,
                    password: parsed.password
                };
            }
        } catch (e) {}
    }
    
    return requestConfig;
}

async function getModels() {
    try {
        const html = await axios.get(BASE_URL, getRequestConfig()).then(r => r.data);
        const cleanedHtml = html.replace(/\\"/g, '"');
        const models = [];
        let idx = 0;
        
        while (true) {
            const found = cleanedHtml.indexOf('"id":"', idx);
            if (found === -1) break;
            
            let startBrace = -1;
            for (let i = found; i >= Math.max(0, found - 200); i--) {
                if (cleanedHtml[i] === '{') {
                    startBrace = i;
                    break;
                }
            }
            
            if (startBrace !== -1) {
                let openBraces = 0;
                let objStr = '';
                
                for (let i = startBrace; i < cleanedHtml.length; i++) {
                    const char = cleanedHtml[i];
                    objStr += char;
                    if (char === '{') openBraces++;
                    if (char === '}') {
                        openBraces--;
                        if (openBraces === 0) break;
                    }
                }
                
                if (objStr) {
                    try {
                        const parsed = JSON.parse(objStr);
                        if (parsed.id && parsed.provider && parsed.name) {
                            models.push(parsed);
                        }
                    } catch (e) {}
                }
            }
            idx = found + 1;
        }
        
        const uniqueModels = [];
        const ids = new Set();
        for (const m of models) {
            if (!ids.has(m.id)) {
                ids.add(m.id);
                uniqueModels.push(m);
            }
        }
        
        return { status: true, models: uniqueModels };
    } catch (error) {
        return { status: false, error: error.message };
    }
}

async function createAnonymousSession() {
    const url = `${BASE_URL.replace(/\/$/, '')}/api/auth/sign-in/anonymous`;
    const config = getRequestConfig({
        headers: { "Content-Type": "application/json" }
    });
    
    const response = await axios.post(url, {}, config);
    const cookies = response.headers['set-cookie'];
    const cookieStr = cookies ? cookies.map(c => c.split(';')[0]).join('; ') : '';
    
    return {
        status: true,
        cookie: cookieStr,
        user: response.data
    };
}

async function chat(options = {}) {
    const content = options.content || '';
    const model = options.model || 'openai/gpt-4o-mini';
    const stream = !!options.stream;
    
    let finalContent = content;
    
    if (options.history && options.history.length > 0) {
        const formattedHistory = options.history.map(m => {
            const roleName = m.role === 'user' ? 'المستخدم' : 'المساعد';
            return `${roleName}: ${m.content}`;
        }).join('\n');
        
        finalContent = `سجل المحادثة السابق:\n${formattedHistory}\n\nرسالة جديدة من المستخدم: ${content}`;
    }
    
    if (options.systemPrompt) {
        finalContent = `[تعليمات النظام: ${options.systemPrompt}]\n\n${finalContent}`;
    }
    
    let cookie = options.cookie;
    let conversationId = options.conversationId || crypto.randomUUID();
    let visitorId = crypto.randomBytes(16).toString('hex');
    
    if (!cookie) {
        const session = await createAnonymousSession();
        if (!session.status) {
            return { status: false, error: 'فشل إنشاء جلسة' };
        }
        cookie = session.cookie;
    }
    
    const chatUrl = `${BASE_URL.replace(/\/$/, '')}/api/v2/chat/anonymous`;
    const payload = { content: finalContent, model, visitorId, conversationId };
    
    const requestOpts = {
        headers: {
            "Content-Type": "application/json",
            "Accept": stream ? "text/event-stream, */*" : "application/json",
            "Cookie": cookie
        }
    };
    
    if (stream) {
        requestOpts.responseType = 'stream';
    }
    
    const config = getRequestConfig(requestOpts);
    
    try {
        const response = await axios.post(chatUrl, payload, config);
        return {
            status: true,
            data: response.data,
            cookie,
            conversationId
        };
    } catch (error) {
        if (error.response && error.response.status === 429) {
            const newSession = await createAnonymousSession();
            if (!newSession.status) {
                return { status: false, error: 'فشل تجديد الجلسة' };
            }
            
            payload.visitorId = crypto.randomBytes(16).toString('hex');
            payload.conversationId = crypto.randomUUID();
            
            const retryOpts = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": stream ? "text/event-stream, */*" : "application/json",
                    "Cookie": newSession.cookie
                }
            };
            if (stream) retryOpts.responseType = 'stream';
            
            const retryConfig = getRequestConfig(retryOpts);
            const response = await axios.post(chatUrl, payload, retryConfig);
            
            return {
                status: true,
                data: response.data,
                cookie: newSession.cookie,
                conversationId: payload.conversationId,
                rotated: true
            };
        }
        
        return {
            status: false,
            error: error.message,
            code: error.response?.status
        };
    }
}

export {
    setProxy,
    setBaseUrl,
    getModels,
    createAnonymousSession,
    chat
};