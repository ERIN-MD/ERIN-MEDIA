// ═══════════════════════════════════════════════
// 📁 src/scraper/mconverter.js
// 🔄 MConverter - تحويل الملفات بين الصيغ
// ═══════════════════════════════════════════════

import axios from 'axios'
import { wrapper } from 'axios-cookiejar-support'
import { CookieJar } from 'tough-cookie'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'
import mime from 'mime-types'

const jar = new CookieJar();
const client = wrapper(axios.create({
    jar,
    withCredentials: true,
    timeout: 60000
}));

const CONFIG = {
    BASE_URL: "https://mconverter.eu",
    API: {
        HOME: "https://mconverter.eu/",
        UPLOAD: "/cf_nocache/ajax/upload.php",
        PROGRESS: "/cf_nocache/ajax/check_progress.php",
        GET_TARGETS: "/cf_nocache/ajax/get_targets.php",
        DOWNLOAD: "/cf_nocache/ajax/download.php"
    },
    HEADERS: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Origin": "https://mconverter.eu",
        "Referer": "https://mconverter.eu/",
        "X-Requested-With": "XMLHttpRequest"
    },
    SUPPORTED_SOURCES: [
        "3g2","3gp","7z","aac","ac3","ai","aif","aiff","amv","apk","arw","avi","avif",
        "bmp","bz2","cab","cbr","cbz","csv","dng","doc","docx","epub","flac","flv",
        "gif","gz","heic","htm","html","ico","iso","jar","jpeg","jpg","json",
        "m4a","md","mid","mkv","mobi","mov","mp3","mp4","mpeg","mpg",
        "odp","ods","odt","ogg","opus","pdf","png","ppt","pptx","psd",
        "rar","rtf","svg","tar","tif","tiff","txt","wav","webm","webp","wma","wmv",
        "xls","xlsx","xz","zip"
    ]
};

let sessionInitialized = false;

const initSession = async () => {
    if (sessionInitialized) return;
    try {
        await client.get(CONFIG.API.HOME, {
            headers: {
                ...CONFIG.HEADERS,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Sec-Fetch-Mode": "navigate",
                "X-Requested-With": undefined
            }
        });
        sessionInitialized = true;
    } catch (e) {}
};

const mconverter = {

    getAvailableTargets: async (filename) => {
        await initSession();
        const ext = filename.split('.').pop().toLowerCase();

        const form = new FormData();
        form.append('extensions', ext);

        try {
            const res = await client.post(CONFIG.BASE_URL + CONFIG.API.GET_TARGETS, form, {
                headers: { ...CONFIG.HEADERS, ...form.getHeaders() }
            });

            const allTargets = [];

            const extractTargets = (obj) => {
                if (Array.isArray(obj)) {
                    obj.forEach(item => extractTargets(item));
                } else if (typeof obj === 'object' && obj !== null) {
                    if (obj.name && obj.mime) {
                        allTargets.push(obj);
                    }
                    Object.values(obj).forEach(val => extractTargets(val));
                }
            };

            if (res.data && res.data.formats) {
                extractTargets(res.data.formats);
            }

            const uniqueTargets = [...new Map(allTargets.map(item => [item.name, item])).values()];
            return {
                status: true,
                source: ext,
                targets: uniqueTargets.sort((a, b) => a.name.localeCompare(b.name))
            };

        } catch (e) {
            return { status: false, error: e.message };
        }
    },

    convert: async (inputPath, targetFormat, options = {}) => {
        await initSession();

        if (!fs.existsSync(inputPath)) {
            return { status: false, error: 'الملف غير موجود' };
        }

        const filename = path.basename(inputPath);
        const fileSize = fs.statSync(inputPath).size;

        // فحص حجم الملف
        const maxSize = options.maxSize || 200 * 1024 * 1024; // 200MB
        if (fileSize > maxSize) {
            return { status: false, error: `حجم الملف كبير جداً (${(fileSize / 1024 / 1024).toFixed(1)}MB)` };
        }

        const mimeType = mime.lookup(inputPath) || 'application/octet-stream';

        try {
            const chunk0 = fs.createReadStream(inputPath, { start: 0, end: 0 });

            const paramsInit = new URLSearchParams({
                target_format: targetFormat,
                total_size: fileSize,
                source_mime: mimeType,
                filename: filename,
                abd: 'false',
                captcha: ''
            });

            const formInit = new FormData();
            formInit.append('file', chunk0);

            const resInit = await client.post(
                `${CONFIG.BASE_URL}${CONFIG.API.UPLOAD}?${paramsInit.toString()}`,
                formInit,
                { headers: { ...CONFIG.HEADERS, ...formInit.getHeaders() } }
            );

            if (resInit.data.error) throw new Error(resInit.data.error.message);
            const token = resInit.data.token;
            if (!token) throw new Error("فشل الحصول على رمز الرفع");

            let startByte = 1;
            const CHUNK_SIZE = 10 * 1024 * 1024;

            while (startByte < fileSize) {
                let endByte = Math.min(startByte + CHUNK_SIZE, fileSize);
                const chunk = fs.createReadStream(inputPath, { start: startByte, end: endByte - 1 });

                const params = new URLSearchParams({ token, start_byte: startByte });
                const form = new FormData();
                form.append('file', chunk);

                const resChunk = await client.post(
                    `${CONFIG.BASE_URL}${CONFIG.API.UPLOAD}?${params.toString()}`,
                    form,
                    {
                        headers: { ...CONFIG.HEADERS, ...form.getHeaders() },
                        maxContentLength: Infinity,
                        maxBodyLength: Infinity
                    }
                );

                if (resChunk.data.error) throw new Error(resChunk.data.error.message);
                if (!resChunk.data.awaiting_chunks) break;

                startByte = endByte;
            }

            let status = 'processing';
            let attempts = 0;
            const maxAttempts = options.maxAttempts || 100;

            while (status !== 'finished' && attempts < maxAttempts) {
                attempts++;
                await new Promise(r => setTimeout(r, 2000));

                const resPoll = await client.get(
                    `${CONFIG.BASE_URL}${CONFIG.API.PROGRESS}?token=${token}`,
                    { headers: CONFIG.HEADERS }
                );

                const data = resPoll.data;
                status = data.conversion_data?.status;

                if (status === 'error') {
                    throw new Error(data.error_data?.error_reason || 'خطأ غير معروف');
                }

                if (status === 'finished') {
                    const dlParams = new URLSearchParams({
                        token: token,
                        file_idx: 1,
                        no_idx_in_name: 1,
                        orig_names: 'checked'
                    });

                    const downloadUrl = `${CONFIG.BASE_URL}${CONFIG.API.DOWNLOAD}?${dlParams.toString()}`;
                    return {
                        status: true,
                        url: downloadUrl,
                        source: filename,
                        target: targetFormat,
                    };
                }
            }

            return { status: false, error: 'انتهت مهلة التحويل' };

        } catch (e) {
            return { status: false, error: e.message };
        }
    }
};

export { mconverter }