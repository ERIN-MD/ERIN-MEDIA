// قائمة الخوادم - أمر لعرض جميع الخوادم في اللوحة (v1-v5)

import axios from 'axios'
import config from '../../config.js'
import { isLid, lidToJid } from '../../src/lib/maro-lid.js'
import { hasFullAccess, getUserRole, VALID_SERVERS } from '../../src/lib/maro-roles-cpanel.js'
import te from '../../src/lib/maro-error.js'

const allCommands = [...VALID_SERVERS.map(v => `listserver${v}`), 'listserver']
const allAliases = VALID_SERVERS.map(v => `servers${v}`)

const pluginConfig = {
    name: allCommands,
    alias: allAliases,
    category: 'panel',
    description: 'عرض جميع الخوادم في اللوحة (v1-v5)',
    usage: '.listserverv1 أو .listserverv2',
    example: '.listserverv1',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function parseServerVersion(cmd) {
    const match = String(cmd || '').match(/v([1-5])$/i)
    if (!match) return { server: 'v1', serverKey: 's1' }
    return { server: 'v' + match[1], serverKey: 's' + match[1] }
}

function getServerConfig(pteroConfig, serverKey) {
    if (!pteroConfig) return null
    const serverConfigs = {
        's1': pteroConfig.server1,
        's2': pteroConfig.server2,
        's3': pteroConfig.server3,
        's4': pteroConfig.server4,
        's5': pteroConfig.server5
    }
    return serverConfigs[serverKey] || null
}

function validateServerConfig(serverConfig) {
    const missing = []
    if (!serverConfig?.domain) missing.push('النطاق')
    if (!serverConfig?.apikey) missing.push('مفتاح API (PTLA)')
    return missing
}

function getAvailableServers(pteroConfig) {
    const available = []
    if (!pteroConfig) return available
    for (let i = 1; i <= 5; i++) {
        const cfg = pteroConfig[`server${i}`]
        if (cfg?.domain && cfg?.apikey) available.push(`v${i}`)
    }
    return available
}

function formatBytes(bytes) {
    if (bytes === 0) return 'غير محدود'
    const mb = bytes
    if (mb >= 1000) return `${(mb / 1000).toFixed(1)} جيجابايت`
    return `${mb} ميجابايت`
}

async function fetchAllServers(serverConfig) {
    let allServers = []
    let page = 1
    let totalPages = 1
    
    while (page <= totalPages) {
        const res = await axios.get(`${serverConfig.domain}/api/application/servers?page=${page}&per_page=50`, {
            headers: {
                'Authorization': `Bearer ${serverConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'Application/vnd.pterodactyl.v1+json'
            }
        })
        
        const servers = res.data.data || []
        allServers = allServers.concat(servers)
        
        const meta = res.data.meta?.pagination
        if (meta) {
            totalPages = meta.total_pages || 1
        }
        page++
    }
    
    return allServers
}

async function handler(m, { sock }) {
    const pteroConfig = config.pterodactyl
    
    const { server: serverVersion, serverKey } = parseServerVersion(m.command)
    const serverLabel = serverVersion.toUpperCase()
    
    if (!hasFullAccess(m.sender, serverVersion, m.isOwner)) {
        const userRole = getUserRole(m.sender, serverVersion)
        return m.reply(
            `❌ *تم رفض الوصول*\n\n` +
            `معذرة، ليس لديك صلاحية الوصول الكامل إلى اللوحة *${serverLabel}*.\n` +
            `دورك الحالي: *${userRole || 'لا يوجد'}*`
        )
    }
    
    const serverConfig = getServerConfig(pteroConfig, serverKey)
    const missingConfig = validateServerConfig(serverConfig)
    
    if (missingConfig.length > 0) {
        const available = getAvailableServers(pteroConfig)
        let txt = `⚠️ *الخادم ${serverLabel} غير مهيأ*\n\n`
        if (available.length > 0) {
            txt += `يبدو أن هذا الخادم لم يتم تكوينه. إليك الخوادم المتاحة التي يمكنك استخدامها: *${available.join(', ')}*\n`
            txt += `يمكنك محاولة التحقق باستخدام \`${m.prefix}listserver${available[0]}\``
        } else {
            txt += `يبدو أن تكوين خادم Pterodactyl في ملف \`config.js\` لم يتم ضبطه بشكل صحيح. يرجى التحقق منه!`
        }
        return m.reply(txt)
    }
    
    try {
        m.react("🕕")
        
        const servers = await fetchAllServers(serverConfig)
        
        if (servers.length === 0) {
            return m.reply(`📋 *قائمة الخوادم ${serverLabel}*\n\nلا توجد خوادم مسجلة في هذه اللوحة حالياً.`)
        }
        
        let txt = `📋 *قائمة الخوادم ${serverLabel}*\n\n`
        txt += `إجمالي الخوادم المسجلة: *${servers.length}*\n\n`
        
        servers.slice(0, 20).forEach((s) => {
            const attr = s.attributes
            const limits = attr.limits || {}
            txt += `- *${attr.name}*\n`
            txt += `   ├ المعرف: \`${attr.id}\`\n`
            txt += `   ├ الرام: \`${formatBytes(limits.memory)}\`\n`
            txt += `   └ المعالج: \`${limits.cpu === 0 ? 'غير محدود' : limits.cpu + '%'}\`\n`
        })
        
        if (servers.length > 20) {
            txt += `\n... ويوجد ${servers.length - 20} خادم آخر غير معروض.`
        }
        
        const available = getAvailableServers(pteroConfig)
        if (available.length > 1) {
            txt += `\n\nالخوادم الأخرى المتاحة: *${available.filter(s => s !== serverVersion).join(', ')}*`
        }
        
        return m.reply(txt)
        
    } catch (err) {
        console.error(err)
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }