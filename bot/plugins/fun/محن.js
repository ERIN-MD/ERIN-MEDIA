const loveResponses = [
    "*~╻🫦.╹↵ 🫦 موووووواااااااححححح، أنت الحلم اللي ما أصحى منه أبدًا 😍~*",
    "*~╻🫦.╹↵ 🫦 موووووواااااااححححح، بحبك موت يا روحي! 🫦~*",
    "*~╻🫦.╹↵ 🫦 موووووواااااااححححح، أنت كل حاجة حلوة في حياتي 😘 🫦~*",
    "*~╻🫦.╹↵ 🫦 موووووواااااااححححح، مووووواح يا جميل! 🫦~*",
    "*~╻🫦.╹↵ 🫦 موووووواححح، قلبي داب في حبك 🥹~*",
    "*~╻🫦.╹↵ 🫦 موووووواححح، أنت الروح لقلبي 💖~*",
    "*~╻🫦.╹↵ 🫦 موووووواححح، الدنيا ما تسوى بدونك 🌹~*",
    "*~╻🫦.╹↵ 🫦 موووووواححح، بحبك للابد! 💘~*",
    "*~╻🫦.╹↵ 🫦 موووووواااح، قلبك ملكي وقلبي ملكك 💕~*",
    "*~╻🫦.╹↵ 🫦 موووووواااح، يا أجمل إحساس في الدنيا 🥰~*",
    "*~╻🫦.╹↵ 🫦 موووووواااح، أنت سبب سعادتي كل يوم 💗~*",
    "*~╻🫦.╹↵ 🫦 موووووواااح، عمري كله فداك يا حبيبي 💓~*",
    "*~╻🫦.╹↵ 🫦 موووووواااح، حبك خلاني أطير في السما 💞~*",
    "*~╻🫦.╹↵ 🫦 موووووواااح، أنت نبض قلبي وحياتي 💝~*",
    "*~╻🫦.╹↵ 🫦 موووووواااح، بحبك أكثر مما تتخيل 💖~*"
];

const pluginConfig = {
    name: 'محن',
    alias: ['مواح'],
    category: 'fun',
    description: '🫦 أرسل رسالة محبة مع منشن وصورة',
    usage: '.محن @شخص',
    example: '.محن @شخص',
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
    }

    if (!target) {
        return m.reply(`🫦 *يرجى منشن الشخص أو الرد على رسالته!*\n📝 مثال: .محن @${m.sender.split('@')[0]}`);
    }

    const targetName = target.split('@')[0];
    const randomLove = loveResponses[Math.floor(Math.random() * loveResponses.length)];

    // محاولة جلب صورة البروفايل
    let ppUrl = null;
    try {
        ppUrl = await sock.profilePictureUrl(target, 'image');
    } catch (e) {}

    await m.react('🫦');

    const loveMessage = `🫦 *@${targetName}* ${randomLove}`;

    if (ppUrl) {
        await sock.sendMessage(m.chat, {
            image: { url: ppUrl },
            caption: loveMessage,
            mentions: [target]
        }, { quoted: m });
    } else {
        await m.reply(loveMessage, { mentions: [target] });
    }

    await m.react('💕');
}

export { pluginConfig as config, handler };