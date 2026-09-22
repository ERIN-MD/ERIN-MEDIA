const pluginConfig = {
    name: 'مسح_الحضور',
    alias: ['hapusabsen'],
    category: 'group',
    description: 'حذف/إغلاق جلسة الحضور (للمشرفين فقط)',
    usage: '.مسح_الحضور',
    example: '.مسح_الحضور',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true,
    isAdmin: true
}

if (!global.absensi) global.absensi = {}

async function handler(m) {
    const chatId = m.chat
    
    if (!global.absensi[chatId]) {
        return m.reply(
            `❌ *لا يوجد حضور*\n\n` +
            `> لا توجد جلسة حضور في هذه المجموعة!`
        )
    }
    
    const absen = global.absensi[chatId]
    const totalPeserta = absen.peserta.length
    
    delete global.absensi[chatId]
    
    await m.reply(
        `✅ *تم إغلاق الحضور!*\n\n` +
        `السبب:\n` +
        `📝 ${absen.keterangan}\n` +
        `👥 إجمالي الحضور: ${totalPeserta}\n\n` +
        `تم حذف جلسة الحضور.`
    )
}

export { pluginConfig as config, handler }