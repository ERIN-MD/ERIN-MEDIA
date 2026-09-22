// قائمة_المستخدمين - أمر لعرض جميع المستخدمين في اللوحة (v1-v5)

import axios from 'axios'
import config from '../../config.js'
import { hasFullAccess, getUserRole, VALID_SERVERS } from '../../src/lib/maro-roles-cpanel.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: ['قائمة_المستخدمين_v1', 'قائمة_المستخدمين_v2', 'قائمة_المستخدمين_v3', 'قائمة_المستخدمين_v4', 'قائمة_المستخدمين_v5'],
    alias: ['listuserv1', 'listuserv2', 'listuserv3', 'listuserv4', 'listuserv5', 'usersv1', 'usersv2', 'usersv3', 'usersv4', 'usersv5', 'listpanelv1', 'listpanelv2', 'listpanelv3', 'listpanelv4', 'listpanelv5'],
    category: 'panel',
    description: 'عرض جميع المستخدمين في اللوحة (v1-v5)',
    usage: '.قائمة_المستخدمين_v1 أو .قائمة_المستخدمين_v2',
    example: '.قائمة_المستخدمين_v1',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
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

function validateServerConfig(serverConfig) {
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
    
    const serverConfig = getServerConfig(pteroConfig, serverKey)
    const missingConfig = validateServerConfig(serverConfig)
    
    if (missingConfig.length > 0) {
        const available = getAvailableServers(pteroConfig)
        let txt = `⚠️ *الخادم ${serverLabel} غير مهيأ*\n\n`
        if (available.length > 0) {
            txt += `> الخوادم المتاحة: *${available.join(', ')}*\n`
            txt += `> مثال: \`${m.prefix}قائمة_المستخدمين_${available[0]}\``
        } else {
            txt += `> قم بتعبئة إعدادات pterodactyl في \`config.js\``
        }
        return m.reply(txt)
    }
    
    try {
        const res = await axios.get(`${serverConfig.domain}/api/application/users?per_page=100`, {
            headers: {
                'Authorization': `Bearer ${serverConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'Application/vnd.pterodactyl.v1+json'
            }
        })
        
        const users = res.data.data || []
        
        if (users.length === 0) {
            return m.reply(`📋 *قائمة المستخدمين [${serverLabel}]*\n\n> لا يوجد مستخدمون مسجلون.`)
        }
        
        let txt = `📋 *قائمة المستخدمين [${serverLabel}]*\n\n`
        txt += `> الإجمالي: *${users.length}* مستخدم\n\n`
        
        users.slice(0, 20).forEach((u, i) => {
            const attr = u.attributes
            const isAdmin = attr.root_admin ? ' 👑' : ''
            txt += `${i + 1}. *${attr.username}*${isAdmin}\n`
            txt += `   ├ المعرف: \`${attr.id}\`\n`
            txt += `   └ البريد الإلكتروني: \`${attr.email}\`\n`
        })
        
        if (users.length > 20) {
            txt += `\n> ... و ${users.length - 20} مستخدم آخر`
        }
        
        const available = getAvailableServers(pteroConfig)
        if (available.length > 1) {
            txt += `\n\n> الخوادم الأخرى: *${available.filter(s => s !== serverVersion).join(', ')}*`
        }
        
        return m.reply(txt)
        
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }