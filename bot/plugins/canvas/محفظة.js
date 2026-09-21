import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas'
import te from '../../src/lib/maro-error.js'

// ═══════════════════════════════════════════════
// 🛠️ تحميل الخط
// ═══════════════════════════════════════════════
const fontPath = process.cwd() + '/assets/fonts/Epep.ttf'
try { GlobalFonts.registerFromPath(fontPath, 'CartoonVibes') } catch {}

// ═══════════════════════════════════════════════
// 🎨 توليد الصورة
// ═══════════════════════════════════════════════
async function generate(angka) {
  const bgUrl = 'https://raw.githubusercontent.com/uploader762/dat3/main/uploads/9c18e0-1772932032348.jpg'
  const logoUrl = 'https://raw.githubusercontent.com/uploader762/dat3/main/uploads/d0f081-1772929197100.png'

  const bgRes = await fetch(bgUrl)
  const logoRes = await fetch(logoUrl)
  
  const bg = await loadImage(Buffer.from(await bgRes.arrayBuffer()))
  const logo = await loadImage(Buffer.from(await logoRes.arrayBuffer()))

  const canvas = createCanvas(bg.width, bg.height)
  const ctx = canvas.getContext('2d')

  ctx.drawImage(bg, 0, 0)

  ctx.font = '205px CartoonVibes'
  ctx.fillStyle = 'white'
  ctx.textBaseline = 'top'

  const x = 664
  const y = 293

  ctx.fillText(angka, x, y)

  const textWidth = ctx.measureText(angka).width
  const logoSize = 370
  const logoX = x + textWidth + 11
  const logoY = y - 31

  ctx.drawImage(logo, logoX, logoY, logoSize, logoSize)

  return canvas.toBuffer('image/png')
}

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'محفظة',
    alias: ['fakedana'],
    category: 'canvas',
    description: 'إنشاء صورة محفظة وهمية',
    usage: '.محفظة <مبلغ>',
    example: '.محفظة 1000000',
    isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
    cooldown: 10, energi: 1, isEnabled: true
}

// ═══════════════════════════════════════════════
// 💰 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    const nominal = m.text
    if (!nominal) {
        return m.reply(`💰 *محفظة*\n\n📌 مثال: \`${m.prefix}محفظة 1000000\``)
    }
    if (isNaN(nominal)) return m.reply(`❌ الرجاء إدخال رقم`)
    
    m.react('⏳')
    
    try {
        const saldo = Number(nominal.replace(/[^0-9]/g, '')).toLocaleString('ar-EG')
        const fake = await generate(saldo)
        await sock.sendMedia(m.chat, fake, null, m, { type: 'image' })
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }