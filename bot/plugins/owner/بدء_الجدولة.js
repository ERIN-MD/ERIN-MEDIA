// بدء الجدولة - أمر لإعادة تشغيل جدولة معينة أو الكل

import { startSchedulerByName, getFullSchedulerStatus } from '../../src/lib/maro-scheduler.js'
import { initSholatScheduler } from '../../src/lib/maro-sholat-scheduler.js'
import { getDatabase } from '../../src/lib/maro-database.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'بدء_الجدولة',
    alias: ['startschedule'],
    category: 'owner',
    description: 'إعادة تشغيل جدولة معينة أو الكل',
    usage: '.بدء_الجدولة <الاسم|الكل>',
    example: '.بدء_الجدولة صلاة',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

async function handler(m, { sock, args }) {
    try {
        const target = args[0]?.toLowerCase();
        
        if (!target) {
            const helpText = `▶️ *بدء الجدولة*

*طريقة الاستخدام:*
\`.بدء_الجدولة <الاسم>\`

*الجداول المتاحة:*
• \`الحدود\` - إعادة تعيين الحد اليومي
• \`المجموعات\` - جدولة المجموعات
• \`الإيجار\` - فحص الإيجار
• \`الرسائل\` - الرسائل المجدولة
• \`صلاة\` - جدولة الصلاة
• \`الكل\` - جميع الجداول

*مثال:*
\`.بدء_الجدولة صلاة\`
\`.بدء_الجدولة الكل\``;
            
            await m.reply(helpText);
            return;
        }
        
        if (target === 'sholat' || target === 'صلاة') {
            const db = getDatabase();
            const wasEnabled = db.setting('autoSholat');
            
            if (wasEnabled) {
                await m.reply(`ℹ️ جدولة الصلاة مفعلة بالفعل`);
                return;
            }
            
            initSholatScheduler(sock);
            db.setting('autoSholat', true);
            
            await m.reply(`▶️ *تم بدء الجدولة*

> الجدولة: *جدولة الصلاة*
> الحالة: ✅ مفعل

_سيتم إرسال إشعارات أوقات الصلاة إلى المجموعات التي فعلت هذه الميزة_`);
            return;
        }
        
        if (target === 'all' || target === 'الكل') {
            initSholatScheduler(sock);
            const db = getDatabase();
            db.setting('autoSholat', true);
        }
        
        const result = startSchedulerByName(target, sock);
        
        if (result.started) {
            await m.reply(`▶️ *تم بدء الجدولة*

> الجدولة: *${result.name}*
> الحالة: ✅ مفعل

_تم إعادة تشغيل الجدولة_`);
        } else {
            await m.reply(`❌ الجدولة غير موجودة أو مفعلة بالفعل

استخدم \`.بدء_الجدولة\` لعرض قائمة الجداول`);
        }
    } catch (error) {
        console.error('[StartSchedule Error]', error);
        await m.reply(te(m.prefix, m.command, m.pushName));
    }
}

export { pluginConfig as config, handler }