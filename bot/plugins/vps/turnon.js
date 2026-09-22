import axios from 'axios'
import config from '../../config.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: "turnon",
    alias: ["turnoff", "restartvps"],
    category: 'vps',
    description: 'التحكم في VPS (تشغيل/إيقاف/إعادة تشغيل)',
    usage: '.turnon <id>',
    example: '.turnon 123456789',
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
    
    const dropletId = m.text?.trim()
    if (!dropletId) {
        return m.reply(`⚠️ *طريقة الاستخدام*\n\n> \`${m.prefix}${m.command} <معرف_الدروبليت>\``)
    }
    
    const actions = {
        'turnon': { type: 'power_on', emoji: '🟢', text: 'التشغيل' },
        'turnoff': { type: 'power_off', emoji: '🔴', text: 'الإيقاف' },
        'restartvps': { type: 'reboot', emoji: '🔄', text: 'إعادة التشغيل' },
        'rebootvps': { type: 'reboot', emoji: '🔄', text: 'إعادة التشغيل' }
    }
    
    const action = actions[m.command]
    if (!action) {
        return m.reply(`❌ الإجراء غير معروف.`)
    }
    
    await m.reply(`${action.emoji} *جاري ${action.text} VPS...*\n\n> المعرف: \`${dropletId}\``)
    
    try {
        const response = await axios.post(
            `https://api.digitalocean.com/v2/droplets/${dropletId}/actions`,
            { type: action.type },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            }
        )
        
        const actionResult = response.data.action
        
        m.react('✅')
        await m.reply(`✅ *تم الإجراء بنجاح*\n\n> ${action.emoji} جاري ${action.text} VPS\n> الحالة: ${actionResult.status}`)
        
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }