import config from '../../config.js'
import os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'
const execAsync = promisify(exec);

const pluginConfig = {
    name: 'النظام',
    alias: ['system'],
    category: 'main',
    description: 'عرض معلومات النظام (رام، معالج، قرص، سرعة)',
    usage: '.النظام',
    isGroup: false,
    isBotAdmin: false,
    isAdmin: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
};

function formatSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

async function getDiskUsage() {
    try {
        if (process.platform === 'win32') {
            const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption');
            const lines = stdout.trim().split('\n').slice(1);
            return lines.map(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 3) {
                    const caption = parts[0];
                    const free = parseInt(parts[1]);
                    const size = parseInt(parts[2]);
                    const used = size - free;
                    return `💿 *القرص ${caption}*\nالإجمالي: ${formatSize(size)}\nالمستخدم: ${formatSize(used)}\nالمتبقي: ${formatSize(free)}\n`;
                }
                return null;
            }).filter(Boolean).join('\n');
        } else {
            const { stdout } = await execAsync('df -h /');
            const lines = stdout.trim().split('\n');
            const parts = lines[1].replace(/\s+/g, ' ').split(' ');
            return `💿 *استخدام القرص*\nالإجمالي: ${parts[1]}\nالمستخدم: ${parts[2]}\nالمتبقي: ${parts[3]}\nنسبة الاستخدام: ${parts[4]}`;
        }
    } catch (e) {
        return '❌ فشل في جلب معلومات القرص';
    }
}

async function handler(m, { sock }) {
    const command = m.command.toLowerCase();

    try {
        if (command === 'النظام' || command === 'system') {
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            const cpus = os.cpus();
            const model = cpus[0].model;
            const speed = cpus[0].speed;
            const cores = cpus.length;
            const uptime = os.uptime();
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            const uptimeStr = `${hours}س ${minutes}د ${seconds}ث`;
            const diskInfo = await getDiskUsage();

            const text = `🖥️ *معلومات النظام*\n\n` +
                         `💻 *الرام*\n` +
                         `الإجمالي: ${formatSize(totalMem)}\n` +
                         `المستخدم: ${formatSize(usedMem)}\n` +
                         `المتبقي: ${formatSize(freeMem)}\n\n` +
                         `🖥️ *المعالج*\n` +
                         `الموديل: ${model}\n` +
                         `السرعة: ${speed} MHz\n` +
                         `الأنوية: ${cores}\n` +
                         `مدة تشغيل السيرفر: ${uptimeStr}\n\n` +
                         `${diskInfo}\n\n` +
                         `المنصة: ${os.platform()} (${os.arch()})`;

            m.reply(text);
        }
    } catch (e) {
        console.error('خطأ في بلوقن النظام:', e);
        m.reply('❌ حدث خطأ في جلب بيانات النظام.');
    }
}

export { pluginConfig as config, handler }