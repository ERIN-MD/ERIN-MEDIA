// إدارة الأدوار - أمر لإدارة المالكين/الرؤساء/مُعيدي البيع لكل خادم

import { isLid, lidToJid } from '../../src/lib/maro-lid.js'
import { addRole, removeRole, listByRole, canManageRole, getUserRole, VALID_SERVERS } from '../../src/lib/maro-roles-cpanel.js'

const ROLES = ['owner', 'ceo', 'reseller']
const allCommands = []

ROLES.forEach(role => {
    VALID_SERVERS.forEach(ver => {
        allCommands.push(`add${role}${ver}`)
        allCommands.push(`del${role}${ver}`)
        allCommands.push(`list${role}${ver}`)
    })
})

const pluginConfig = {
    name: allCommands,
    alias: [],
    category: 'panel',
    description: 'إدارة المالكين/الرؤساء/مُعيدي البيع لكل خادم',
    usage: '.addownerv1 @مستخدم أو .listceov2',
    example: '.addresellerv1 @مستخدم',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function cleanJid(jid) {
    if (!jid) return null
    if (isLid(jid)) jid = lidToJid(jid)
    return jid.includes('@') ? jid : jid + '@s.whatsapp.net'
}

function getNumber(jid) {
    const clean = cleanJid(jid)
    return clean ? clean.split('@')[0] : null
}

function parseCommand(cmd) {
    const match = cmd.match(/^(add|del|list)(owner|ceo|reseller)(v[1-5])$/i)
    if (!match) return null
    return {
        action: match[1].toLowerCase(),
        role: match[2].toLowerCase(),
        server: match[3].toLowerCase()
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

function handler(m, { sock }) {
    const parsed = parseCommand(m.command)
    if (!parsed) {
        return m.reply(`❌ الأمر غير صالح.`)
    }
    
    const { action, role, server } = parsed
    const serverLabel = server.toUpperCase()
    const roleLabel = capitalize(role)
    
    // ترجمة الأدوار للعرض
    const roleNames = {
        owner: 'مالك',
        ceo: 'رئيس',
        reseller: 'مُعيد بيع'
    }
    const roleNameAr = roleNames[role] || roleLabel
    
    if (action === 'list') {
        const list = listByRole(server, role)
        if (list.length === 0) {
            return m.reply(`📋 *قائمة ${roleNameAr} ${serverLabel}*\n\n> لا يوجد ${roleNameAr} مسجل.`)
        }
        
        let txt = `📋 *قائمة ${roleNameAr} ${serverLabel}*\n\n`
        txt += `> الإجمالي: *${list.length}* ${roleNameAr}\n\n`
        list.forEach((num, i) => {
            txt += `${i + 1}. \`${num}\`\n`
        })
        txt += `\n> _الدور: ${roleNameAr} | الخادم: ${serverLabel}_`
        return m.reply(txt)
    }
    
    if (!canManageRole(m.sender, server, role, m.isOwner)) {
        const userRole = getUserRole(m.sender, server)
        const userRoleName = userRole ? (roleNames[userRole] || capitalize(userRole)) : 'لا يوجد'
        return m.reply(
            `❌ *تم رفض الوصول*\n\n` +
            `> لا يمكنك إدارة *${roleNameAr}* في *${serverLabel}*\n` +
            `> دورك: *${userRoleName}*\n\n` +
            `> التسلسل الهرمي: مالك > رئيس > مُعيد بيع`
        )
    }
    
    let targetUser = null
    if (m.quoted?.sender) {
        targetUser = getNumber(m.quoted.sender)
    } else if (m.mentionedJid?.length > 0) {
        targetUser = getNumber(m.mentionedJid[0])
    } else if (m.text?.trim()) {
        targetUser = m.text.trim().replace(/[^0-9]/g, '')
    }
    
    if (!targetUser) {
        return m.reply(
            `⚠️ *طريقة الاستخدام*\n\n` +
            `> \`${m.prefix}${m.command} @مستخدم\`\n` +
            `> \`${m.prefix}${m.command} 628xxx\`\n` +
            `> رد على رسالة المستخدم`
        )
    }
    
    if (action === 'add') {
        const result = addRole(targetUser, server, role)
        if (!result.success) {
            return m.reply(`❌ *فشل*\n\n> ${result.error}`)
        }
        
        m.react('✅')
        return m.reply(
            `✅ *تم إضافة ${roleNameAr}*\n\n` +
            `╭┈┈⬡「 📋 *التفاصيل* 」\n` +
            `┃ 📱 الرقم: \`${targetUser}\`\n` +
            `┃ 🏷️ الدور: \`${roleNameAr}\`\n` +
            `┃ 🖥️ الخادم: \`${serverLabel}\`\n` +
            `┃ 📊 الإجمالي: \`${listByRole(server, role).length}\` ${roleNameAr}\n` +
            `╰┈┈⬡`
        )
    }
    
    if (action === 'del') {
        const result = removeRole(targetUser, server, role)
        if (!result.success) {
            return m.reply(`❌ *فشل*\n\n> ${result.error}`)
        }
        
        m.react('✅')
        return m.reply(
            `✅ *تم حذف ${roleNameAr}*\n\n` +
            `> الرقم: \`${targetUser}\`\n` +
            `> الخادم: *${serverLabel}*\n` +
            `> الإجمالي: *${listByRole(server, role).length}* ${roleNameAr}`
        )
    }
}

export { pluginConfig as config, handler }