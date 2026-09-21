// إيقاف - أمر لإيقاف تشغيل البوت

const pluginConfig = {
    name: 'إيقاف',
    alias: ['stop'],
    category: 'owner',
    description: 'إيقاف تشغيل البوت',
    usage: '.إيقاف',
    example: '.إيقاف',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    await m.reply('🛑 *جاري إيقاف البوت...*\n\n> تم إيقاف البوت. يجب تشغيله يدوياً من الطرفية.')
    console.log('Stopping via command...')
    
    // السماح بإرسال الرسالة قبل الخروج
    setTimeout(() => {
        process.exit(1) // Exit code 1 عادةً يوقف إعادة التشغيل التلقائي في الحلقات البسيطة
    }, 1000)
}

export { pluginConfig as config, handler }