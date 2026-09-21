// حفظ قاعدة البيانات - أمر لتحميل ملف قاعدة البيانات

import moment from 'moment-timezone'
import fs from 'fs'
import path from 'path'
import config from '../../config.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'حفظ_قاعدة_البيانات',
    alias: ['savedb'],
    category: 'owner',
    description: 'تحميل ملف قاعدة البيانات',
    usage: '.حفظ_قاعدة_البيانات',
    example: '.حفظ_قاعدة_البيانات',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    if (!config.isOwner(m.sender)) {
        return m.reply('❌ *للمالك فقط!*')
    }
    
    const dbPath = path.join(process.cwd(), 'database', 'db.json')
    
    if (!fs.existsSync(dbPath)) {
        return m.reply(`❌ ملف قاعدة البيانات غير موجود!`)
    }
    
    try {
        const stats = fs.statSync(dbPath)
        const data = fs.readFileSync(dbPath)
        const now = moment().tz('Asia/Jakarta')
        const timestamp = now.format('YYYY-MM-DD_HH-mm-ss')
        const fileName = `db_backup_${timestamp}.json`
        
        await sock.sendMessage(m.chat, {
            document: data,
            fileName: fileName,
            mimetype: 'application/json',
            caption: `📦 *نسخة احتياطية لقاعدة البيانات*\n\n` +
                `╭┈┈⬡「 📋 *معلومات* 」\n` +
                `┃ 📁 الملف: \`db.json\`\n` +
                `┃ 📊 الحجم: \`${(stats.size / 1024).toFixed(2)} كيلوبايت\`\n` +
                `┃ 📅 التاريخ: \`${now.format('DD/MM/YYYY')}\`\n` +
                `┃ ⏰ الوقت: \`${now.format('HH:mm:ss')}\`\n` +
                `╰┈┈┈┈┈┈┈┈⬡`
        }, { quoted: m })
    } catch (error) {
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }