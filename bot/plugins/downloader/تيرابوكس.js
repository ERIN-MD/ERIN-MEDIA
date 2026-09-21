import axios from 'axios'
import fs from 'fs'
import path from 'path'

const pluginConfig = {
    name: 'تيرابوكس',
    alias: ['terabox', 'tera', 'تيرا'],
    category: 'downloader',
    description: 'تحميل فيديوهات وملفات Terabox',
    usage: '.تيرابوكس <رابط>',
    example: '.تيرابوكس https://1024terabox.com/s/1k2Qxwebz3yI09kubXBf2xA',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 2,
    isEnabled: true
}

function generateFingerprint() {
    const cpuList = [4, 8, 12, 16]
    const ramList = [4, 8, 16, 32]
    const rendererList = [
        'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (AMD, AMD Radeon Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'Mali-G57 MC2',
        'Adreno (TM) 610'
    ]
    const isMobile = Math.random() > 0.5

    return {
        cpu: cpuList[Math.floor(Math.random() * cpuList.length)],
        memory: ramList[Math.floor(Math.random() * ramList.length)],
        touch: isMobile ? Math.floor(Math.random() * 5) + 1 : 0,
        platform: isMobile ? 'Linux armv81' : 'Win32',
        lang: 'id-ID',
        vendor: 'Google Inc.',
        webgl_vendor: 'Google Inc. (NVIDIA)',
        webgl_renderer: rendererList[Math.floor(Math.random() * rendererList.length)],
        ua: isMobile
            ? 'Mozilla/5.0 (Linux; Android 13; CPH2565) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
            : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        backup_token: null
    }
}

async function teraboxDL(url) {
    const baseUrl = 'https://flowvideoplayer.com'
    const fingerprint = generateFingerprint()

    try {
        const homeRes = await axios.get(baseUrl, {
            headers: {
                'User-Agent': fingerprint.ua,
                'Accept': 'text/html',
                'Accept-Language': 'id-ID,id;q=0.9',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Dest': 'document'
            },
            timeout: 15000
        })

        const csrfMatch = homeRes.data.match(/csrf-token[^>]+content="([^"]+)"/)
        if (!csrfMatch) return { success: false, message: '❌ فشل جلب CSRF Token' }
        const csrf = csrfMatch[1]
        let cookie = homeRes.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ') || ''

        const initRes = await axios.post(`${baseUrl}/device/init`, fingerprint, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrf,
                'Origin': baseUrl,
                'Referer': `${baseUrl}/`,
                'User-Agent': fingerprint.ua,
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty',
                'Cookie': cookie
            },
            timeout: 15000
        })

        if (!initRes.data?.status) return { success: false, message: '❌ فشل تهيئة الجهاز' }

        const newCookies = initRes.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ') || ''
        cookie = cookie + '; ' + newCookies

        const searchRes = await axios.post(`${baseUrl}/telegram/bot/search/video`, 
            { url },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    'Origin': baseUrl,
                    'Referer': `${baseUrl}/`,
                    'User-Agent': fingerprint.ua,
                    'Sec-Fetch-Site': 'same-origin',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Dest': 'empty',
                    'Cookie': cookie
                },
                timeout: 30000
            }
        )

        if (!searchRes.data?.status || !searchRes.data?.response?.length) {
            return { success: false, message: '❌ لم يتم العثور على الملف' }
        }

        const videoInfo = searchRes.data.response[0]

        const downloadRes = await axios.post(`${baseUrl}/video/download`, 
            { url: videoInfo.download_url },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    'Origin': baseUrl,
                    'Referer': `${baseUrl}/`,
                    'User-Agent': fingerprint.ua,
                    'Sec-Fetch-Site': 'same-origin',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Dest': 'empty',
                    'Cookie': cookie
                },
                timeout: 30000
            }
        )

        if (!downloadRes.data?.status) return { success: false, message: '❌ فشل توليد رابط التحميل' }

        return {
            success: true,
            fileName: videoInfo.file_name,
            fileSize: videoInfo.file_size,
            downloadUrl: downloadRes.data.download_url
        }

    } catch (e) {
        return { success: false, message: '❌ خطأ: ' + e.message }
    }
}

async function handler(m, { sock, text }) {
    if (!text) {
        return m.reply(
            `📦 *Terabox Downloader*\n\n` +
            `> \`${m.prefix}تيرابوكس <رابط>\`\n\n` +
            `> مثال:\n` +
            `> \`${m.prefix}تيرابوكس https://1024terabox.com/s/xxx\``
        )
    }

    const url = text.trim()

    if (!url.match(/terabox\.com|1024terabox\.com|teraboxapp\.com/i)) {
        return m.reply(`❌ الرابط غير صالح. استخدم رابط Terabox.`)
    }

    await m.react('⏳')

    const result = await teraboxDL(url)

    if (!result.success) {
        await m.react('❌')
        return m.reply(result.message)
    }

    try {
        // تحميل الملف مؤقتاً
        const tmpDir = path.join(process.cwd(), 'tmp')
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
        
        const tmpFile = path.join(tmpDir, `terabox_${Date.now()}.mp4`)
        
        const response = await axios.get(result.downloadUrl, { 
            responseType: 'arraybuffer',
            timeout: 120000 
        })
        
        fs.writeFileSync(tmpFile, Buffer.from(response.data))
        
        await m.react('✅')
        
        let caption = `📦 *${result.fileName}*\n📏 *الحجم:* ${result.fileSize}`
        
        await sock.sendMessage(m.chat, { 
            video: fs.readFileSync(tmpFile),
            caption: caption
        }, { quoted: m })
        
        // حذف الملف المؤقت
        fs.unlinkSync(tmpFile)
        
    } catch (e) {
        // إذا فشل التحميل، أرسل الرابط كنص
        await m.react('✅')
        let txt = `📦 *${result.fileName}*\n`
        txt += `📏 *الحجم:* ${result.fileSize}\n\n`
        txt += `🔗 *رابط التحميل:*\n${result.downloadUrl}`
        await m.reply(txt)
    }
}

export { pluginConfig as config, handler }