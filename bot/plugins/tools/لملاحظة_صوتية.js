import { queueFFmpeg } from '../../src/lib/maro-ffmpeg.js'
import fs from 'fs'
import path from 'path'

const pluginConfig = {
    name: 'لملاحظة_صوتية',
    alias: ['ptt'],
    category: 'tools',
    description: 'تحويل صوت/فيديو إلى ملاحظة صوتية',
    usage: '.لملاحظة_صوتية (رد على صوت/فيديو)',
    example: '.لملاحظة_صوتية',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    let mediaSource = null
    let downloadFn = null
    let isVideo = false
    
    const selfIsVideo = m.isVideo || m.type === 'videoMessage' || m.message?.videoMessage
    const selfIsAudio = m.isAudio || m.type === 'audioMessage' || m.message?.audioMessage
    
    const quotedIsVideo = m.quoted && (
        m.quoted.isVideo || 
        m.quoted.type === 'videoMessage' || 
        m.quoted.mtype === 'videoMessage' ||
        m.quoted.message?.videoMessage
    )
    const quotedIsAudio = m.quoted && (
        m.quoted.isAudio || 
        m.quoted.type === 'audioMessage' || 
        m.quoted.mtype === 'audioMessage' ||
        m.quoted.message?.audioMessage
    )
    
    if (selfIsVideo) {
        mediaSource = 'self'
        downloadFn = m.download
        isVideo = true
    } else if (selfIsAudio) {
        mediaSource = 'self'
        downloadFn = m.download
    } else if (quotedIsVideo) {
        mediaSource = 'quoted'
        downloadFn = m.quoted.download
        isVideo = true
    } else if (quotedIsAudio) {
        mediaSource = 'quoted'
        downloadFn = m.quoted.download
    }
    
    if (!mediaSource) {
        await m.reply(
            `❌ *فشل*\n\n` +
            `> لم يتم اكتشاف صوت أو فيديو!\n\n` +
            `*طريقة الاستخدام:*\n` +
            `> 1. أرسل صوت/فيديو مع الأمر \`${m.prefix}لملاحظة_صوتية\`\n` +
            `> 2. رد على صوت/فيديو بـ \`${m.prefix}لملاحظة_صوتية\``
        )
        return
    }

    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

    const timestamp = Date.now()
    const ext = isVideo ? 'mp4' : 'mp3'
    const inputPath = path.join(tempDir, `input_${timestamp}.${ext}`)
    const outputPath = path.join(tempDir, `vn_${timestamp}.ogg`)

    await m.react('🕕')
    try {
        const buffer = await downloadFn()

        if (!buffer || buffer.length === 0) {
            await m.react('❌')
            await m.reply(
                `❌ *فشل*\n\n` +
                `> لا يمكن تحميل الملف.\n` +
                `> ربما الملف غير متوفر حالياً.`
            )
            return
        }

        fs.writeFileSync(inputPath, buffer)

        const ffmpegCmd = [
            'ffmpeg -y',
            `-i "${inputPath}"`,
            '-vn',
            '-c:a libopus',
            '-b:a 128k',
            '-ar 48000',
            '-ac 1',
            '-application voip',
            `"${outputPath}"`
        ].join(' ')

        await queueFFmpeg(ffmpegCmd)

        if (!fs.existsSync(outputPath)) {
            await m.react('❌')
            await m.reply(
                `❌ *فشل التحويل*\n\n` +
                `> فشل تحويل الملف إلى ملاحظة صوتية.\n` +
                `> تأكد من تثبيت ffmpeg بشكل صحيح.`
            )
            return
        }

        const vnBuffer = fs.readFileSync(outputPath)

        await sock.sendMedia(m.chat, vnBuffer, null, m, {
            type: 'audio',
            ptt: true
        })

        await m.react('✅')

    } catch (error) {
        await m.react('❌')
        await m.reply(
            `❌ *خطأ*\n\n` +
            `> حدث خطأ أثناء المعالجة.\n` +
            `> _${error.message}_`
        )
    } finally {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
    }
}

export { pluginConfig as config, handler }