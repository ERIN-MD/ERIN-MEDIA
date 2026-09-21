import axios from 'axios';

const pluginConfig = {
    name: "شخره",
    alias: ["تشخير"],
    category: "fun",
    description: "يرد بصوت ضحك وخخخ على شخص سواء بمنشن أو رد",
    usage: ".شخره @شخص أو .تشخير @شخص",
    example: ".شخره @شخص",
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
        const text = m.text?.trim() || '';
        const args = text.split(' ');

        // الحصول على المنشن أو الشخص المردود عليه
        const mentionedJid = m.mentionedJid?.[0];
        const quotedParticipant = m.quoted?.sender;
        const targetJid = mentionedJid || quotedParticipant;

        // تحديد عدد الخخخخ
        let count = 200;
        for (const word of args) {
            const num = parseInt(word);
            if (!isNaN(num) && num > 0) {
                count = Math.min(num, 500); // حد أقصى 500
                break;
            }
        }

        const laugh = 'خخ'.repeat(count);

        // تحميل الصوت
        const audioUrl = "https://files.catbox.moe/3hthc5.mp3";

        const audioResponse = await axios.get(audioUrl, {
            responseType: 'arraybuffer',
            timeout: 30000
        });

        const audioBuffer = Buffer.from(audioResponse.data);

        // إرسال الصوت
        await sock.sendMessage(m.chat, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: false,
            fileName: 'ضحكة.mp3'
        }, { quoted: m });

        // انتظار بسيط قبل إرسال النص
        await new Promise(resolve => setTimeout(resolve, 1000));

        // إرسال النص
        if (targetJid) {
            const tag = '@' + targetJid.split('@')[0];
            await sock.sendMessage(m.chat, {
                text: `${tag} ${laugh} 🗿`,
                mentions: [targetJid]
            }, { quoted: m });
        } else {
            await sock.sendMessage(m.chat, {
                text: `${laugh} 🗿`,
            }, { quoted: m });
        }

    } catch (err) {
        console.error("❌ خطأ في أمر شخره:", err);
        await m.reply(`❌ حدث خطأ: ${err.message}`);
    }
}

export { pluginConfig as config, handler };