// رستارت - أمر لإعادة تشغيل البوت (إعادة تشغيل حقيقية)

import { spawn } from 'child_process'
import path from 'path'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'رستارت',
    alias: ['restart'],
    category: 'owner',
    description: 'إعادة تشغيل البوت (إعادة تشغيل حقيقية)',
    usage: '.رستارت',
    example: '.رستارت',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        await m.react('🔄')
        
        const startTime = Date.now()
        
        await sock.sendMessage(m.chat, {
            text: `🔄 *جاري إعادة تشغيل البوت...*\n\n` +
                  `╭┈┈⬡「 📊 *معلومات* 」\n` +
                  `┃ ⏰ الوقت: ${new Date().toLocaleTimeString('ar-EG')}\n` +
                  `┃ 🔧 الطريقة: تشغيل العملية\n` +
                  `┃ 📦 المعرف: ${process.pid}\n` +
                  `╰┈┈⬡\n\n` +
                  `> سيتم إعادة تشغيل البوت خلال 2 ثانية...\n` +
                  `> قد تستغرق العملية 10-30 ثانية`
        }, { quoted: m })
        
        console.log('[Restart] Command triggered by:', m.sender)
        console.log('[Restart] Initiating graceful restart...')
        
        setTimeout(() => {
            const cwd = process.cwd()
            const isWindows = process.platform === 'win32'
            
            let command, args
            
            if (isWindows) {
                command = 'cmd.exe'
                args = ['/c', 'start', '/b', 'node', 'index.js']
            } else {
                command = 'node'
                args = ['index.js']
            }
            
            const child = spawn(command, args, {
                cwd: cwd,
                detached: true,
                stdio: 'ignore',
                shell: isWindows,
                env: { ...process.env, RESTARTED: 'true', RESTART_TIME: startTime.toString() }
            })
            
            child.unref()
            
            console.log('[Restart] New process spawned, exiting current process...')
            
            setTimeout(() => {
                process.exit(0)
            }, 500)
            
        }, 2000)
        
    } catch (error) {
        await m.react('☢')
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }