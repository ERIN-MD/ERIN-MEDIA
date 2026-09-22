import { getFullSchedulerStatus, formatTimeRemaining, getMsUntilTime } from '../../src/lib/maro-scheduler.js'
import { initSholatScheduler, stopSholatScheduler } from '../../src/lib/maro-sholat-scheduler.js'
import { getDatabase } from '../../src/lib/maro-database.js'
import { getTodaySchedule, extractPrayerTimes } from '../../src/lib/maro-sholat-api.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'فحص_المجدول',
    alias: ['cekschedule'],
    category: 'owner',
    description: 'عرض حالة جميع المجدولات في البوت',
    usage: '.فحص_المجدول',
    example: '.فحص_المجدول',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

async function handler(m, { sock }) {
    try {
        const status = getFullSchedulerStatus();
        const db = getDatabase();
        const sholatEnabled = db.setting('autoSholat') || false;

        let text = `📊 *حالة المجدولات*\n\n`;

        for (const sched of status.schedulers) {
            const statusIcon = sched.running ? '✅' : '❌';
            text += `${statusIcon} *${sched.name}*\n`;
            text += `   └ المفتاح: \`${sched.key}\`\n`;
            text += `   └ ${sched.description}\n`;

            if (sched.lastRun && sched.lastRun !== '-' && sched.lastRun !== 'Never') {
                text += `   └ آخر تشغيل: ${sched.lastRun}\n`;
            }

            if (sched.stats) {
                if (sched.stats.totalResets) {
                    text += `   └ إجمالي التصفير: ${sched.stats.totalResets}\n`;
                }
                if (sched.stats.activeMessages !== undefined) {
                    text += `   └ نشط: ${sched.stats.activeMessages} | مرسل: ${sched.stats.totalSent}\n`;
                }
            }
            text += `\n`;
        }

        const sholatIcon = sholatEnabled ? '✅' : '❌';
        text += `${sholatIcon} *مجدول الصلاة*\n`;
        text += `   └ المفتاح: \`sholat\`\n`;
        text += `   └ إشعارات أوقات الصلاة (مباشر)\n`;

        if (sholatEnabled) {
            const kotaSetting = db.setting('autoSholatKota') || { id: '1301', nama: 'جاكرتا' };
            text += `   └ الموقع: ${kotaSetting.nama}\n`;

            try {
                const { schedule } = await getTodaySchedule(kotaSetting.id);
                const times = extractPrayerTimes(schedule);
                const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
                const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

                let nextSholat = null;
                let nextTime = null;

                for (const [name, time] of Object.entries(times)) {
                    if (time > currentTime && time !== '-') {
                        nextSholat = name.charAt(0).toUpperCase() + name.slice(1);
                        nextTime = time;
                        break;
                    }
                }

                if (!nextSholat) {
                    nextSholat = 'إمساك';
                    nextTime = times.imsak;
                }

                text += `   └ التالي: ${nextSholat} (${nextTime} WIB)\n`;
            } catch {
                text += `   └ _فشل في تحميل الجدول_\n`;
            }
        }

        text += `\n`;
        text += `━━━━━━━━━━━━━━━━━━━\n`;
        text += `✅ مفعل: ${status.summary.totalActive + (sholatEnabled ? 1 : 0)}\n`;
        text += `❌ معطل: ${status.summary.totalInactive + (!sholatEnabled ? 1 : 0)}\n\n`;

        text += `> استخدم \`.ايقاف_مجدول <المفتاح>\` للإيقاف\n`;
        text += `> استخدم \`.تشغيل_مجدول <المفتاح>\` للتشغيل`;

        await m.reply(text);
    } catch (error) {
        console.error('[فحص_المجدول خطأ]', error);
        await m.reply(te(m.prefix, m.command, m.pushName));
    }
}

export { pluginConfig as config, handler }