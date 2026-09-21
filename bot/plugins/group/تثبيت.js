const pluginConfig = {
    name: 'تثبيت',
    alias: ['pin'],
    category: 'group',
    description: 'تثبيت رسالة مهمة في المجموعة',
    usage: '.تثبيت (رد على رسالة)',
    example: '.تثبيت',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
};

async function handler(m, { sock, args }) {
    if (!m.quoted || !m.quoted.key || !m.quoted.key.id) {
        await m.reply(
            `⚠️ *خطأ*\n\n` +
            `> رد على الرسالة التي تريد تثبيتها!\n\n` +
            `*طريقة الاستخدام:*\n` +
            `> رد على رسالة → اكتب \`.تثبيت\`\n` +
            `> اختياري: \`.تثبيت 24\` (تثبيت 24 ساعة)`
        );
        return;
    }
    
    let duration = 86400;
    if (args && args.length > 0 && args[0]) {
        const hours = parseInt(args[0]);
        if (!isNaN(hours) && hours >= 1 && hours <= 720) {
            duration = hours * 3600;
        }
    }
    
    try {
        const pinKey = {
            remoteJid: m.chat,
            fromMe: m.quoted.key.fromMe || false,
            id: m.quoted.key.id,
            participant: m.quoted.key.participant || m.quoted.sender
        };
        
        await sock.sendMessage(m.chat, {
            pin: pinKey,
            type: 1,
            time: duration
        });
        
        const durationText = duration >= 86400 
            ? `${Math.floor(duration / 86400)} يوم` 
            : `${Math.floor(duration / 3600)} ساعة`;
        
        await m.reply(`✅ تم تثبيت الرسالة لمدة ${durationText}`, { mentions: [m.sender] })
        
    } catch (error) {
        await m.reply(
            `❌ *خطأ*\n\n` +
            `> فشل تثبيت الرسالة.\n` +
            `> _${error.message}_`
        );
    }
}

export { pluginConfig as config, handler }