import moment from 'moment-timezone'
import config from '../../config.js'
const pluginConfig = {
    name: 'حضور',
    alias: ['absen'],
    category: 'group',
    description: 'سجل حضورك في جلسة الحضور',
    usage: '.حضور',
    example: '.حضور',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}
if (!global.absensi) global.absensi = {}
async function handler(m, { sock }) {
    const chatId = m.chat
    if (!global.absensi[chatId]) {
        return m.reply(
            `❌ *لا يوجد حضور*\n\n` +
            `> لم تبدأ جلسة حضور بعد!\n\n` +
            `> يمكن للمشرف البدء بـ\n` +
            `> *.بدء_الحضور [وصف]*`
        )
    }
    const absen = global.absensi[chatId]
    if (absen.peserta.includes(m.sender)) {
        return m.reply(`❌ أنت سجلت حضورك بالفعل!`)
    }
    absen.peserta.push(m.sender)
    const now = moment().tz('Asia/Jakarta')
    const dateStr = now.format('D MMMM YYYY')
    const list = absen.peserta
        .map((jid, i) => `┃ ${i + 1}. @${jid.split('@')[0]}`)
        .join('\n')
    await m.reply(`✅ *رائع، @${m.sender.split('@')[0]} حاضر*\n` +
            `الهدف: ${absen.keterangan}\n` +
            `╭┈┈⬡「 📋 معلومات 」\n` +
            `┃ 📅 ${dateStr}\n` +
            `┃ 👥 المجموع: ${absen.peserta.length}\n` +
            `├┈┈⬡「 📝 *قائمة الحضور* 」\n` +
            `${list}\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> _اكتب *${m.prefix}حضور* للتسجيل_\n` +
            `> _اكتب *${m.prefix}تفقد_الحضور* للاطلاع على القائمة_`,
            { mentions: absen.peserta })
}
export { pluginConfig as config, handler }