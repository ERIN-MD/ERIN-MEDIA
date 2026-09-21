import config from '../../config.js'
const pluginConfig = {
    name: 'مميزات_الشريك',
    alias: ['benefitpartner'],
    category: 'info',
    description: 'عرض مميزات الشريك للبوت',
    usage: '.مميزات_الشريك',
    example: '.مميزات_الشريك',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m) {

    const prefix = m.prefix || '.'

    let txt = `🤝 *مميزات الشريك*\n\n`
    txt += `مميزات أن تكون شريكاً لـ ${config.bot?.name || 'البوت'}:\n\n`

    txt += `🔓 *الوصول للمميزات*\n`
    txt += `├ جميع مميزات البريميوم متاحة\n`
    txt += `├ طاقة وعملات غير محدودة\n`
    txt += `├ الوصول لبعض أوامر المالك\n`
    txt += `└ أولوية في الدعم\n\n`

    txt += `📦 *لوحة التحكم*\n`
    txt += `├ يمكنك إنشاء سيرفر خاص\n`
    txt += `├ الوصول للوحة الإدارة\n`
    txt += `└ يمكنك بيع السيرفرات (موزع)\n\n`

    txt += `💎 *مكافآت*\n`
    txt += `├ +200.000 خبرة عند التفعيل\n`
    txt += `├ +20.000 عملة عند التفعيل\n`
    txt += `├ شارة شريك في الملف\n`
    txt += `└ وصول مبكر للمميزات الجديدة\n\n`

    txt += `💰 *كيف تصبح شريكاً*\n`
    txt += `├ تواصل مع المالك: ${config.owner?.name || 'المالك'}\n`
    txt += `├ المدة: 30/60/90 يوم\n`
    txt += `└ الأمر: \`${prefix}اضافة_شريك\` (للمالك فقط)\n\n`

    txt += `📋 *أوامر الشريك*\n`
    txt += `├ \`${prefix}تحقق_الشريك\` — التحقق من حالة الشريك\n`
    txt += `├ \`${prefix}تحقق_المميز\` — التحقق من حالة البريميوم\n`
    txt += `├ \`${prefix}تحقق_المالك\` — التحقق من الرتبة\n`
    txt += `└ \`${prefix}قائمة_الشركاء\` — قائمة الشركاء\n\n`

    txt += `> _تواصل مع المالك للمزيد من المعلومات_`

    await m.reply(txt)
}

export { pluginConfig as config, handler }