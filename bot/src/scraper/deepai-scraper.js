// ═══════════════════════════════════════════════
// 📁 src/scraper/deepai-scraper.js
// 🖤 DeepAI Scraper - برمجة عكسية كاملة (شات + صور)
// 10 نماذج مدعومة
// ═══════════════════════════════════════════════

import axios from 'axios';
import FormData from 'form-data';

function generateIslandKey(userAgent) {
    let myrandomstr = Math.round((Math.random() * 100000000000)) + "";
    const myhashfunction = (function() {
        const a = [];
        for (let b = 0; 64 > b;)
            a[b] = 0 | 4294967296 * Math.sin(++b % Math.PI);
        return function(input) {
            let d, e, f, g = [d = 1732584193, e = 4023233417, ~d, ~e],
                h = [], l = unescape(encodeURI(input)) + "\u0080", k = l.length;
            let c = --k / 4 + 2 | 15;
            for (h[--c] = 8 * k; ~k;)
                h[k >> 2] |= l.charCodeAt(k) << 8 * k--;
            for (let b = 0, l = 0; b < c; b += 16) {
                for (k = g; 64 > l; k = [f = k[3], d + ((f = k[0] + [d & e | ~d & f, f & d | ~f & e, d ^ e ^ f, e ^ (d | ~f)][k = l >> 4] + a[l] + ~~h[b | [l, 5 * l + 1, 3 * l + 5, 7 * l][k] & 15]) << (k = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21][4 * k + l++ % 4]) | f >>> -k), d, e]) d = k[1] | 0, e = k[2];
                for (l = 4; l;)
                    g[--l] += k[l];
            }
            let result = "";
            for (let l = 0; 32 > l;)
                result += (g[l >> 3] >> 4 * (1 ^ l++) & 15).toString(16);
            return result.split("").reverse().join("");
        };
    })();
    return 'tryit-' + myrandomstr + '-' + myhashfunction(userAgent + myhashfunction(userAgent + myhashfunction(userAgent + myrandomstr + 'hackers_become_a_little_stinkier_every_time_they_hack')));
}

const MODELS = [
    { id: 'standard', name: 'Standard', provider: 'DeepAI', vision: false },
    { id: 'deepseek-v3.2', name: 'DeepSeek V3.2', provider: 'DeepSeek', vision: false },
    { id: 'gpt-oss-120b', name: 'GPT OSS 120B', provider: 'OpenSource', vision: false },
    { id: 'llama-4-scout', name: 'Llama 4 Scout', provider: 'Meta', vision: true },
    { id: 'llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: 'Meta', vision: false },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', provider: 'Meta', vision: false },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash', provider: 'Google', vision: true },
    { id: 'gemma-4', name: 'Gemma 4', provider: 'Google', vision: true },
    { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', provider: 'OpenAI', vision: false },
    { id: 'gpt-5-nano', name: 'GPT-5 Nano', provider: 'OpenAI', vision: true }
];

const MODEL_IDS = MODELS.map(m => m.id);

async function generateImage(promptText, style = 'hd') {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
    const apiKey = generateIslandKey(userAgent);
    const form = new FormData();
    form.append('text', promptText);
    form.append('width', '640');
    form.append('height', '640');
    form.append('image_generator_version', style);
    form.append('use_new_model', 'false');
    form.append('use_old_model', 'false');
    form.append('quality', 'true');
    form.append('generation_source', 'img');

    try {
        const response = await axios.post('https://api.deepai.org/api/text2img', form, {
            headers: {
                ...form.getHeaders(),
                'api-key': apiKey,
                'User-Agent': userAgent,
                'Origin': 'https://deepai.org',
                'Referer': 'https://deepai.org/machine-learning-model/text2img'
            },
            timeout: 60000
        });

        return {
            status: true,
            url: response.data.output_url,
            prompt: promptText,
            style: style
        };
    } catch (error) {
        return {
            status: false,
            error: error.message,
            prompt: promptText
        };
    }
}

async function generateChat(messages, model = 'standard') {
    if (!MODEL_IDS.includes(model)) {
        model = 'standard';
    }

    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
    const apiKey = generateIslandKey(userAgent);
    const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });

    const form = new FormData();
    form.append('chat_style', 'chat');
    form.append('chatHistory', JSON.stringify(messages));
    form.append('model', model);
    form.append('session_uuid', uuid());
    form.append('sensitivity_request_id', uuid());
    form.append('hacker_is_stinky', 'very_stinky');

    try {
        const response = await axios.post('https://api.deepai.org/hacking_is_a_serious_crime', form, {
            headers: {
                ...form.getHeaders(),
                'api-key': apiKey,
                'User-Agent': userAgent,
                'Origin': 'https://deepai.org',
                'Referer': 'https://deepai.org/chat'
            },
            timeout: 30000
        });

        return {
            status: true,
            answer: response.data,
            model: model
        };
    } catch (error) {
        return {
            status: false,
            error: error.message,
            model: model
        };
    }
}

function getModelInfo(modelId) {
    return MODELS.find(m => m.id === modelId) || MODELS[0];
}

export { generateImage, generateChat, generateIslandKey, MODELS, MODEL_IDS, getModelInfo };