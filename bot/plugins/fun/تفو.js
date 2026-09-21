import axios from 'axios';

const pluginConfig = {
    name: "تفو",
    alias: ["بصق"],
    category: "fun",
    description: "يرسل صوت تفو وبعدها رسالة تفووو مع منشن",
    usage: ".تفو @شخص",
    example: ".تفو @شخص",
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

async function handler(m, { sock }) {
    try {
        const mentionedJid = m.mentionedJid?.[0];
        const quotedParticipant = m.quoted?.sender;
        const targetJid = mentionedJid || quotedParticipant;

        const audioUrl = "https://files.catbox.moe/ev6s83.mp3";

        const audioResponse = await axios.get(audioUrl, {
            responseType: 'arraybuffer',
            timeout: 30000
        });

        const audioBuffer = Buffer.from(audioResponse.data);

        await sock.sendMessage(m.chat, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: false,
            fileName: 'تفو.mp3'
        }, { quoted: m });

        await new Promise(resolve => setTimeout(resolve, 1000));

        if (targetJid) {
            const tag = '@' + targetJid.split('@')[0];
            await sock.sendMessage(m.chat, {
                text: `😠 ${tag} تـــفـــوووووووو 💦`,
                mentions: [targetJid]
            });
        } else {
            await sock.sendMessage(m.chat, {
                text: `😠 تـــفـــوووووووو 💦`,
            });
        }

    } catch (err) {
        console.error("❌ خطأ في أمر تفو:", err);
    }
}

export { pluginConfig as config, handler };