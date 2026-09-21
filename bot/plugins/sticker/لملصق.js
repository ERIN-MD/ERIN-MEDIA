import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import config from '../../config.js'
import te from '../../src/lib/maro-error.js'
const execAsync = promisify(exec)

const pluginConfig = {
    name: 'لملصق',
    alias: ['s', 'stiker', 'stickergif'],
    category: 'sticker',
    description: 'صنع ملصق من صورة/فيديو مع خيارات',
    usage: '.لملصق [--crop] [--resize WxH] [--circle] [--rounded]',
    example: '.لملصق --crop\n.لملصق --resize 256x256\n.لملصق --circle',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

function parseOptions(args) {
    const options = { crop: false, resize: null, circle: false, rounded: false, packname: null, author: null }
    for (let i = 0; i < args.length; i++) {
        const arg = args[i]
        if (arg === '--crop' || arg === '-c') options.crop = true
        else if (arg === '--resize' || arg === '-r') { if (args[i + 1] && /^\d+x\d+$/i.test(args[i + 1])) { options.resize = args[i + 1]; i++ } }
        else if (arg === '--circle') options.circle = true
        else if (arg === '--rounded') options.rounded = true
        else if (!arg.startsWith('-') && !options.packname) options.packname = arg
        else if (!arg.startsWith('-') && options.packname && !options.author) options.author = arg
    }
    return options
}

async function processImage(inputPath, outputPath, options) {
    let filters = []
    if (options.resize) { const [w, h] = options.resize.split('x').map(Number); filters.push(`scale=${w}:${h}:force_original_aspect_ratio=decrease`, `pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=0x00000000`) }
    if (options.crop) { filters.push(`crop='min(iw,ih)':'min(iw,ih)'`, `scale=512:512`) }
    if (options.circle) { filters.push(`format=rgba`, `geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(gt(pow(X-W/2,2)+pow(Y-H/2,2),pow(min(W,H)/2,2)),0,255)'`) }
    if (options.rounded) { const r = 50; filters.push(`format=rgba`, `geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lt(X,${r})*lt(Y,${r})*gt(pow(${r}-X,2)+pow(${r}-Y,2),pow(${r},2)),0,if(gt(X,W-${r})*lt(Y,${r})*gt(pow(X-W+${r},2)+pow(${r}-Y,2),pow(${r},2)),0,if(lt(X,${r})*gt(Y,H-${r})*gt(pow(${r}-X,2)+pow(Y-H+${r},2),pow(${r},2)),0,if(gt(X,W-${r})*gt(Y,H-${r})*gt(pow(X-W+${r},2)+pow(Y-H+${r},2),pow(${r},2)),0,255))))'`) }
    if (filters.length === 0) { fs.copyFileSync(inputPath, outputPath); return }
    await execAsync(`ffmpeg -i "${inputPath}" -vf "${filters.join(',')}" -y "${outputPath}"`)
}

async function processVideo(inputPath, outputPath, options) {
    let filters = []
    if (options.resize) { const [w, h] = options.resize.split('x').map(Number); filters.push(`scale=${w}:${h}:force_original_aspect_ratio=decrease`, `pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=black`) }
    if (options.crop) { filters.push(`crop='min(iw,ih)':'min(iw,ih)'`, `scale=512:512`) }
    if (filters.length === 0) { fs.copyFileSync(inputPath, outputPath); return }
    await execAsync(`ffmpeg -i "${inputPath}" -vf "${filters.join(',')}" -c:a copy -y "${outputPath}"`)
}

async function handler(m, { sock, config: botConfig }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
    const isVideo = m.isVideo || (m.quoted && m.quoted.type === 'videoMessage')
    
    if (!isImage && !isVideo) {
        return m.reply(`🖼️ *لملصق*\n\nارسل صورة/فيديو مع:\n\`${m.prefix}لملصق\`\n\n*خيارات:*\n> \`--crop\` - قص مربع\n> \`--resize WxH\` - تغيير الحجم\n> \`--circle\` - دائري\n> \`--rounded\` - زوايا دائرية`)
    }
    
    await m.react('🕕')
    const options = parseOptions(m.args || [])
    
    try {
        let buffer = m.quoted?.isMedia ? await m.quoted.download() : m.isMedia ? await m.download() : null
        if (!buffer) { await m.reply('❌ فشل التحميل'); await m.react('❌'); return }
        
        if (isVideo) {
            const tempDir = path.join(process.cwd(), 'temp')
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
            const tempVideo = path.join(tempDir, `dur_${Date.now()}.mp4`)
            fs.writeFileSync(tempVideo, buffer)
            try {
                const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempVideo}"`)
                if (parseFloat(stdout.trim()) > 10) { await m.reply('❌ الفيديو طويل جداً! الحد 10 ثواني'); await m.react('☢'); try { fs.unlinkSync(tempVideo) } catch {}; return }
            } catch {}
            try { fs.unlinkSync(tempVideo) } catch {}
        }
        
        const packname = options.packname || botConfig.sticker?.packname || botConfig.bot?.name || 'بوت'
        const author = options.author || botConfig.sticker?.author || botConfig.owner?.name || 'مطور'
        const hasProcessing = options.crop || options.resize || options.circle || options.rounded
        
        if (hasProcessing) {
            const tempDir = path.join(process.cwd(), 'temp')
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
            const ext = isVideo ? 'mp4' : 'png'
            const inputPath = path.join(tempDir, `in_${Date.now()}.${ext}`)
            const outputPath = path.join(tempDir, `out_${Date.now()}.${ext}`)
            fs.writeFileSync(inputPath, buffer)
            try { isImage ? await processImage(inputPath, outputPath, options) : await processVideo(inputPath, outputPath, options); buffer = fs.readFileSync(outputPath) } catch {}
            try { fs.unlinkSync(inputPath); fs.unlinkSync(outputPath) } catch {}
        }
        
        isImage ? await sock.sendImageAsSticker(m.chat, buffer, m, { packname, author }) : await sock.sendVideoAsSticker(m.chat, buffer, m, { packname, author })
        await m.react('✅')
    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
        await m.react('❌')
    }
}

export { pluginConfig as config, handler }