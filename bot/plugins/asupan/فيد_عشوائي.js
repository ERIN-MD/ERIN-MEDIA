import fs from 'fs'
import path from 'path'

// ═══════════════════════════════════════════════
// 🛠️ تحميل البيانات
// ═══════════════════════════════════════════════
function loadJsonData(filename) {
    try {
        const filePath = path.join(process.cwd(), 'src', 'tiktok', filename)
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        }
    } catch {}
    return []
}

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'فيد_عشوائي',
    alias: ['bocil'],
    category: 'asupan',
    description: 'فيديو عشوائي',
    usage: '.فيد_عشوائي',
    example: '.فيد_عشوائي',
    isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
    cooldown: 10, energi: 1, isEnabled: true
}

// ═══════════════════════════════════════════════
// 🎬 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    m.react('⏳')
    
    try {
        const data = loadJsonData('bocil.json')
        
        if (data.length === 0) {
            m.react('❌')
            return m.reply(`❌ لا تتوفر فيديوهات`)
        }
        
        const item = data[Math.floor(Math.random() * data.length)]
        
        await sock.sendMedia(m.chat, item.url, null, m, { type: 'video' })
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ الفيديو غير متوفر`)
    }
}

export { pluginConfig as config, handler }