// حذف اللوحة - أمر لحذف اللوحة (الخادم + المستخدم)

import axios from 'axios'
import config from '../../config.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'حذف_اللوحة',
    alias: ['delpanel'],
    category: 'panel',
    description: 'حذف اللوحة (الخادم + المستخدم)',
    usage: '.حذف_اللوحة [s1/s2/s3] معرف_الخادم [كامل]',
    example: '.حذف_اللوحة 5 أو .حذف_اللوحة s2 5 كامل',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

function getServerConfig(pteroConfig, serverKey) {
    const serverConfigs = {
        's1': pteroConfig.server1,
        's2': pteroConfig.server2,
        's3': pteroConfig.server3
    }
    return serverConfigs[serverKey] || pteroConfig.server1
}

function validateServerConfig(serverConfig) {
    const missing = []
    if (!serverConfig?.domain) missing.push('النطاق')
    if (!serverConfig?.apikey) missing.push('مفتاح API (PTLA)')
    return missing
}

function getAvailableServers(pteroConfig) {
    const available = []
    if (pteroConfig.server1?.domain && pteroConfig.server1?.apikey) available.push('s1')
    if (pteroConfig.server2?.domain && pteroConfig.server2?.apikey) available.push('s2')
    if (pteroConfig.server3?.domain && pteroConfig.server3?.apikey) available.push('s3')
    return available
}

async function handler(m, { sock }) {
    const pteroConfig = config.pterodactyl
    
    const args = m.text?.trim().split(' ') || []
    let serverKey = 's1'
    let restArgs = args
    
    if (args[0] && ['s1', 's2', 's3'].includes(args[0].toLowerCase())) {
        serverKey = args[0].toLowerCase()
        restArgs = args.slice(1)
    }
    
    const serverConfig = getServerConfig(pteroConfig, serverKey)
    const missingConfig = validateServerConfig(serverConfig)
    
    if (missingConfig.length > 0) {
        const available = getAvailableServers(pteroConfig)
        let txt = `⚠️ *الخادم ${serverKey.toUpperCase()} غير مهيأ*\n\n`
        if (available.length > 0) {
            txt += `> الخوادم المتاحة: *${available.join(', ')}*`
        }
        return m.reply(txt)
    }
    
    const serverId = restArgs[0]
    const option = restArgs[1]?.toLowerCase()
    const serverLabel = serverKey.toUpperCase()
    
    if (!serverId) {
        return m.reply(
            `⚠️ *طريقة الاستخدام*\n\n` +
            `> \`${m.prefix}حذف_اللوحة المعرف\` - حذف الخادم فقط\n` +
            `> \`${m.prefix}حذف_اللوحة المعرف كامل\` - حذف الخادم + المستخدم\n` +
            `> \`${m.prefix}حذف_اللوحة s2 المعرف\` - من الخادم 2\n\n` +
            `> عرض المعرف باستخدام \`${m.prefix}قائمة_الخوادم\``
        )
    }
    
    if (isNaN(serverId)) {
        return m.reply(`❌ معرف الخادم يجب أن يكون رقماً.`)
    }
    
    try {
        const serverRes = await axios.get(`${serverConfig.domain}/api/application/servers/${serverId}`, {
            headers: {
                'Authorization': `Bearer ${serverConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'Application/vnd.pterodactyl.v1+json'
            }
        })
        
        const server = serverRes.data.attributes
        const userId = server.user
        
        let userInfo = null
        let isUserAdmin = false
        try {
            const userRes = await axios.get(`${serverConfig.domain}/api/application/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${serverConfig.apikey}` }
            })
            userInfo = userRes.data.attributes
            isUserAdmin = userInfo.root_admin
        } catch (e) {}
        
        await m.reply(`🗑️ *جاري حذف اللوحة...*\n\n> الخادم: *${serverLabel}*\n> اللوحة: \`${server.name}\`\n> الوضع: *${option === 'full' || option === 'كامل' ? 'خادم + مستخدم' : 'خادم فقط'}*`)
        
        await axios.delete(`${serverConfig.domain}/api/application/servers/${serverId}`, {
            headers: {
                'Authorization': `Bearer ${serverConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'Application/vnd.pterodactyl.v1+json'
            }
        })
        
        let result = `✅ *تم حذف الخادم [${serverLabel}]*\n\n`
        result += `> الاسم: \`${server.name}\`\n`
        result += `> المعرف: \`${serverId}\`\n`
        
        if ((option === 'full' || option === 'كامل') && userInfo && !isUserAdmin) {
            try {
                await axios.delete(`${serverConfig.domain}/api/application/users/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${serverConfig.apikey}`,
                        'Content-Type': 'application/json',
                        'Accept': 'Application/vnd.pterodactyl.v1+json'
                    }
                })
                result += `\n✅ *تم حذف المستخدم*\n`
                result += `> اسم المستخدم: \`${userInfo.username}\`\n`
                result += `> المعرف: \`${userId}\``
            } catch (userErr) {
                result += `\n⚠️ فشل حذف المستخدم (ربما لا يزال لديه خوادم أخرى)`
            }
        } else if ((option === 'full' || option === 'كامل') && isUserAdmin) {
            result += `\n⚠️ المستخدم هو مدير، لم يتم حذفه`
        }
        
        return m.reply(result)
        
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }