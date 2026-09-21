import te from "../../src/lib/maro-error.js";
import config from '../../config.js';

const pluginConfig = {
    name: 'فيديو_دائري',
    alias: ['ptv'],
    category: 'tools',
    description: 'إرسال فيديو كـ PTV (فيديو دائري) مع معلومات القناة',
    usage: '.فيديو_دائري (رد على فيديو)',
    example: '.فيديو_دائري',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
};

async function handler(m, { sock }) {
    let video = null;
    const ownerName = config.owner?.name || 'Maro';
    const botName = config.bot?.name || 'Maro-AI';
    const channelName = config.saluran?.name || botName;
    const channelId = config.saluran?.id || '';
    
    if (m.quoted && m.quoted.isVideo) {
        try {
            video = await m.quoted.download();
        } catch (e) {
            return m.reply(`❌ فشل تحميل الفيديو من الرد.`);
        }
    } else if (m.isVideo) {
        try {
            video = await m.download();
        } catch (e) {
            return m.reply(`❌ فشل تحميل الفيديو.`);
        }
    }
    
    if (!video) {
        return m.reply(
            `⚠️ *طريقة الاستخدام*\n\n` +
            `> أرسل *فيديو* أو *رد على فيديو* ثم اكتب:\n` +
            `> \`${m.prefix}فيديو_دائري\``
        );
    }
    
    // رسالة وهمية
    const fakeQuote = {
        key: { fromMe: false, participant: "0@s.whatsapp.net", remoteJid: "status@broadcast" },
        message: { conversation: `${ownerName} | ${botName}` }
    };
    
    try {
        // إرسال الفيديو مع معلومات القناة
        await sock.sendMessage(m.chat, {
            video: video,
            mimetype: 'video/mp4',
            gifPlayback: true,
            ptv: true,
            caption: `> ${ownerName} | ${botName}`,
            contextInfo: {
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterName: channelName,
                    newsletterJid: channelId,
                    serverMessageId: -1
                }
            }
        }, { quoted: fakeQuote });
        
        m.react('✅');
        
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName));
    }
}

export { pluginConfig as config, handler };