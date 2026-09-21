import fs from 'fs'
import path from 'path'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'تنظيف_الجلسات',
    alias: ['clearsessions'],
    category: 'owner',
    description: 'حذف جميع الجلسات في مجلد storage/sessions/',
    usage: '.تنظيف_الجلسات',
    example: '.تنظيف_الجلسات',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 0,
    isEnabled: true
}

async function handler(m)  {
    const sessionsPath = path.join(process.cwd(), 'storage', 'sessions')
    
    if (!fs.existsSync(sessionsPath)) {
        return m.reply(`❌ مجلد الجلسات غير موجود!`)
    }
    
    await m.react('🗑️')
    
    try {
        const files = fs.readdirSync(sessionsPath)
        
        if (files.length === 0) {
            return m.reply(`📁 مجلد الجلسات فارغ بالفعل!`)
        }
        
        let deleted = 0
        let skipped = 0
        
        for (const file of files) {
            if (file === 'creds.json') {
                skipped++
                continue
            }
            
            const filePath = path.join(sessionsPath, file)
            try {
                const stat = fs.statSync(filePath)
                if (stat.isDirectory()) {
                    fs.rmSync(filePath, { recursive: true, force: true })
                } else {
                    fs.unlinkSync(filePath)
                }
                deleted++
            } catch {}
        }
        
        await m.react('✅')
        await m.reply(
            `╭┈┈⬡「 🗑️ *تنظيف الجلسات* 」
┃
┃ ㊗ المحذوف: *${deleted}* ملف
┃ ㊗ المتخطى: *${skipped}* ملف
┃ ㊗ ملاحظة: creds.json لم يتم حذفه
┃
╰┈┈⬡

> _تم تنظيف ملفات الجلسات بنجاح!_
> _أعد تشغيل البوت إذا لزم الأمر._`
        )
        
    } catch (error) {
        await m.react('☢')
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }