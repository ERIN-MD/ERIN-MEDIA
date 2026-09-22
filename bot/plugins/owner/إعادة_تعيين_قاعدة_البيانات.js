// إعادة تعيين قاعدة البيانات - أمر لإعادة تعيين جميع بيانات قاعدة البيانات

import fs from 'fs'
import path from 'path'
import config from '../../config.js'
import { getDatabase } from '../../src/lib/maro-database.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'إعادة_تعيين_قاعدة_البيانات',
    alias: ['resetdb'],
    category: 'owner',
    description: 'إعادة تعيين جميع بيانات قاعدة البيانات',
    usage: '.إعادة_تعيين_قاعدة_البيانات [تأكيد]',
    example: '.إعادة_تعيين_قاعدة_البيانات تأكيد',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 0,
    isEnabled: true
}

if (!global.resetDbPending) global.resetDbPending = {}

async function handler(m, { sock }) {
    if (!config.isOwner(m.sender)) {
        return m.reply('❌ *للمالك فقط!*')
    }
    
    const confirm = m.args?.[0]?.toLowerCase()
    
    if (confirm !== 'confirm' && confirm !== 'تأكيد') {
        global.resetDbPending[m.sender] = Date.now()
        
        return m.reply(
            `⚠️ *تحذير!*\n\n` +
            `> سيتم حذف جميع البيانات:\n` +
            `> • بيانات المستخدمين\n` +
            `> • بيانات المجموعات\n` +
            `> • بيانات العشائر\n` +
            `> • جميع الإحصائيات\n\n` +
            `╭┈┈⬡「 ⚠️ *التأكيد* 」\n` +
            `┃ اكتب: *.إعادة_تعيين_قاعدة_البيانات تأكيد*\n` +
            `┃ خلال 60 ثانية\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> ❌ هذا الإجراء لا يمكن التراجع عنه!`
        )
    }
    
    const pending = global.resetDbPending[m.sender]
    if (!pending || (Date.now() - pending) > 60000) {
        delete global.resetDbPending[m.sender]
        return m.reply(`❌ انتهى الوقت! اكتب *.إعادة_تعيين_قاعدة_البيانات* مرة أخرى للبدء.`)
    }
    
    delete global.resetDbPending[m.sender]
    
    try {
        const dbPath = path.join(process.cwd(), 'database', 'db.json')
        const backupPath = path.join(process.cwd(), 'database', `db_backup_${Date.now()}.json`)
        
        if (fs.existsSync(dbPath)) {
            fs.copyFileSync(dbPath, backupPath)
        }
        
        const db = getDatabase()
        
        let userCount = 0
        let groupCount = 0
        let clanCount = 0
        
        if (db.db?.data?.users) {
            userCount = Object.keys(db.db.data.users).length
            db.db.data.users = {}
        }
        
        if (db.db?.data?.groups) {
            groupCount = Object.keys(db.db.data.groups).length
            db.db.data.groups = {}
        }
        
        if (db.db?.data?.clans) {
            clanCount = Object.keys(db.db.data.clans).length
            db.db.data.clans = {}
        }
        
        await db.save()
        
        await m.reply(
            `✅ *تم إعادة تعيين قاعدة البيانات!*\n\n` +
            `╭┈┈⬡「 📊 *البيانات المحذوفة* 」\n` +
            `┃ 👤 المستخدمين: ${userCount}\n` +
            `┃ 👥 المجموعات: ${groupCount}\n` +
            `┃ ⚔️ العشائر: ${clanCount}\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> تم حفظ النسخة الاحتياطية في:\n` +
            `> \`${path.basename(backupPath)}\``
        )
        
    } catch (error) {
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }