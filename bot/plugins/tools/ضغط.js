// ═══════════════════════════════════════════════
// 📁 plugins/tools/ضغط.js
// 🗜️ ضغط الصور والفيديوهات
// ═══════════════════════════════════════════════

import fs from "fs";
import { exec } from "child_process";
import crypto from "crypto";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
    name: 'ضغط',
    alias: ['kompres', 'compress'],
    category: 'tools',
    description: 'ضغط الصور والفيديوهات لتقليل الحجم',
    usage: '.ضغط (رد على صورة/فيديو)',
    example: '.ضغط',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 2,
    isEnabled: true,
};

async function handler(m, { sock }) {
    try {
        let q = m.quoted || m;
        
        // ✅ فحص النوع بطريقة صحيحة
        let msgTypes = Object.keys(q.message || {});
        let isImage = msgTypes.includes("imageMessage");
        let isVideo = msgTypes.includes("videoMessage");

        if (!isImage && !isVideo) {
            return m.reply("❌ رد على صورة أو فيديو لضغطه");
        }

        m.react("⏳");

        let buffer = await q.download();
        if (!buffer) return m.reply("❌ فشل تحميل الوسائط");

        let originalSizeMB = (buffer.length / (1024 * 1024)).toFixed(2);

        let input = `/tmp/${crypto.randomUUID()}`;
        let output = `/tmp/${crypto.randomUUID()}`;

        fs.writeFileSync(input, buffer);

        let cmd = "";

        if (isImage) {
            output += ".jpg";
            cmd = `ffmpeg -y -i "${input}" -map_metadata -1 -vf "scale=iw:ih" -q:v 8 "${output}"`;
        }

        if (isVideo) {
            output += ".mp4";
            cmd = `ffmpeg -y -i "${input}" -map_metadata -1 -vf "scale=iw:ih" -c:v libx264 -preset medium -crf 28 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k "${output}"`;
        }

        exec(cmd, async (err) => {
            fs.unlinkSync(input);

            if (err || !fs.existsSync(output)) {
                return m.reply("❌ فشل ضغط الوسائط");
            }

            let result = fs.readFileSync(output);
            let compressedSizeMB = (result.length / (1024 * 1024)).toFixed(2);

            if (isImage) {
                await sock.sendMessage(
                    m.chat,
                    { image: result, mimetype: "image/jpeg", caption: `📦 ${originalSizeMB}MB → 🗜️ ${compressedSizeMB}MB` },
                    { quoted: m }
                );
            } else {
                await sock.sendMessage(
                    m.chat,
                    { video: result, mimetype: "video/mp4", caption: `📦 ${originalSizeMB}MB → 🗜️ ${compressedSizeMB}MB` },
                    { quoted: m }
                );
            }

            m.react("✅");
            fs.unlinkSync(output);
        });

    } catch (e) {
        m.react("❌");
        m.reply(te(m.prefix, m.command, m.pushName));
    }
}

export { pluginConfig as config, handler };