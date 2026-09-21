// إيقاف الجدولة - أمر لإيقاف جدولة معينة أو الكل

import { stopSchedulerByName, getFullSchedulerStatus } from '../../src/lib/maro-scheduler.js'
import { stopSholatScheduler } from '../../src/lib/maro-sholat-scheduler.js'
import { getDatabase } from '../../src/lib/maro-database.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'إيقاف_الجدولة',
    alias: ['stopschedule'],
    category: 'owner',
    description: 'إيقاف جدولة معينة أو الكل',
    usage: '.إيقاف_الجدولة <الاسم|الكل>',
    example: '.إيقاف_الجدولة صلاة',
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
            const helpText = `🛑 *إيقاف الجدولة*

*طريقة الاستخدام:*
\`.إيقاف_الجدولة <الاسم>\`

*الجداول المتاحة:*
• \`الحدود\` - إعادة تعيين الحد اليومي
• \`المجموعات\` - جدولة المجموعات
• \`الإيجار\` - فحص الإيجار
• \`الرسائل\` - الرسائل المجدولة
• \`صلاة\` - جدولة الصلاة
• \`الكل\` - جميع الجداول

*مثال:*
\`.إيقاف_الجدولة صلاة\`
\`.إيقاف_الجدولة الكل\``;
            
            await m.reply(helpText);
            return;
        }
        
        if (target === 'sholat' || target === 'صلاة') {
            const db = getDatabase();
            const wasEnabled = db.setting('autoSholat');
            
            if (!wasEnabled) {
                await m.reply(`ℹ️ جدولة الصلاة معطلة بالفعل`);
                return;
            }
            
            stopSholatScheduler();
            db.setting('autoSholat', false);
            
            await m.reply(`🛑 *تم إيقاف الجدولة*

> الجدولة: *جدولة الصلاة*
> الحالة: ❌ متوقفة

_استخدم \`.بدء_الجدولة صلاة\` لإعادة التشغيل_`);
            return;
        }
        
        if (target === 'all' || target === 'الكل') {
            stopSholatScheduler();
            const db = getDatabase();
            db.setting('autoSholat', false);
        }
        
        const result = stopSchedulerByName(target);
        
        if (result.stopped) {
            await m.reply(`🛑 *تم إيقاف الجدولة*

> الجدولة: *${result.name}*
> الحالة: ❌ متوقفة

_استخدم \`.بدء_الجدولة ${target}\` لإعادة التشغيل_`);
        } else {
            await m.reply(`❌ الجدولة غير موجودة أو متوقفة بالفعل

استخدم \`.إيقاف_الجدولة\` لعرض قائمة الجداول`);
        }
    } catch (error) {
        console.error('[StopSchedule Error]', error);
        await m.reply(te(m.prefix, m.command, m.pushName));
    }
}

export { pluginConfig as config, handler }