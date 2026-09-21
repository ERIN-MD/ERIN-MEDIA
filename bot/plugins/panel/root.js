// إلغاء_تثبيت_القالب - أمر لإلغاء تثبيت قالب Pterodactyl عبر SSH

import { Client } from 'ssh2'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: ['إلغاء_تثبيت_القالب'],
    alias: ['uinstalltema', 'uninstalltema', 'removetema', 'hapustema'],
    category: 'panel',
    description: 'إلغاء تثبيت قالب Pterodactyl عبر SSH',
    usage: '.إلغاء_تثبيت_القالب <IP>|<كلمة_المرور>',
    example: '.إلغاء_تثبيت_القالب 192.168.1.1|كلمة_السر',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    const text = m.text?.trim()
    
    if (!text) {
        return m.reply(
            `╭┈┈⬡「 🗑️ *إلغاء تثبيت القالب* 」
┃ ㊗ طريقة الاستخدام: \`${m.prefix}إلغاء_تثبيت_القالب <IP>|<كلمة_المرور>\`
╰┈┈⬡

> \`مثال: ${m.prefix}إلغاء_تثبيت_القالب 192.168.1.1|كلمة_السر\``
        )
    }
    
    const parts = text.split('|')
    if (parts.length < 2) {
        return m.reply(`❌ صيغة خاطئة! استخدم: \`IP|كلمة_المرور\``)
    }
    
    const ipvps = parts[0].trim()
    const passwd = parts[1].trim()
    
    global.installtema = { vps: ipvps, pwvps: passwd }
    
    const connSettings = {
        host: ipvps,
        port: 22,
        username: 'root',
        password: passwd
    }
    
    const command = `bash <(curl -s https://raw.githubusercontent.com/veryLinh/Theme-Autoinstaller/main/install.sh)`
    const ress = new Client()
    
    m.react('🕕')
    await m.reply(`🕕 *جاري إلغاء تثبيت القالب...*\n\n> انتظر 1-10 دقائق حتى اكتمال العملية`)
    
    ress.on('ready', () => {
        ress.exec(command, (err, stream) => {
            if (err) {
                m.react('☢')
                return m.reply(te(m.prefix, m.command, m.pushName))
            }
            
            stream.on('close', async () => {
                m.react('✅')
                await m.reply(
                    `╭┈┈⬡「 ✅ *إلغاء تثبيت القالب* 」
┃ ㊗ الحالة: *تم بنجاح*
┃ ㊗ IP: ${ipvps}
╰┈┈⬡

> _تم إلغاء تثبيت القالب بنجاح!_`
                )
                ress.end()
            }).on('data', (data) => {
                console.log('[UninstallTema]', data.toString())
                stream.write('skyzodev\n')
                stream.write('2\n')
                stream.write('y\n')
                stream.write('x\n')
            }).stderr.on('data', (data) => {
                console.log('[UninstallTema STDERR]', data.toString())
            })
        })
    }).on('error', (err) => {
        console.log('[SSH Error]', err)
        m.react('❌')
        m.reply(`❌ فشل الاتصال!\n\n> IP أو كلمة المرور غير صالحة.`)
    }).connect(connSettings)
}

export { pluginConfig as config, handler }