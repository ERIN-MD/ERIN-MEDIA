import axios from 'axios'

const pluginConfig = {
    name: 'طريق',
    alias: ['osrm', 'route', 'مسافة', 'طريق'],
    category: 'tools',
    description: 'حساب المسافة والطريق بين نقطتين',
    usage: '.طريق lat1,lng1 lat2,lng2',
    example: '.طريق -31.64,-60.71 -31.63,-60.70',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock, text }) {
    if (!text) return m.reply(`🗺️ *OSRM Router*\n\n${m.prefix}طريق lat1,lng1 lat2,lng2\n\nمثال:\n${m.prefix}طريق -31.64,-60.71 -31.63,-60.70`)
    
    const parts = text.trim().split(/\s+/)
    if (parts.length < 2) return m.reply('❌ أدخل إحداثيات نقطتين')
    
    const [lat1, lng1] = parts[0].split(',')
    const [lat2, lng2] = parts[1].split(',')
    
    if (!lat1 || !lng1 || !lat2 || !lng2) return m.reply('❌ صيغة خاطئة. مثال: .طريق -31.64,-60.71 -31.63,-60.70')
    
    await m.react('🗺️')
    
    try {
        const res = await axios.get(`https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}`, {
            params: { overview: 'full', alternatives: false, steps: true },
            timeout: 15000
        })
        
        if (res.data.code !== 'Ok') return m.reply('❌ فشل حساب المسار')
        
        const route = res.data.routes[0]
        const distance = (route.distance / 1000).toFixed(2)
        const duration = Math.round(route.duration / 60)
        
        let txt = `🗺️ *مسار الطريق*\n\n`
        txt += `📏 *المسافة:* ${distance} كم\n`
        txt += `⏱️ *الوقت:* ${duration} دقيقة\n`
        txt += `📍 *من:* ${lat1}, ${lng1}\n`
        txt += `📍 *إلى:* ${lat2}, ${lng2}\n`
        txt += `🛣️ *عدد المنعطفات:* ${route.legs[0].steps.length}\n`
        txt += `\n🔗 *الخريطة:*\nhttps://www.openstreetmap.org/directions?from=${lat1}%2C${lng1}&to=${lat2}%2C${lng2}`
        
        await m.reply(txt)
        m.react('✅')
    } catch (e) {
        m.react('❌')
        await m.reply(`❌ خطأ: ${e.message}`)
    }
}

export { pluginConfig as config, handler }