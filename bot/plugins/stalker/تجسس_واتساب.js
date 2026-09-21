// تجسس_واتساب - أمر للتجسس على ملف تعريف واتساب

import moment from 'moment-timezone'
import PhoneNum from 'awesome-phonenumber'
import config from '../../config.js'

const pluginConfig = {
    name: 'تجسس_واتساب',
    alias: ['wastalk'],
    category: 'stalker',
    description: 'التجسس على ملف تعريف واتساب',
    usage: '.تجسس_واتساب <الرقم/الإشارة>',
    example: '.تجسس_واتساب 6281234567890',
    isGroup: false,
    isBotAdmin: false,
    isAdmin: false,
    cooldown: 5,
    energi: 2,
    isEnabled: true
};

let regionNames = new Intl.DisplayNames(['ar'], {
    type: 'region'
});

async function handler(m, { sock }) {
    const text = m.text;
    let num = m.quoted?.sender || m.mentionedJid?.[0] || text;
    console.log(num)
    if (!num) {
        return m.reply(`مثال: ${m.prefix}${m.command} @إشارة / 628xxx`);
    }

    num = num.replace(/\D/g, '') + '@s.whatsapp.net';

    try {
        const onWa = await sock.onWhatsApp(num);
        if (!onWa || !onWa[0]?.exists) {
            return m.reply('❌ المستخدم غير موجود على واتساب');
        }

        let img = 'https://telegra.ph/file/70e8de9b1879568954f09.jpg';
        try {
            img = await sock.profilePictureUrl(num, 'image');
        } catch (e) {}

        let bio = {};
        try {
            bio = await sock.fetchStatus(num);
        } catch (e) {}

        let name = 'غير معروف';
        try {
            name = await sock.getName(num) || num.split('@')[0];
        } catch (e) {}

        let business = null;
        try {
            business = await sock.getBusinessProfile(num);
        } catch (e) {}

        let format, country;
        try {
            format = PhoneNum(`+${num.split('@')[0]}`);
            if (!format.isValid()) {
                console.log('PhoneNum invalid for:', num);
            }
            country = regionNames.of(format.getRegionCode('mobile'));
        } catch (e) {
            format = null;
            country = 'غير معروف';
        }

        const formattedNumber = format ? format.getNumber('international') : num.split('@')[0];

        // ترجمة أيام الأسبوع والأشهر
        moment.locale('ar');

        let res = `\t\t\t\t*▾ واتساب ▾*\n\n` +
                  `*° البلد :* ${country ? country.toUpperCase() : '-'}\n` +
                  `*° الاسم :* ${name}\n` +
                  `*° الرقم المنسق :* ${formattedNumber}\n` +
                  `*° رابط API :* wa.me/${num.split('@')[0]}\n` +
                  `*° الإشارة :* @${num.split('@')[0]}\n` +
                  `*° الحالة :* ${bio?.status || '-'}\n` +
                  `*° تاريخ الحالة :* ${bio?.setAt ? moment(bio.setAt).tz('Asia/Jakarta').format('LLLL') : '-'}\n\n`;

        if (business) {
            res += `\t\t\t\t*▾ معلومات العمل ▾*\n\n` +
                   `*° معرف العمل :* ${business.wid}\n` +
                   `*° الموقع الإلكتروني :* ${business.website ? business.website : '-'}\n` +
                   `*° البريد الإلكتروني :* ${business.email ? business.email : '-'}\n` +
                   `*° التصنيف :* ${business.category}\n` +
                   `*° العنوان :* ${business.address ? business.address : '-'}\n` +
                   `*° المنطقة الزمنية :* ${business.business_hours?.timezone ? business.business_hours.timezone : '-'}\n` +
                   `*° الوصف :* ${business.description ? business.description : '-'}`;
        } else {
            res += '*حساب واتساب عادي*';
        }

        // إرسال مع بطاقة Meta
        await sock.sendMessage(m.chat, {
            image: { url: img },
            caption: res,
            mentions: [num],
            contextInfo: {
                externalAdReply: {
                    title: `📱 ${name}`,
                    body: formattedNumber,
                    thumbnailUrl: img,
                    sourceUrl: `wa.me/${num.split('@')[0]}`,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    showAdAttribution: true
                }
            }
        }, { quoted: m });

    } catch (e) {
        console.error('WaStalk Error:', e);
        m.reply('❌ فشل التجسس على المستخدم.');
    }
}

export { pluginConfig as config, handler }