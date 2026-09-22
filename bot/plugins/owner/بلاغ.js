const pluginConfig = {
    name: 'بلاغ',
    alias: ['report', 'تبليغ', 'spam'],
    category: 'owner',
    description: 'إرسال بلاغ عن بروفايل في واتساب',
    usage: '.بلاغ <lid/رد على رسالة>',
    example: '.بلاغ 123456789@s.whatsapp.net',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    let targetLid = null;
    
    // من الرد
    if (m.quoted?.key?.participant) {
        targetLid = m.quoted.key.participant;
    }
    
    // من النص
    if (m.text && m.text.includes('@s.whatsapp.net')) {
        targetLid = m.text.trim();
    }
    
    if (!targetLid) {
        return m.reply(
            `🚨 *تبليغ عن بروفايل*\n\n` +
            `📌 *الاستخدام:*\n` +
            `> \`${m.prefix}بلاغ <lid>\`\n` +
            `> \`${m.prefix}بلاغ\` (رد على رسالة)\n\n` +
            `📌 *مثال:*\n` +
            `> \`${m.prefix}بلاغ 123456789@s.whatsapp.net\``
        );
    }

    await m.react('🚨');

    try {
        await sock.query({
            tag: 'iq',
            attrs: {
                id: sock.generateMessageTag(),
                type: 'set',
                to: 's.whatsapp.net',
                xmlns: 'spam'
            },
            content: [{
                tag: 'spam_list',
                attrs: {
                    jid: targetLid,
                    spam_flow: 'account_info_report'
                }
            }]
        });

        await m.reply(`✅ *تم إرسال البلاغ*\n\n👤 *المستخدم:* \`${targetLid}\``);
        await m.react('✅');

    } catch (e) {
        await m.react('❌');
        await m.reply(`❌ *فشل البلاغ:* ${e.message}`);
    }
}

export { pluginConfig as config, handler };