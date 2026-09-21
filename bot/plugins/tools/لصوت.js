import { queueFFmpeg } from '../../src/lib/maro-ffmpeg.js'
import fs from 'fs'
import path from 'path'

const pluginConfig = {
    name: 'لصوت',
    alias: ['toaudio'],
    category: 'tools',
    description: 'تحويل فيديو/ملاحظة صوتية إلى MP3',
    usage: '.لصوت (رد على فيديو/ملاحظة صوتية)',
    example: '.لصوت',
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
    let isPtt = false
    const selfIsVideo = m.isVideo || m.type === 'videoMessage' || m.message?.videoMessage
    const selfIsAudio = m.isAudio || m.type === 'audioMessage' || m.message?.audioMessage
    const selfIsPtt = m.message?.audioMessage?.ptt === true
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
    const quotedIsPtt = m.quoted?.message?.audioMessage?.ptt === true
    
    if (selfIsVideo) {
        mediaSource = 'self'
        downloadFn = m.download
        isVideo = true
    } else if (selfIsAudio && selfIsPtt) {
        mediaSource = 'self'
        downloadFn = m.download
        isPtt = true
    } else if (quotedIsVideo) {
        mediaSource = 'quoted'
        downloadFn = m.quoted.download
        isVideo = true
    } else if (quotedIsAudio) {
        mediaSource = 'quoted'
        downloadFn = m.quoted.download
        isPtt = quotedIsPtt
    }
    
    if (!mediaSource) {
        await m.reply(
            `❌ *فشل*\n\n` +
            `> لم يتم اكتشاف فيديو أو ملاحظة صوتية!\n\n` +
            `*طريقة الاستخدام:*\n` +
            `> 1. أرسل فيديو مع الأمر \`${m.prefix}لصوت\`\n` +
            `> 2. رد على فيديو/ملاحظة صوتية بـ \`${m.prefix}لصوت\``
        )
        return
    }
    if (!isVideo && !isPtt) {
        await m.reply(
            `⚠️ *ملف صوتي بالفعل*\n\n` +
            `> هذا الملف بصيغة صوتية بالفعل.\n` +
            `> استخدم \`${m.prefix}tovn\` إذا كنت تريد تحويله إلى ملاحظة صوتية.`
        )
        return
    }

    await m.reply(`🕕 *جاري المعالجة...*\n\n> استخراج الصوت من الملف...`)

    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

    const ext = isVideo ? 'mp4' : 'ogg'
    const inputPath = path.join(tempDir, `input_${Date.now()}.${ext}`)
    const outputPath = path.join(tempDir, `audio_${Date.now()}.mp3`)

    try {
        const buffer = await downloadFn()

        if (!buffer || buffer.length === 0) {
            await m.reply(
                `❌ *فشل*\n\n` +
                `> لا يمكن تحميل الملف.\n` +
                `> ربما الملف غير متوفر حالياً.`
            )
            return
        }

        fs.writeFileSync(inputPath, buffer)

        await queueFFmpeg(`ffmpeg -y -i "${inputPath}" -vn -ar 44100 -ac 2 -b:a 192k "${outputPath}"`)

        if (!fs.existsSync(outputPath)) {
            await m.reply(
                `❌ *فشل التحويل*\n\n` +
                `> فشل استخراج الصوت من الملف.\n` +
                `> تأكد من تثبيت ffmpeg بشكل صحيح.`
            )
            return
        }

        const audioBuffer = fs.readFileSync(outputPath)

        await sock.sendMedia(m.chat, audioBuffer, null, m, {
            type: 'audio'
        })

    } catch (error) {
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