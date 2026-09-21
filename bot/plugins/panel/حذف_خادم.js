// حذف خادم - أمر لحذف خادم من اللوحة (v1-v5)

import axios from 'axios'
import config from '../../config.js'
import { hasFullAccess, getUserRole, VALID_SERVERS } from '../../src/lib/maro-roles-cpanel.js'
import te from '../../src/lib/maro-error.js'

const allCommands = VALID_SERVERS.map(v => `delserver${v}`)
const allAliases = VALID_SERVERS.map(v => `hapusserver${v}`)

const pluginConfig = {
    name: allCommands,
    alias: allAliases,
    category: 'panel',
    description: 'حذف خادم من اللوحة (v1-v5)',
    usage: '.delserverv1 معرف_الخادم',
    example: '.delserverv2 5',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

function parseServerVersion(cmd) {
    const match = cmd.match(/v([1-5])$/i)
    if (!match) return { server: 'v1', serverKey: 's1' }
    return { server: 'v' + match[1], serverKey: 's' + match[1] }
}

function getServerConfig(pteroConfig, serverKey) {
    const serverConfigs = {
        's1': pteroConfig.server1,
        's2': pteroConfig.server2,
        's3': pteroConfig.server3,
        's4': pteroConfig.server4,
        's5': pteroConfig.server5
    }
    return serverConfigs[serverKey] || null
}

function validateConfig(serverConfig) {
    const missing = []
    if (!serverConfig?.domain) missing.push('النطاق')
    if (!serverConfig?.apikey) missing.push('مفتاح API (PTLA)')
    return missing
}

function getAvailableServers(pteroConfig) {
    const available = []
    for (let i = 1; i <= 5; i++) {
        const cfg = pteroConfig[`server${i}`]
        if (cfg?.domain && cfg?.apikey) available.push(`v${i}`)
    }
    return available
}

async function handler(m, { sock }) {
    const pteroConfig = config.pterodactyl
    
    const { server: serverVersion, serverKey } = parseServerVersion(m.command)
    const serverLabel = serverVersion.toUpperCase()
    
    if (!hasFullAccess(m.sender, serverVersion, m.isOwner)) {
        const userRole = getUserRole(m.sender, serverVersion)
        return m.reply(
            `❌ *تم رفض الوصول*\n\n` +
            `> ليس لديك صلاحية للوصول إلى *${serverLabel}*\n` +
            `> دورك: *${userRole || 'لا يوجد'}*`
        )
    }
    
    const serverId = m.text?.trim()
    
    const serverConfig = getServerConfig(pteroConfig, serverKey)
    const missingConfig = validateConfig(serverConfig)
    
    if (missingConfig.length > 0) {
        const available = getAvailableServers(pteroConfig)
        let txt = `⚠️ *الخادم ${serverLabel} غير مهيأ*\n\n`
        if (available.length > 0) {
            txt += `> الخوادم المتاحة: *${available.join(', ')}*\n`
            txt += `> مثال: \`${m.prefix}delserver${available[0]} معرف_الخادم\``
        } else {
            txt += `> قم بتعبئة إعدادات pterodactyl في \`config.js\``
        }
        return m.reply(txt)
    }
    
    if (!serverId || isNaN(serverId)) {
        const available = getAvailableServers(pteroConfig)
        return m.reply(
            `⚠️ *طريقة الاستخدام*\n\n` +
            `> \`${m.prefix}${m.command} معرف_الخادم\`\n\n` +
            `> الخوادم المتاحة: *${available.join(', ') || 'لا يوجد'}*\n` +
            `> عرض المعرف باستخدام \`${m.prefix}listserver${serverVersion}\``
        )
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
        
        await axios.delete(`${serverConfig.domain}/api/application/servers/${serverId}`, {
            headers: {
                'Authorization': `Bearer ${serverConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'Application/vnd.pterodactyl.v1+json'
            }
        })
        
        return m.reply(
            `✅ *تم حذف الخادم*\n\n` +
            `> اللوحة: *${serverLabel}*\n` +
            `> معرف الخادم: \`${serverId}\`\n` +
            `> الاسم: \`${server.name}\``
        )
        
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }