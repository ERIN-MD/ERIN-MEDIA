// رفع_قناة - أمر لرفع صورة، صوت، فيديو، أو نص إلى القناة

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { exec } from 'child_process'
import { promisify } from 'util'
import { downloadMediaMessage } from 'maro'
import config from '../../config.js'
import te from '../../src/lib/maro-error.js'

const run = promisify(exec)

const pluginConfig = {
    name: "رفع_قناة",
    alias: ["upch"],
    category: "owner",
    description: "رفع صورة، صوت، فيديو، أو نص إلى القناة",
    usage: ".رفع_قناة <معرف القناة> <نص اختياري>",
    example: ".رفع_قناة 12xxx@newsletter مرحباً!",
    cooldown: 10,
    energi: 0,
    isOwner: true,
    isEnabled: true
}

async function toOggOpus(inputBuf) {
    const tmp = path.join(process.cwd(), "temp")
    if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true })
    const id = crypto.randomBytes(6).toString("hex")
    const inp = path.join(tmp, `upch_in_${id}`)
    const out = path.join(tmp, `upch_out_${id}.ogg`)
    fs.writeFileSync(inp, inputBuf)
    await run(`ffmpeg -y -i "${inp}" -vn -map_metadata -1 -ac 1 -ar 48000 -c:a libopus -b:a 96k -vbr on -application audio -f ogg "${out}"`)
    const buf = fs.readFileSync(out)
    try { fs.unlinkSync(inp) } catch {}
    try { fs.unlinkSync(out) } catch {}
    return buf
}

function generateWaveform(audioBuf, samples = 64) {
    const waveform = new Uint8Array(samples)
    const chunkSize = Math.floor(audioBuf.length / samples)
    for (let i = 0; i < samples; i++) {
        const offset = i * chunkSize
        let sum = 0
        const len = Math.min(chunkSize, audioBuf.length - offset)
        for (let j = 0; j < len; j++) {
            sum += Math.abs(audioBuf[offset + j] - 128)
        }
        waveform[i] = Math.min(255, Math.floor((sum / len) * 2.5))
    }
    return waveform
}

async function handler(m, { sock }) {
    const args = m.text?.replace(/^\.رفع_قناة\s+/i, '').split(" ") || []
    const chId = args[0]?.includes("@newsletter") ? args.shift() : config?.saluran?.id
    const chName = config?.saluran?.name || config?.bot?.name || "Maro-AI"
    const caption = args.join(" ").trim()

    const quoted = m.quoted || m
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
    const isVideo = m.isVideo || (m.quoted && m.quoted.type === 'videoMessage')
    const isAudio = m.type === 'audioMessage' || (m.quoted && m.quoted.type === 'audioMessage')
    const isMedia = isImage || isVideo || isAudio

    if (!isMedia && !caption) {
        return m.reply(
            `📤 *رفع إلى القناة*\n\n` +
            `أرسل/رد على وسائط مع تعليق:\n` +
            `  \`${m.prefix}رفع_قناة 12xxx@newsletter <نص اختياري>\`\n\n` +
            `*الوسائط المدعومة:*\n` +
            `  🖼️ صورة\n` +
            `  🎥 فيديو\n` +
            `  🎵 صوت/رسالة صوتية\n` +
            `  📝 نص (بدون وسائط)`
        )
    }

    await m.react("🕕")

    try {
        if (!isMedia && caption) {
            await sock.sendMessage(chId, { text: caption })
            await m.react("✅")
            return m.reply(`✅ تم إرسال النص إلى القناة بنجاح`)
        }

        const mediaBuf = await downloadMediaMessage(quoted, "buffer", {})
        if (!mediaBuf || mediaBuf.length < 1000) throw new Error("الوسائط صغيرة جداً أو فشل التحميل")

        if (isImage) {
            await sock.sendMessage(chId, {
                image: mediaBuf,
                caption: caption || undefined
            })
            await m.react("✅")
            return m.reply("✅ تم إرسال الصورة إلى القناة بنجاح")
        }

        if (isVideo) {
            await sock.sendMessage(chId, {
                video: mediaBuf,
                caption: caption || undefined
            })
            await m.react("✅")
            return m.reply("✅ تم إرسال الفيديو إلى القناة بنجاح")
        }

        if (isAudio) {
            const opusBuf = await toOggOpus(mediaBuf)
            if (opusBuf.length < 5000) throw new Error("فشل تحويل الصوت إلى Opus")
            const waveform = generateWaveform(opusBuf)
            await sock.sendMessage(chId, {
                audio: opusBuf,
                mimetype: "audio/ogg; codecs=opus",
                ptt: true,
                waveform: Array.from(waveform)
            })
            await m.react("✅")
            return m.reply("✅ تم إرسال الصوت إلى القناة بنجاح")
        }

        m.reply("❌ نوع الوسائط غير مدعوم")
    } catch (e) {
        console.error("[رفع_قناة]", e)
        await m.react("☢")
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }