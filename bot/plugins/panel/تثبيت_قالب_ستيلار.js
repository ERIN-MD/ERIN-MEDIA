// تثبيت قالب ستيلار - أمر لتثبيت قالب ستيلار للوحة Pterodactyl عبر SSH

import { Client } from 'ssh2'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'تثبيت_قالب_ستيلار',
    alias: ['installtemastellar'],
    category: 'panel',
    description: 'تثبيت قالب ستيلار للوحة Pterodactyl عبر SSH',
    usage: '.تثبيت_قالب_ستيلار <IP>|<كلمة_المرور>',
    example: '.تثبيت_قالب_ستيلار 192.168.1.1|كلمة_السر',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 0,
    isEnabled: true
}

const DEPS_CMD = 'apt-get update -y && apt-get install -y curl git && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt-get install -y nodejs && npm i -g yarn && apt-get install -y composer'
const THEME_CMD = 'bash <(curl -s https://raw.githubusercontent.com/AnonGhostID/flavor/main/flavor.sh)'
const BUILD_CMD = 'cd /var/www/pterodactyl && composer install --no-dev --optimize-autoloader && yarn install && export NODE_OPTIONS=--openssl-legacy-provider && yarn build:production && php artisan view:clear && php artisan config:clear'

function execSSH(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, { pty: true }, (err, stream) => {
            if (err) return reject(err)
            let output = ''
            stream.on('close', () => resolve(output))
            stream.on('data', d => { output += d.toString() })
            stream.stderr.on('data', d => { output += d.toString() })
        })
    })
}

function handler(m) {
    const text = m.text?.trim()

    if (!text) {
        return m.reply(
            `╭┈┈⬡「 🎨 *تثبيت قالب ستيلار* 」\n┃ ㊗ طريقة الاستخدام: \`${m.prefix}تثبيت_قالب_ستيلار <IP>|<كلمة_المرور>\`\n╰┈┈⬡\n\n> \`مثال: ${m.prefix}تثبيت_قالب_ستيلار 192.168.1.1|كلمة_السر\``
        )
    }

    const parts = text.split('|')
    if (parts.length < 2) {
        return m.reply(`❌ صيغة خاطئة! استخدم: \`IP|كلمة_المرور\``)
    }

    const ipvps = parts[0].trim()
    const passwd = parts[1].trim()

    const connSettings = {
        host: ipvps,
        port: 22,
        username: 'root',
        password: passwd,
        readyTimeout: 30000
    }

    const conn = new Client()

    m.react('🕕')

    conn.on('ready', async () => {
        try {
            await m.reply(`🕕 *[1/3] تثبيت التبعيات...*\n\n> جاري تثبيت Node.js، Yarn، Composer...`)
            await execSSH(conn, DEPS_CMD)

            await m.reply(`🕕 *[2/3] تثبيت القالب...*\n\n> جاري تحميل وتثبيت قالب ستيلار...`)
            await execSSH(conn, THEME_CMD)

            await m.reply(`🕕 *[3/3] بناء الأصول...*\n\n> جاري تجميع أصول اللوحة...`)
            await execSSH(conn, BUILD_CMD)

            m.react('✅')
            await m.reply(
                `╭┈┈⬡「 ✅ *قالب ستيلار* 」\n┃ ㊗ الحالة: *تم التثبيت*\n┃ ㊗ IP: ${ipvps}\n╰┈┈⬡\n\n> _تم تثبيت قالب ستيلار + التبعيات بنجاح!_`
            )
        } catch (err) {
            m.react('☢')
            m.reply(te(m.prefix, m.command, m.pushName))
        } finally {
            conn.end()
        }
    }).on('error', (err) => {
        m.react('❌')
        m.reply(`❌ فشل الاتصال!\n\n> IP أو كلمة المرور غير صالحة.`)
    }).connect(connSettings)
}

export { pluginConfig as config, handler }