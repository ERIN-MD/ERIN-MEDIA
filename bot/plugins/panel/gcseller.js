// بائع المجموعة - أمر لتسجيل المجموعة كبائع لوحة (صلاحية إنشاء خادم)

import fs from 'fs'
import path from 'path'
import config from '../../config.js'
import { isLid, lidToJid } from '../../src/lib/maro-lid.js'

const CPANEL_DIR = path.join(process.cwd(), 'database', 'cpanel')
const VALID_SERVERS = ['v1', 'v2', 'v3', 'v4', 'v5']

function ensureDir() {
    if (!fs.existsSync(CPANEL_DIR)) {
        fs.mkdirSync(CPANEL_DIR, { recursive: true })
    }
}

function getFilePath(version) {
    return path.join(CPANEL_DIR, `gcseller_${version}.json`)
}

function loadGcSeller(version) {
    ensureDir()
    const filePath = getFilePath(version)
    if (!fs.existsSync(filePath)) return null
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'))
    } catch {
        return null
    }
}

function saveGcSeller(version, groupJid) {
    ensureDir()
    fs.writeFileSync(getFilePath(version), JSON.stringify(groupJid), 'utf8')
}

function isGcSeller(chatJid, version) {
    if (!chatJid?.endsWith('@g.us')) return false
    return loadGcSeller(version) === chatJid
}

function getGcSellerVersion(chatJid) {
    if (!chatJid?.endsWith('@g.us')) return null
    for (const ver of VALID_SERVERS) {
        if (loadGcSeller(ver) === chatJid) return ver
    }
    return null
}

const allCommands = []
VALID_SERVERS.forEach(ver => {
    allCommands.push(`addgcseller${ver}`, `resetgcseller${ver}`)
})

const pluginConfig = {
    name: allCommands,
    alias: [],
    category: 'panel',
    description: 'تسجيل المجموعة كبائع لوحة (صلاحية إنشاء خادم)',
    usage: '.addgcsellerv1 (داخل المجموعة)',
    example: '.addgcsellerv1',
    isOwner: true,
    isGroup: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function hasAccess(senderJid, isOwner) {
    if (isOwner) return true
    let jid = senderJid
    if (isLid(jid)) jid = lidToJid(jid)
    const number = jid?.replace(/@.*$/, '')
    const ownerPanels = config.pterodactyl?.ownerPanels || []
    return ownerPanels.includes(number)
}

function parseCommand(cmd) {
    const match = cmd.match(/^(addgcseller|resetgcseller)(v[1-5])$/i)
    if (!match) return null
    return {
        action: match[1].toLowerCase().startsWith('add') ? 'add' : 'reset',
        version: match[2].toLowerCase()
    }
}

function handler(m) {
    const parsed = parseCommand(m.command)
    if (!parsed) return m.reply('❌ الأمر غير صالح.')

    if (!hasAccess(m.sender, m.isOwner)) {
        return m.reply('❌ *تم رفض الوصول*\n\n> هذه الميزة للمالك أو مالك اللوحة فقط.')
    }

    const { action, version } = parsed
    const serverLabel = version.toUpperCase()

    if (action === 'add') {
        const current = loadGcSeller(version)
        if (current === m.chat) {
            return m.reply(`❌ هذه المجموعة مسجلة بالفعل كبائع *${serverLabel}*.`)
        }

        saveGcSeller(version, m.chat)
        m.react('✅')

        let txt = `✅ *تم إضافة بائع المجموعة ${serverLabel}*\n\n`
        txt += `╭┈┈⬡「 📋 *التفاصيل* 」\n`
        txt += `┃ 🖥️ الخادم: \`${serverLabel}\`\n`
        txt += `┃ 👥 المجموعة: \`${m.groupName || m.chat}\`\n`
        txt += `┃ 🔓 الصلاحية: \`1gb${version}\` - \`10gb${version}\`, \`unli${version}\`\n`
        if (current) {
            txt += `┃ ⚠️ السابق: \`${current}\` (تم الاستبدال)\n`
        }
        txt += `╰┈┈⬡\n\n`
        txt += `> جميع أعضاء هذه المجموعة يمكنهم الآن إنشاء خادم ${serverLabel}.`
        return m.reply(txt)
    }

    if (action === 'reset') {
        const current = loadGcSeller(version)
        if (!current) {
            return m.reply(`❌ لا يوجد بائع مجموعة مسجل لـ *${serverLabel}*.`)
        }

        saveGcSeller(version, null)
        m.react('✅')
        return m.reply(
            `✅ *تم إعادة تعيين بائع المجموعة ${serverLabel}*\n\n` +
            `> المجموعة: \`${current}\`\n` +
            `> الخادم *${serverLabel}* لم يعد متصلاً بأي مجموعة.`
        )
    }
}

export { pluginConfig as config, handler, loadGcSeller, saveGcSeller, isGcSeller, getGcSellerVersion, VALID_SERVERS }