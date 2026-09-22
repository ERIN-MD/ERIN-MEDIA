// ═══════════════════════════════════════════════
// 📁 plugins/downloader/npm.js
// 📦 NPM - بحث وتحميل المكتبات
// ═══════════════════════════════════════════════

import axios from 'axios'
import fs from 'fs'
import path from 'path'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'مكتبة',
    alias: ['مكتبه' , 'npm'],
    category: 'downloader',
    description: 'بحث وتحميل مكتبات npm',
    usage: '.npm <بحث> | .npm تحميل <اسم>',
    example: '.npm axios\n.npm تحميل axios',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 2,
    isEnabled: true
}

async function handler(m, { sock, args, text }) {
    const cmd = args[0]?.toLowerCase()

    // تحميل
    if (cmd === 'تحميل' || cmd === 'dl' || cmd === 'install') {
        const pkgName = args.slice(1).join(' ') || text.replace(/^(تحميل|dl|install)\s*/i, '').trim()
        if (!pkgName) return m.reply('❌ *اكتب اسم المكتبة*\n💡 .npm تحميل axios')

        m.react('⏳')

        let filePath
        try {
            const info = await axios.get(`https://registry.npmjs.org/${encodeURIComponent(pkgName)}`)
            if (!info.data?.["dist-tags"]) {
                m.react('❌')
                return m.reply('❌ *المكتبة غير موجودة*')
            }

            const latest = info.data["dist-tags"].latest
            const tarball = info.data.versions[latest].dist.tarball

            const tmpDir = path.join(process.cwd(), 'tmp')
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

            const safeName = pkgName.replace(/[@/]/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
            const fileName = `npm_${safeName}_v${latest}.tgz`
            filePath = path.join(tmpDir, fileName)

            const res = await axios.get(tarball, { responseType: 'arraybuffer', timeout: 60000 })
            fs.writeFileSync(filePath, Buffer.from(res.data))

            const fileBuffer = fs.readFileSync(filePath)
            const sizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2)

            m.react('✅')
            await sock.sendMessage(m.chat, {
                document: fileBuffer,
                fileName,
                mimetype: 'application/gzip',
                caption: `📦 *${pkgName}*\n📌 v${latest}\n📦 ${sizeMB} MB`
            }, { quoted: m })

        } catch (e) {
            m.react('❌')
            if (e.response?.status === 404) return m.reply('❌ *غير موجودة*')
            m.reply(te(m.prefix, m.command, m.pushName))
        } finally {
            if (filePath && fs.existsSync(filePath)) try { fs.unlinkSync(filePath) } catch {}
        }
        return
    }

    // بحث
    if (!text) {
        return m.reply(`📦 *NPM*\n\n📝 .npm <بحث>\n⬇️ .npm تحميل <اسم>\n\n💡 .npm axios\n💡 .npm تحميل axios`)
    }

    m.react('⏳')

    try {
        const { data } = await axios.get(`https://registry.npmjs.com/-/v1/search?text=${encodeURIComponent(text)}&size=8`)

        if (!data.objects?.length) {
            m.react('❌')
            return m.reply(`❌ *لا توجد نتائج*\n> "${text}"`)
        }

        let reply = `📦 *NPM*\n🔍 ${text} | 📊 ${data.total} حزمة\n\n`

        data.objects.slice(0, 8).forEach((item, i) => {
            const p = item.package
            reply += `*${i + 1}.* ${p.name}@${p.version}\n📝 ${(p.description || '?').slice(0, 50)}\n🔗 ${p.links?.npm || '-'}\n⬇️ .npm تحميل ${p.name}\n\n`
        })

        m.react('✅')
        await m.reply(reply)

    } catch (e) {
        m.react('❌')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }