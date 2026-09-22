import { fakeCardImage, loadCardAvatar } from '../../src/lib/maro-fake-card.js'

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'مكالمة',
    alias: ['fakecall'],
    category: 'canvas',
    description: 'إنشاء بطاقة مكالمة تجريبية',
    usage: '.مكالمة <اسم> | <مدة>',
    example: '.مكالمة محمد | 19.00',
    isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
    cooldown: 10, energi: 1, isEnabled: true
}

// ═══════════════════════════════════════════════
// 📞 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    const text = m.text
    
    if (!text || !text.includes('|')) {
        return m.reply(`📞 *مكالمة تجريبية*\n\n📌 مثال: \`${m.prefix}مكالمة محمد | 19.00\``)
    }
    
    const [nama, durasi] = text.split('|').map(s => s.trim())
    if (!nama) return m.reply(`❌ الاسم مطلوب!`)
    
    await m.react('⏳')
    
    try {
        const avatarBuffer = await loadCardAvatar(m, sock)
        await sock.sendMessage(m.chat, {
            image: await fakeCardImage({ title: 'CALL', name: nama, subtitle: `المدة: ${durasi} • تصميم ترفيهي`, primary: '#123147', secondary: '#38bdf8', avatarBuffer }),
            caption: 'بطاقة مكالمة تجريبية غير رسمية',
        }, { quoted: m })
        m.react('📞')
        
    } catch (err) {
        m.react('❌')
        console.error('Fake Call Error:', err)
    }
}

export { pluginConfig as config, handler }
