// إدارة البائعين - أمر لإدارة بائعي/مُعيدي بيع اللوحات

import config from '../../config.js'
import fs from 'fs'
import path from 'path'
import { isLid, lidToJid } from '../../src/lib/maro-lid.js'
import { getDatabase } from '../../src/lib/maro-database.js'
import { getGroupMode } from '../group/وضع_البوت.js'

const pluginConfig = {
    name: 'إدارة_البائعين',
    alias: ['addseller'],
    category: 'panel',
    description: 'إدارة بائعي/مُعيدي بيع اللوحات',
    usage: '.إدارة_البائعين @مستخدم أو .حذف_بائع @مستخدم',
    example: '.إدارة_البائعين @مستخدم',
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

function hasAccess(senderJid, isOwner, pteroConfig) {
    if (isOwner) return true
    const cleanSender = cleanJid(senderJid)?.split('@')[0]
    if (!cleanSender) return false
    const ownerPanels = pteroConfig?.ownerPanels || []
    return ownerPanels.includes(cleanSender)
}

function saveConfig() {
    try {
        const configPath = path.join(process.cwd(), 'config.js')
        let content = fs.readFileSync(configPath, 'utf8')
        
        const sellersStr = JSON.stringify(config.pterodactyl.sellers || [])
        content = content.replace(
            /sellers:\s*\[.*?\]/s,
            `sellers: ${sellersStr}`
        )
        
        const ownerPanelsStr = JSON.stringify(config.pterodactyl.ownerPanels || [])
        content = content.replace(
            /ownerPanels:\s*\[.*?\]/s,
            `ownerPanels: ${ownerPanelsStr}`
        )
        
        fs.writeFileSync(configPath, content, 'utf8')
        return true
    } catch (e) {
        console.error('[Panel] فشل حفظ الإعدادات:', e.message)
        return false
    }
}

function handler(m, { sock }) {
    const db = getDatabase()
    const cmd = m.command.toLowerCase()
    const pteroConfig = config.pterodactyl
    
    if (!hasAccess(m.sender, m.isOwner, pteroConfig)) {
        return m.reply(`❌ *تم رفض الوصول*\n\n> هذه الميزة للمالك أو مالك اللوحة فقط.`)
    }
    
    if (!pteroConfig) {
        return m.reply(`❌ إعدادات Pterodactyl غير موجودة في config.js`)
    }
    
    if (!pteroConfig.sellers) {
        pteroConfig.sellers = []
    }
    
    const isAdd = ['addseller', 'addreseller', 'إضافة_بائع', 'إضافة_مُعيد_بيع'].includes(cmd)
    const isDel = ['delseller', 'delreseller', 'حذف_بائع', 'حذف_مُعيد_بيع'].includes(cmd)
    const isList = ['listseller', 'listreseller', 'قائمة_البائعين', 'قائمة_مُعيدي_البيع'].includes(cmd)
    
    if (isList) {
        if (pteroConfig.sellers.length === 0) {
            return m.reply(`📋 *قائمة البائعين/مُعيدي البيع*\n\n> لا يوجد بائعون مسجلون.`)
        }
        
        let txt = `📋 *قائمة البائعين/مُعيدي البيع*\n\n`
        txt += `> الإجمالي: *${pteroConfig.sellers.length}* بائع\n\n`
        pteroConfig.sellers.forEach((s, i) => {
            txt += `${i + 1}. \`${s}\`\n`
        })
        txt += `\n> _يمكن للبائع إنشاء خادم (1GB-10GB v1/v2/v3)_`
        return m.reply(txt)
    }
    
    let targetUser = null
    if (m.quoted?.sender) {
        targetUser = getNumber(m.quoted.sender)
    } else if (m.mentionedJid?.length > 0) {
        targetUser = getNumber(m.mentionedJid[0])
    } else if (m.text?.trim()) {
        targetUser = m.text.trim().replace(/[^0-9]/g, '')
    } else {
        targetUser = getNumber(m.sender)
    }
    
    if (!targetUser) {
        return m.reply(
            `⚠️ *طريقة الاستخدام*\n\n` +
            `> \`${m.prefix}${cmd} @مستخدم\`\n` +
            `> \`${m.prefix}${cmd} 628xxx\`\n` +
            `> رد على رسالة المستخدم`
        )
    }
    
    if (isAdd) {
        if (pteroConfig.sellers.includes(targetUser)) {
            return m.reply(`❌ \`${targetUser}\` بالفعل بائع.`)
        }
        
        let roleChanged = ''
        const ownerIdx = (pteroConfig.ownerPanels || []).indexOf(targetUser)
        if (ownerIdx !== -1) {
            pteroConfig.ownerPanels.splice(ownerIdx, 1)
            roleChanged = `\n> ⚡ تم تخفيض الرتبة تلقائياً من مالك لوحة إلى بائع`
        }
        
        pteroConfig.sellers.push(targetUser)
        
        if (saveConfig()) {
            m.react('✅')
            return m.reply(
                `✅ *تم إضافة البائع*\n\n` +
                `╭┈┈⬡「 📋 *التفاصيل* 」\n` +
                `┃ 📱 الرقم: \`${targetUser}\`\n` +
                `┃ 🏷️ الحالة: \`بائع/مُعيد بيع\`\n` +
                `┃ 🔓 الصلاحية: \`إنشاء خادم (1GB-10GB v1-v3)\`\n` +
                `┃ 📊 الإجمالي: \`${pteroConfig.sellers.length}\` بائع\n` +
                `╰┈┈⬡${roleChanged}`
            )
        } else {
            pteroConfig.sellers = pteroConfig.sellers.filter(s => s !== targetUser)
            return m.reply(`❌ فشل حفظ الإعدادات في config.js`)
        }
    }
    
    if (isDel) {
        if (!pteroConfig.sellers.includes(targetUser)) {
            return m.reply(`❌ \`${targetUser}\` ليس بائعاً.`)
        }
        
        pteroConfig.sellers = pteroConfig.sellers.filter(s => s !== targetUser)
        
        if (saveConfig()) {
            m.react('✅')
            return m.reply(
                `✅ *تم حذف البائع*\n\n` +
                `> الرقم: \`${targetUser}\`\n` +
                `> الإجمالي: *${pteroConfig.sellers.length}* بائع`
            )
        } else {
            return m.reply(`❌ فشل حفظ الإعدادات في config.js`)
        }
    }
}

export { pluginConfig as config, handler }