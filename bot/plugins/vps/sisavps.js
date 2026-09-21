import axios from 'axios'
import config from '../../config.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: "sisavps",
    alias: ["vpsquota"],
    category: 'vps',
    description: 'التحقق من الحصة المتبقية من VPS',
    usage: '.sisavps',
    example: '.sisavps',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

function hasAccess(sender, isOwner) {
    if (isOwner) return true
    const cleanSender = sender?.split('@')[0]
    if (!cleanSender) return false
    const doConfig = config.digitalocean || {}
    return (doConfig.sellers || []).includes(cleanSender) || 
           (doConfig.ownerPanels || []).includes(cleanSender)
}

async function handler(m, { sock }) {
    const token = config.digitalocean?.token
    
    if (!token) {
        return m.reply(`⚠️ *لم يتم إعداد DigitalOcean*`)
    }
    
    if (!hasAccess(m.sender, m.isOwner)) {
        return m.reply(`❌ *تم رفض الوصول*`)
    }
    
    try {
        const [accountRes, dropletsRes] = await Promise.all([
            axios.get('https://api.digitalocean.com/v2/account', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            axios.get('https://api.digitalocean.com/v2/droplets', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ])
        
        const account = accountRes.data.account
        const droplets = dropletsRes.data.droplets || []
        const dropletLimit = account.droplet_limit
        const dropletsUsed = droplets.length
        const dropletsRemaining = dropletLimit - dropletsUsed
        
        let txt = `📊 *حصة DigitalOcean*\n\n`
        txt += `╭─────────────\n`
        txt += `┃ 📦 الحد الأقصى: *${dropletLimit}* دروبليت\n`
        txt += `┃ ✅ المستخدم: *${dropletsUsed}* دروبليت\n`
        txt += `┃ 📋 المتبقي: *${dropletsRemaining}* دروبليت\n`
        txt += `╰─────────────\n\n`
        txt += `> 👤 البريد الإلكتروني: ${account.email}\n`
        txt += `> ✅ الحالة: ${account.status}`
        
        await m.reply(txt)
        
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }