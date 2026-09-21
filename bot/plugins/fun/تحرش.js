const flirtQuotes = [
    "🫦 هل أنتِ قمر؟ لأنك تنيرين طريقي.",
    "🫦 هل أنتِ بحر؟ لأني أغرق في تأملكِ.",
    "🫦 هل أنتِ وردة؟ لأنكِ تملئين عالمي بعطركِ.",
    "🫦 هل أنتِ نجم؟ لأنك تضيئين سمائي.",
    "🫦 هل أنتِ الشمس؟ لأنكِ تمنحينني الدفء.",
    "🫦 هل أنتِ غيمة؟ لأنكِ تلطفين كل لحظة.",
    "🫦 هل أنتِ ملاك؟ لأنكِ تملئين حياتي بالنور.",
    "🫦 هل أنتِ فراشة؟ لأنكِ ترفرفين في كل مكان.",
    "🫦 هل أنتِ عصفورة؟ لأنكِ تجعلين حياتي مليئة بالألحان.",
    "🫦 هل أنتِ نجمة؟ لأنكِ تلمعين في سماء عمري.",
    "🫦 هل انتِ وردة؟ لأن انفاسكِ تذيبني.",
    "🫦 هل أنتِ زهرة؟ لأنكِ تفتحي في قلبي كل يوم.",
    "🫦 هل أنتِ أغنية؟ لأنكِ تغنين قلبي بكل لحظة.",
    "🫦 هل أنتِ عيون؟ لأنني لا أستطيع أن أراها سوى فيكِ.",
    "🫦 هل أنتِ شمس؟ لأنكِ تسطعين في كل يوم في حياتي.",
    "🫦 هل أنتِ لؤلؤة؟ لأنكِ تتألقين في البحر.",
    "🫦 هل أنتِ برق؟ لأنكِ تضيئين السماء.",
    "🫦 هل أنتِ سكر؟ لأنكِ تجعلينني أذوب فيكِ.",
    "🫦 هل أنتِ قهوة؟ لأنني أحتاجكِ لتستفزيني.",
    "🫦 هل أنتِ نار؟ لأنكِ تشعلينني بحبكِ.",
    "🫦 هل أنتِ عطر؟ لأنكِ تعطرين حياتي بكل لحظة.",
    "🫦 هل أنتِ حلم؟ لأنني لا أريد أن أستيقظ منكِ."
];

const pluginConfig = {
    name: 'تحرش',
    alias: ['غزل'],
    category: 'fun',
    description: '💕 أرسل رسالة غزل عشوائية لشخص محدد',
    usage: '.تحرش @شخص',
    example: '.تحرش @شخص',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

async function handler(m, { sock }) {
    let target = null;

    if (m.quoted) {
        target = m.quoted.sender;
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
        target = m.mentionedJid[0];
    } else if (m.args.length > 0) {
        const num = m.args[0].replace(/[@!]/g, '');
        if (num.length > 5) target = `${num}@s.whatsapp.net`;
    }

    if (!target) {
        return m.reply(`❌ استخدم الأمر مع منشن أو رد على رسالة!\n📝 مثال: *.تحرش @${m.sender.split('@')[0]}*`);
    }

    await m.react("💕");

    const randomQuote = flirtQuotes[Math.floor(Math.random() * flirtQuotes.length)];
    const targetName = target.split('@')[0];

    // محاولة جلب صورة البروفايل
    let ppUrl = null;
    try {
        ppUrl = await sock.profilePictureUrl(target, 'image');
    } catch (e) {}

    const loveMessage = `💕 *@${targetName}*, ${randomQuote}`;

    if (ppUrl) {
        await sock.sendMessage(m.chat, {
            image: { url: ppUrl },
            caption: loveMessage,
            mentions: [target, m.sender]
        }, { quoted: m });
    } else {
        await m.reply(loveMessage, { mentions: [target, m.sender] });
    }

    await m.react("✅");
}

export { pluginConfig as config, handler };