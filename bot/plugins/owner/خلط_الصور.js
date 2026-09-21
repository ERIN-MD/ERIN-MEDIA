// نظام خلط الصور المصغرة للردود - أمر لإدارة الصور العشوائية في الردود

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import config from '../../config.js';
import { getDatabase } from '../../src/lib/maro-database.js';
import te from '../../src/lib/maro-error.js';
import { prepareWAMessageMedia, generateWAMessageFromContent, generateWAMessage, jidNormalizedUser } from 'maro';

const pluginConfig = {
    name: 'خلط_الصور',
    alias: ['srt'],
    category: 'owner',
    description: 'نظام خلط الصور المصغرة للردود (SRT) لإرسال صور عشوائية تفاعلية في الردود',
    usage: '.خلط_الصور تشغيل',
    example: '.خلط_الصور تشغيل',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true
};

if (!global.srtSession) {
    global.srtSession = {};
}

const SHUFFLE_DIR = path.join(process.cwd(), 'assets', 'image', 'shuffle');

function countShuffleImages() {
    if (!fs.existsSync(SHUFFLE_DIR)) return 0;
    const files = fs.readdirSync(SHUFFLE_DIR);
    return files.filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg')).length;
}

async function handler(m, { sock, args }) {
    try {
        const db = getDatabase();
        const action = args[0]?.toLowerCase();

        if (!action) {
            return m.reply(`🛠️ *نظام خلط الصور المصغرة للردود (SRT)*\n\nمرحباً بك في قائمة إدارة الصور التلقائية للردود. يتيح لك هذا النظام للبوت الرد بصور *مصغرة* عشوائية من مجموعة تقوم بتخزينها.\n\nقائمة الأوامر المتاحة:\n- *.خلط_الصور تشغيل* : تفعيل ميزة الخلط بشكل عام.\n- *.خلط_الصور إيقاف* : تعطيل ميزة الخلط والعودة إلى الإعدادات الافتراضية.\n- *.خلط_الصور إضافة* : فتح جلسة التقاط الصور لإضافة مجموعة جديدة إلى قاعدة البيانات.\n- *.خلط_الصور إنهاء* : إغلاق جلسة التقاط الصور.\n- *.خلط_الصور قائمة* : عرض جميع الصور المخزنة في قاعدة بيانات البوت.`);
        }

        if (action === 'on' || action === 'تشغيل') {
            db.setting('srtEnabled', true);
            await m.reply('✅ *تم تفعيل ميزة خلط الصور*\n\nتم تفعيل الميزة بشكل عام. كل ردود البوت التي تدعم *الصور المصغرة* ستعرض الآن صورة عشوائية من مجلد الخلط الذي تم تجميعه.');
        } 
        else if (action === 'off' || action === 'إيقاف') {
            db.setting('srtEnabled', false);
            await m.reply('❌ *تم تعطيل ميزة خلط الصور*\n\nتم إيقاف استخدام *الصور المصغرة* العشوائية. ستعود جميع ردود البوت إلى استخدام الصور *الافتراضية* للنظام.');
        } 
        else if (action === 'c' || action === 'capture' || action === 'إضافة') {
            global.srtSession[m.chat] = { sender: m.sender, count: 0 };
            const totalImages = countShuffleImages();
            await m.reply(`📸 *تم بدء جلسة التقاط الصور*\n\nأرسل الصور واحدة تلو الأخرى في هذه المحادثة. سيقوم البوت بقراءة كل صورة وحفظها تلقائياً في نظام *قاعدة بيانات الخلط*.\n\n- إجمالي الصور المخزنة حالياً: *${totalImages}*\n- عندما تنتهي من إرسال جميع الصور، أوقف الجلسة باستخدام الأمر \`${m.prefix}خلط_الصور إنهاء\`.`);
        } 
        else if (action === 'd' || action === 'done' || action === 'إنهاء') {
            if (!global.srtSession[m.chat] || global.srtSession[m.chat].sender !== m.sender) {
                return m.reply('❌ أنت لست في جلسة التقاط صور نشطة حالياً.');
            }
            const count = global.srtSession[m.chat].count;
            delete global.srtSession[m.chat];
            const totalImages = countShuffleImages();
            await m.reply(`✅ *تم إنهاء جلسة التقاط الصور*\n\nتم إيقاف الجلسة وتمت معالجة جميع الصور.\n- إجمالي الصور الجديدة المضافة: *${count}*\n- إجمالي الصور في النظام: *${totalImages}*`);
        } 
        else if (action === 'list' || action === 'قائمة') {
            if (!fs.existsSync(SHUFFLE_DIR)) return m.reply('❌ لا توجد صور مخزنة في مجلد *الخلط*. قم بالتقاط الصور أولاً.');
            const files = fs.readdirSync(SHUFFLE_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg'));
            if (files.length === 0) return m.reply('❌ مجلد *الخلط* فارغ. استخدم أمر التقاط الصور لبدء الإضافة.');
            
            await m.reply(`📂 *قائمة صور الخلط*\n\nوجد النظام *${files.length}* صورة مخزنة. جاري المعالجة وتجميع الألبوم للعرض، يرجى الانتظار قليلاً.`);
            
            try {
                const opener = generateWAMessageFromContent(
                    m.chat,
                    {
                        messageContextInfo: { messageSecret: crypto.randomBytes(32) },
                        albumMessage: {
                            expectedImageCount: files.length,
                            expectedVideoCount: 0,
                        },
                    },
                    {
                        userJid: jidNormalizedUser(sock.user.id),
                        quoted: m,
                        upload: sock.waUploadToServer,
                    }
                );

                await sock.relayMessage(opener.key.remoteJid, opener.message, {
                    messageId: opener.key.id,
                });

                for (let i = 0; i < files.length; i++) {
                    const imgPath = path.join(SHUFFLE_DIR, files[i]);
                    const imgBuffer = fs.readFileSync(imgPath);

                    const msg = await generateWAMessage(opener.key.remoteJid, { image: imgBuffer }, {
                        upload: sock.waUploadToServer,
                    });

                    msg.message.messageContextInfo = {
                        messageSecret: crypto.randomBytes(32),
                        messageAssociation: {
                            associationType: 1,
                            parentMessageKey: opener.key,
                        },
                    };

                    await sock.relayMessage(msg.key.remoteJid, msg.message, {
                        messageId: msg.key.id,
                    });
                }
            } catch (albumErr) {
                console.error('Album Error:', albumErr);
                return m.reply('❌ حدث خطأ أثناء إنشاء ألبوم الصور.');
            }
        } 
        else {
            await m.reply(`❌ الأمر "${action}" غير معروف.`);
        }
        
    } catch (error) {
        console.error('SRT List Error:', error);
        m.reply(te(m.prefix, m.command, m.pushName));
    }
}

async function srtAnswerHandler(m, sock) {
    if (!global.srtSession) return false;
    const session = global.srtSession[m.chat];
    if (!session || session.sender !== m.sender) return false;

    if (m.isCommand) return false;

    const isImage = m.isImage || (m.quoted && m.quoted.isImage);
    if (!isImage) return false;

    try {
        await m.react('🕕');
        let buffer;
        if (m.quoted && m.quoted.isImage) {
            buffer = await m.quoted.download();
        } else if (m.isImage) {
            buffer = await m.download();
        }

        if (buffer) {
            if (!fs.existsSync(SHUFFLE_DIR)) fs.mkdirSync(SHUFFLE_DIR, { recursive: true });
            
            const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 10);
            const ext = '.jpg';
            const filename = `srt_${hash}${ext}`;
            const filepath = path.join(SHUFFLE_DIR, filename);

            if (fs.existsSync(filepath)) {
                await m.reply('⚠️ هذه الصورة موجودة بالفعل في قاعدة البيانات.');
            } else {
                fs.writeFileSync(filepath, buffer);
                session.count++;
                await m.reply(`✅ *تم حفظ الصورة بنجاح*\n\nتم حفظ الصورة في تخزين البوت المحلي.\n- إجمالي الصور المضافة في هذه الجلسة: *${session.count}*`);
            }
        }
        await m.react('✅');
        return true;
    } catch (e) {
        await m.react('❌');
        await m.reply('❌ حدث خطأ أثناء تحميل وحفظ الصورة.');
        return true;
    }
}

export { pluginConfig as config, handler, srtAnswerHandler };