import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { f } from '../../src/lib/maro-http.js'

// ═══════════════════════════════════════════════
// 🛠️ تحميل البيانات
// ═══════════════════════════════════════════════
function loadJsonData() {
    const tiktokDir = path.join(process.cwd(), 'src', 'tiktok')
    const files = ['bocil.json', 'gheayubi.json', 'kayes.json', 'notnot.json', 'panrika.json', 'santuy.json', 'tiktokgirl.json', 'ukhty.json']
    let allUrls = []
    
    for (const file of files) {
        try {
            const filePath = path.join(tiktokDir, file)
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
                allUrls = allUrls.concat(data.map(d => d.url))
            }
        } catch {}
    }
    
    return allUrls
}

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'فيديو_عشوائي',
    alias: ['asupan'],
    category: 'asupan',
    description: 'فيديو عشوائي',
    usage: '.فيديو_عشوائي',
    example: '.فيديو_عشوائي',
    isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
    cooldown: 10, energi: 1, isEnabled: true
}

// ═══════════════════════════════════════════════
// 🎬 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    m.react('⏳')
    
    try {
        const urls = loadJsonData()
        
        if (urls.length === 0) {
            m.react('❌')
            return m.reply(`❌ لا تتوفر فيديوهات حالياً`)
        }
        
        const url = urls[Math.floor(Math.random() * urls.length)]
        const res = await f(url, 'arrayBuffer')
        
        m.react('✅')
        await sock.sendMedia(m.chat, Buffer.from(res), null, m, { type: 'video' })
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ الفيديو غير متوفر`)
    }
}

export { pluginConfig as config, handler }