import te from '../../src/lib/maro-error.js'

function extractNumbers(text) {
    if (!text) return [];
    let cleaned = text.replace(/[^0-9+\s]/g, ' ');
    const numbers = [];
    let currentNumber = '';
    for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i];
        if (char >= '0' && char <= '9') { currentNumber += char; }
        else if (char === ' ' || char === '+') { if (currentNumber.length >= 8) { numbers.push(currentNumber); currentNumber = ''; } }
    }
    if (currentNumber.length >= 8) { numbers.push(currentNumber); }
    return [...new Set(numbers)].filter(n => n.length >= 8 && n.length <= 18);
}

function cleanNumber(number) { return String(number).replace(/[^0-9]/g, ''); }
function isValidNumber(number) { const cleaned = cleanNumber(number); return cleaned.length >= 8 && cleaned.length <= 18; }

async function addSingleMember(sock, groupId, number) {
    const cleanNum = cleanNumber(number);
    if (!isValidNumber(cleanNum)) { return { success: false, number: cleanNum, error: 'رقم غير صالح' }; }
    try {
        const jid = cleanNum + '@s.whatsapp.net';
        const check = await sock.onWhatsApp(jid);
        if (!check || check.length === 0 || !check[0].exists) { return { success: false, number: cleanNum, error: 'غير مسجل في واتساب' }; }
        const response = await sock.groupParticipantsUpdate(groupId, [jid], 'add');
        if (response && response[0] && response[0].status === '200') { return { success: true, number: cleanNum }; }
        else if (response && response[0] && response[0].status === '409') { return { success: false, number: cleanNum, error: 'العضو موجود بالفعل' }; }
        else if (response && response[0] && response[0].status === '403') { return { success: false, number: cleanNum, error: 'إعدادات خصوصية تمنع الإضافة', inviteRequired: true, jid: jid }; }
        else { return { success: false, number: cleanNum, error: 'فشل الإضافة' }; }
    } catch (error) {
        const errMsg = error.message || 'خطأ غير معروف';
        if (errMsg.includes('not-a-participant') || errMsg.includes('403')) { return { success: false, number: cleanNum, error: 'إعدادات خصوصية تمنع الإضافة', inviteRequired: true, jid: cleanNum + '@s.whatsapp.net' }; }
        else if (errMsg.includes('already')) { return { success: false, number: cleanNum, error: 'العضو موجود بالفعل' }; }
        return { success: false, number: cleanNum, error: errMsg };
    }
}

const pluginConfig = {
    name: 'اضف',
    alias: ['add'],
    category: 'group',
    description: '👥 إضافة أعضاء إلى المجموعة (يدعم الرد على رسالة)',
    usage: '.اضف <رقم1> <رقم2> ... أو رد على رسالة تحتوي أرقام',
    example: '.اضف 201034648449',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

async function handler(m, { sock }) {
    const quoted = m.quoted || null;
    let numbersList = [];

    if (quoted) {
        const quotedText = quoted.body || m.body?.trim() || '';
        numbersList = extractNumbers(quotedText);
    } else if (m.args.length > 0) {
        const inputText = m.args.join(' ');
        numbersList = extractNumbers(inputText);
    } else {
        return m.reply(
            `👥 *إضافة الأعضاء*\n\n` +
            `📝 *طريقة الاستخدام:*\n\n` +
            `1️⃣ *الرد على رسالة:*\n` +
            `   قم بالرد على رسالة تحتوي على أرقام\n` +
            `   واكتب: .اضف\n\n` +
            `2️⃣ *كتابة الأرقام:*\n` +
            `   .اضف 201034648449\n` +
            `   .اضف +20 10 19840859\n\n` +
            `💡 *يمكنك إضافة عدة أرقام مرة واحدة*`
        );
    }

    if (numbersList.length === 0) {
        return m.reply('❌ *لم يتم العثور على أرقام صالحة في النص*');
    }

    const MAX_ADD = 10;
    if (numbersList.length > MAX_ADD) numbersList = numbersList.slice(0, MAX_ADD);

    await m.react('⏳');
    await m.reply(`👥 *جاري إضافة الأعضاء...*\n📊 *عدد الأرقام:* ${numbersList.length}`);

    const results = { success: [], failed: [], inviteRequired: [] };

    for (const number of numbersList) {
        const result = await addSingleMember(sock, m.chat, number);
        if (result.success) results.success.push(result.number);
        else if (result.inviteRequired) results.inviteRequired.push({ number: result.number, jid: result.jid });
        else results.failed.push({ number: result.number, error: result.error });
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    let reportText = `📊 *تقرير إضافة الأعضاء*\n━━━━━━━━━━━━━━━━━━\n\n`;
    if (results.success.length > 0) { reportText += `✅ *تمت الإضافة:* ${results.success.length}\n`; reportText += results.success.map(n => `  • ${n}`).join('\n') + '\n\n'; }
    if (results.failed.length > 0) { reportText += `❌ *فشلت الإضافة:* ${results.failed.length}\n`; reportText += results.failed.map(f => `  • ${f.number}: ${f.error}`).join('\n') + '\n\n'; }
    if (results.inviteRequired.length > 0) { reportText += `🔗 *تحتاج رابط دعوة:* ${results.inviteRequired.length}\n`; reportText += results.inviteRequired.map(i => `  • ${i.number}`).join('\n') + '\n\n'; }
    reportText += `━━━━━━━━━━━━━━━━━━\n👤 *بواسطة:* ${m.pushName}`;

    await m.reply(reportText);

    if (results.inviteRequired.length > 0) {
        try {
            const inviteCode = await sock.groupInviteCode(m.chat);
            const groupMetadata = await sock.groupMetadata(m.chat);
            const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
            await m.reply(`🔗 *رابط دعوة*\n━━━━━━━━━━━━━━━━━━\n\n🏠 ${groupMetadata.subject}\n🔗 ${inviteLink}`);
        } catch (e) {}
    }

    await m.react(results.success.length > 0 ? '✅' : '❌');
}

export { pluginConfig as config, handler }