import axios from 'axios'
import config from '../../config.js'
import te from '../../src/lib/maro-error.js'

const VPS_SPECS = {
    'vps1g1c': { size: 's-1vcpu-1gb', ram: '1GB', cpu: '1 vCPU' },
    'vps2g1c': { size: 's-1vcpu-2gb', ram: '2GB', cpu: '1 vCPU' },
    'vps2g2c': { size: 's-2vcpu-2gb', ram: '2GB', cpu: '2 vCPU' },
    'vps4g2c': { size: 's-2vcpu-4gb', ram: '4GB', cpu: '2 vCPU' },
    'vps8g4c': { size: 's-4vcpu-8gb', ram: '8GB', cpu: '4 vCPU' }
}

const vpsCommands = Object.keys(VPS_SPECS)

const pluginConfig = {
    name: vpsCommands,
    alias: [],
    category: 'vps',
    description: 'إنشاء VPS على DigitalOcean',
    usage: '.vps1g1c <اسم_المضيف>',
    example: '.vps1g1c myserver',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 0,
    isEnabled: true
}

function generatePassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%'
    let password = ''
    for (let i = 0; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)]
    }
    return password
}

function hasAccess(sender, isOwner) {
    if (isOwner) return true
    const cleanSender = sender?.split('@')[0]
    if (!cleanSender) return false
    const doConfig = config.digitalocean || {}
    const sellers = doConfig.sellers || []
    const ownerPanels = doConfig.ownerPanels || []
    return sellers.includes(cleanSender) || ownerPanels.includes(cleanSender)
}

async function handler(m, { sock }) {
    const doConfig = config.digitalocean || {}
    const token = doConfig.token
    
    if (!token) {
        return m.reply(`⚠️ *لم يتم إعداد DigitalOcean*\n\n> أضف \`digitalocean.token\` في config.js`)
    }
    
    if (!hasAccess(m.sender, m.isOwner)) {
        return m.reply(`❌ *تم رفض الوصول*\n\n> هذه الميزة للمالك أو البائعين فقط.`)
    }
    
    const hostname = m.text?.trim()
    if (!hostname) {
        return m.reply(
            `⚠️ *طريقة الاستخدام*\n\n` +
            `> \`${m.prefix}${m.command} <اسم_المضيف>\`\n\n` +
            `> مثال: \`${m.prefix}${m.command} myserver\`\n\n` +
            `📦 *الباقات المتوفرة:*\n` +
            Object.entries(VPS_SPECS).map(([cmd, spec]) => 
                `> \`${m.prefix}${cmd}\` - ${spec.ram} رام, ${spec.cpu}`
            ).join('\n')
        )
    }
    
    if (!/^[a-zA-Z0-9-]+$/.test(hostname)) {
        return m.reply(`❌ اسم المضيف يجب أن يحتوي على أحرف وأرقام وشرطات فقط.`)
    }
    
    const spec = VPS_SPECS[m.command]
    if (!spec) {
        return m.reply(`❌ باقة VPS غير موجودة.`)
    }
    
    const password = generatePassword()
    const region = doConfig.region || 'sgp1'
    
    const dropletData = {
        name: hostname,
        region: region,
        size: spec.size,
        image: 'ubuntu-22-04-x64',
        ssh_keys: null,
        backups: false,
        ipv6: true,
        user_data: `#cloud-config
password: ${password}
chpasswd: { expire: False }
ssh_pwauth: True`,
        private_networking: null,
        volumes: null,
        tags: ['maro-bot']
    }
    
    await m.reply(`🛠️ *جاري إنشاء VPS...*\n\n> اسم المضيف: \`${hostname}\`\n> المواصفات: ${spec.ram} رام, ${spec.cpu}\n> المنطقة: ${region}`)
    
    try {
        const response = await axios.post('https://api.digitalocean.com/v2/droplets', dropletData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        
        const droplet = response.data.droplet
        const dropletId = droplet.id
        
        await m.reply(`🕕 *في انتظار تجهيز VPS...*\n\n> المعرف: \`${dropletId}\`\n> الوقت المتوقع: 60 ثانية`)
        
        await new Promise(resolve => setTimeout(resolve, 60000))
        
        const infoRes = await axios.get(`https://api.digitalocean.com/v2/droplets/${dropletId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        
        const dropletInfo = infoRes.data.droplet
        const ipv4 = dropletInfo.networks?.v4?.find(n => n.type === 'public')
        const ip = ipv4?.ip_address || 'غير متوفر'
        
        const detailTxt = `✅ *تم إنشاء VPS بنجاح*\n\n` +
            `╭─「 📋 *تفاصيل VPS* 」\n` +
            `┃ 🆔 \`المعرف\`: *${dropletId}*\n` +
            `┃ 🏷️ \`اسم المضيف\`: *${hostname}*\n` +
            `┃ 🌐 \`IP\`: *${ip}*\n` +
            `┃ 👤 \`المستخدم\`: *root*\n` +
            `┃ 🔐 \`كلمة المرور\`: *${password}*\n` +
            `╰───────────────\n\n` +
            `╭─「 🧠 *المواصفات* 」\n` +
            `┃ 💾 \`الرام\`: *${spec.ram}*\n` +
            `┃ ⚡ \`المعالج\`: *${spec.cpu}*\n` +
            `┃ 🌍 \`المنطقة\`: *${region}*\n` +
            `┃ 💿 \`نظام التشغيل\`: *Ubuntu 22.04*\n` +
            `╰───────────────\n\n` +
            `> ⚠️ احتفظ بهذه البيانات بشكل آمن!`
        
        await sock.sendMessage(m.sender, { text: detailTxt })
        await m.reply(`✅ *تم إنشاء VPS بنجاح*\n\n> تم إرسال البيانات إلى المحادثة الخاصة.`)
        
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }