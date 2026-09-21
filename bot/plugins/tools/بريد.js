import axios from 'axios';

const pluginConfig = {
    name: 'بريد',
    alias: ['bared', 'tempmail'],
    category: 'tools',
    description: 'بريد إلكتروني مؤقت واستقبال الرسائل',
    usage: '.بريد | .بريد قائمة | .بريد رسائل <رقم>',
    example: '.بريد\n.بريد رسائل 0',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: true,
    cooldown: 5,
    energi: 1,
    isEnabled: true
};

const API_URL = 'https://zecora0.serv00.net/fake.php';
const sessions = {};

async function createRandomEmail() {
    const { data } = await axios.get(`${API_URL}?mail=random`, { timeout: 15000 });
    return data?.success ? data.email : null;
}

async function getMessages(email) {
    const { data } = await axios.get(`${API_URL}?mail=messages&email=${email}`, { timeout: 15000 });
    return data?.success ? data.messages : [];
}

async function handler(m, { sock, text, prefix }) {
    const input = text?.trim() || '';

    // إنشاء بريد عشوائي
    if (!input) {
        await m.react('📧');
        const email = await createRandomEmail();
        
        if (!email) {
            await m.react('❌');
            return m.reply('❌ فشل إنشاء البريد');
        }

        if (!sessions[m.sender]) sessions[m.sender] = [];
        sessions[m.sender].push(email);

        await m.reply(
            `📧 *بريد مؤقت*\n\n` +
            `📩 \`${email}\`\n\n` +
            `📌 للرسائل: \`${prefix}بريد رسائل ${sessions[m.sender].length - 1}\`\n` +
            `📋 للقائمة: \`${prefix}بريد قائمة\``
        );
        await m.react('✅');
        return;
    }

    // عرض القائمة
    if (input === 'قائمة') {
        const emails = sessions[m.sender] || [];
        if (!emails.length) return m.reply('📭 لا يوجد بريد. استخدم `.بريد`');
        
        let txt = `📧 *البريد (${emails.length})*\n\n`;
        emails.forEach((e, i) => txt += `${i}. \`${e}\`\n`);
        return m.reply(txt);
    }

    // عرض الرسائل
    if (input.startsWith('رسائل')) {
        const num = parseInt(input.split(' ')[1]);
        const emails = sessions[m.sender] || [];
        const email = emails[num];
        if (!email) return m.reply('❌ بريد غير موجود');

        await m.react('📩');
        const messages = await getMessages(email);
        
        if (!messages.length) {
            await m.react('📭');
            return m.reply(`📭 لا توجد رسائل في \`${email}\``);
        }

        let txt = `📩 *الرسائل (${messages.length})*\n\n`;
        messages.slice(0, 5).forEach((msg, i) => {
            txt += `*${i + 1}.* ${msg.subject || 'بدون عنوان'}\n`;
            txt += `👤 ${msg.from || 'مجهول'}\n`;
            txt += `📝 ${(msg.body_text || msg.body || '...').substring(0, 100)}\n\n`;
        });

        await m.reply(txt);
        await m.react('✅');
        return;
    }

    // حذف الكل
    if (input === 'حذف') {
        sessions[m.sender] = [];
        await m.react('🗑️');
        return m.reply('🗑️ تم حذف كل البريد');
    }

    return m.reply(`📧 *بريد*\n\n\`.بريد\` - بريد جديد\n\`.بريد قائمة\` - عرض الكل\n\`.بريد رسائل <رقم>\` - عرض الرسائل\n\`.بريد حذف\` - حذف الكل`);
}

export { pluginConfig as config, handler };