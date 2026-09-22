import config from '../../config.js'

const pluginConfig = {
    name: 'انشاء_مجموعة',
    alias: ['buatgrup', 'create', 'creategc', 'makegc'],
    category: 'owner',
    description: 'إنشاء مجموعة جديدة',
    usage: '.انشاء_مجموعة <الاسم>|<رقم1,رقم2,...>|<المدة_بالدقائق>',
    example: '.انشاء_مجموعة مجموعة جديدة',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function cleanEgyptNumber(number) {
    let cleaned = number.toString().replace(/[^0-9]/g, '')
    if (cleaned.startsWith('62')) return null
    if (cleaned.length === 10 && cleaned.startsWith('1')) cleaned = '20' + cleaned
    if (cleaned.startsWith('0')) cleaned = '2' + cleaned
    if (cleaned.length < 10 || cleaned.length > 15) return null
    return cleaned
}

async function handler(m, { sock }) {
    const text = m.text?.trim() || ''
    const args = text.split('|')

    if (args.length < 1 || !args[0].trim()) {
        let txt = `👥 *إنشاء مجموعة جديدة* 👥\n\n`
        txt += `مرحباً مالك البوت! هل تريد إنشاء مجموعة جديدة بشكل فوري؟\n\n`
        txt += `*طريقة الاستخدام:*\n`
        txt += `👉 \`${m.prefix}انشاء_مجموعة اسم المجموعة\` _(بدون مشاركين)_\n`
        txt += `👉 \`${m.prefix}انشاء_مجموعة اسم المجموعة | 201xxx,201yyy\` _(مع مشاركين)_\n`
        txt += `👉 \`${m.prefix}انشاء_مجموعة اسم المجموعة | 201xxx,201yyy | 60\` _(مع مدة)_\n\n`
        txt += `*التفاصيل:*\n`
        txt += `• إنشاء المجموعة بدون مشاركين ← يرسل رابط الدعوة فقط\n`
        txt += `• استخدم \`|\` للفصل بين الاسم والمشاركين والمدة\n`
        txt += `• الأرقام الإندونيسية (62xxx) سيتم تجاهلها تلقائياً\n`
        txt += `• البوت يصبح مشرفاً تلقائياً\n\n`
        txt += `*مثال بدون مشاركين:*\n`
        txt += `\`${m.prefix}انشاء_مجموعة فريق ألفا\`\n\n`
        txt += `*مثال مع مشاركين:*\n`
        txt += `\`${m.prefix}انشاء_مجموعة فريق ألفا | 201234567890,201987654321\``
        return m.reply(txt)
    }

    const name = args[0].trim()
    const participantsStr = args[1] ? args[1].trim() : ''
    const durationStr = args[2] ? args[2].trim() : ''

    if (!name || name.length < 2) {
        return m.reply('❌ اسم المجموعة قصير جداً! يجب أن يكون حرفين على الأقل.')
    }

    let validNumbers = []
    let skippedIndo = 0
    let skippedInvalid = 0

    // إذا فيه مشاركين، نعالجهم
    if (participantsStr) {
        let rawNumbers = []
        
        if (participantsStr.includes(',') || participantsStr.includes(';') || participantsStr.includes(' ')) {
            rawNumbers = participantsStr.split(/[,;\s]+/)
        } else {
            const matches = participantsStr.match(/\d{10,15}/g)
            if (matches) {
                rawNumbers = matches
            } else {
                rawNumbers = [participantsStr]
            }
        }

        for (const num of rawNumbers) {
            let cleaned = cleanEgyptNumber(num)
            if (!cleaned) {
                if (num.toString().replace(/[^0-9]/g, '').startsWith('62')) skippedIndo++
                else skippedInvalid++
                continue
            }
            if (!cleaned.startsWith('20')) cleaned = '20' + cleaned.replace(/^2+/, '')
            validNumbers.push(cleaned + '@s.whatsapp.net')
        }
    }

    let durationMs = 0
    let durationMins = 0
    if (durationStr) {
        durationMins = parseInt(durationStr.replace(/[^0-9]/g, ''))
        if (!isNaN(durationMins) && durationMins > 0) {
            durationMs = durationMins * 60 * 1000
        }
    }

    try {
        await m.react('🕕')
        
        // إنشاء المجموعة (مع أو بدون مشاركين)
        const group = validNumbers.length > 0 
            ? await sock.groupCreate(name, validNumbers)
            : await sock.groupCreate(name, [])
        
        // الحصول على رابط الدعوة
        const inviteCode = await sock.groupInviteCode(group.id)
        const inviteLink = `https://chat.whatsapp.com/${inviteCode}`
        
        let successTxt = `👥 *تم إنشاء المجموعة بنجاح* 👥\n\n`
        successTxt += `✨ *الاسم:* ${name}\n`
        successTxt += `🔗 *رابط الدعوة:*\n${inviteLink}\n\n`
        
        if (validNumbers.length > 0) {
            successTxt += `👤 *المشاركين المضافين:* ${validNumbers.length} شخص\n`
            if (skippedIndo > 0) successTxt += `⚠️ *أرقام إندونيسية متجاهلة:* ${skippedIndo}\n`
            if (skippedInvalid > 0) successTxt += `⚠️ *أرقام غير صالحة متجاهلة:* ${skippedInvalid}\n`
        } else {
            successTxt += `👤 *المشاركين:* لا يوجد (مجموعة فارغة)\n`
            successTxt += `💡 _أرسل الرابط لأصدقائك للانضمام_\n`
        }
        
        if (durationMs > 0) {
            successTxt += `\n⏳ *مدة الصلاحية:* ${durationMins} دقيقة\n`
            successTxt += `⚠️ _سيتم حذف المجموعة تلقائياً عند انتهاء المدة!_\n`
        }

        successTxt += `\n_البوت أصبح مشرفاً في هذه المجموعة تلقائياً!_`
        await m.reply(successTxt)

        // حذف المجموعة بعد المدة إذا تم تحديدها
        if (durationMs > 0) {
            setTimeout(async () => {
                try {
                    const groupMeta = await sock.groupMetadata(group.id)
                    const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net'
                    
                    const membersToKick = groupMeta.participants
                        .map(p => p.id)
                        .filter(id => id !== botJid)

                    if (membersToKick.length > 0) {
                        await sock.sendMessage(group.id, { 
                            text: `⏳ *انتهت مدة المجموعة* ⏳\n\nحسب أمر المالك، انتهى وقت هذه المجموعة. إلى اللقاء! 👋` 
                        })
                        
                        for (let i = 0; i < membersToKick.length; i += 10) {
                            const batch = membersToKick.slice(i, i + 10)
                            await sock.groupParticipantsUpdate(group.id, batch, 'remove')
                        }
                    }
                    
                    await sock.groupLeave(group.id)
                } catch (e) {
                    console.log(`فشل في حذف المجموعة تلقائياً (${group.id}):`, e)
                }
            }, durationMs)
        }

        await m.react('✅')
    } catch (err) {
        await m.react('❌')
        return m.reply(`❌ عذراً، فشل في إنشاء المجموعة! 😭\nخطأ: ${err.message}`)
    }
}

export { pluginConfig as config, handler }