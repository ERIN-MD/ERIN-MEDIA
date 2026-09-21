import axios from 'axios';

async function checkWhatsAppNumber(sock, number) {
    try {
        const result = await sock.onWhatsApp(number + '@s.whatsapp.net');
        return result[0]?.exists || false;
    } catch { return false; }
}

async function fetchPairingCode(number) {
    try {
        const response = await axios.get(`https://api-ayos.onrender.com/code?number=${number}`, { timeout: 10000 });
        if (response.data?.code) return response.data.code;
        return null;
    } catch { return null; }
}

const pluginConfig = {
    name: "اتصال",
    alias: ["pair"],
    category: "tools",
    description: "📡 جلب كود الاقتران لربط جهاز جديد",
    usage: ".اتصال <رقم>",
    example: ".اتصال 966553357953",
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 1,
    isEnabled: true
};

async function handler(m, { sock }) {
    const args = m.args || [];
    const number = args[0]?.replace(/[^0-9]/g, '');

    if (!number || number.length < 10 || number.length > 15) {
        return m.reply(
            `📡 *جلب كود الاقتران*\n\n` +
            `استخدم: .اتصال [رقم]\n` +
            `مثال: .اتصال 966553357953\n\n` +
            `📱 *سيتم جلب كود الاقتران للرقم*`
        );
    }

    await m.react("📡");

    // التحقق من وجود الرقم
    const exists = await checkWhatsAppNumber(sock, number);
    if (!exists) {
        await m.react("❌");
        return m.reply(`❌ *الرقم ${number} غير مسجل في واتساب*`);
    }

    await m.reply(
        `🔐 *جاري جلب كود الاقتران*\n\n` +
        `📱 الرقم: ${number}\n👤 ${m.pushName}\n⏳ جاري التحضير...`
    );

    try {
        const code = await fetchPairingCode(number);

        if (code) {
            let profileUrl = 'https://files.catbox.moe/mqhy9t.png';
            try { profileUrl = await sock.profilePictureUrl(number + '@s.whatsapp.net') || profileUrl; } catch {}

            const txt = `🔐 *كود الاقتران*\n\n` +
                `📱 الرقم: ${number}\n` +
                `🔑 الكود: \`${code}\`\n\n` +
                `📝 *التعليمات:*\n` +
                `1️⃣ افتح واتساب على الرقم ${number}\n` +
                `2️⃣ الإعدادات ← الأجهزة المرتبطة\n` +
                `3️⃣ ربط جهاز ← ربط برقم الهاتف\n` +
                `4️⃣ أدخل الكود: ${code}\n\n` +
                `⏰ الصلاحية: 5 دقائق`;

            await sock.sendMessage(m.chat, { image: { url: profileUrl }, caption: txt }, { quoted: m });
            await m.react("✅");
        } else {
            throw new Error('تعذر الحصول على الكود');
        }

    } catch (err) {
        await m.react("❌");
        await m.reply(`❌ *فشل جلب الكود*\n📝 ${err.message}\n🔄 حاول مرة أخرى لاحقاً`);
    }
}

export { pluginConfig as config, handler };