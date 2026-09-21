// معرف_القناة - أمر لعرض معرف ومعلومات القناة من الرابط

import config from '../../config.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'معرف_القناة',
    alias: ['cekidch'],
    category: 'tools',
    description: 'عرض معرف ومعلومات القناة من الرابط',
    usage: '.معرف_القناة <رابط القناة>',
    example: '.معرف_القناة https://whatsapp.com/channel/xxxxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function formatDate(timestamp) {
    if (!timestamp) return '—'
    const d = new Date(typeof timestamp === 'number' && timestamp < 1e12 ? timestamp * 1000 : timestamp)
    const pad = n => String(n).padStart(2, '0')
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatSubs(count) {
    if (!count || count === 0) return '0'
    if (count >= 1_000_000) return (count / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'م'
    if (count >= 1_000) return (count / 1_000).toFixed(1).replace(/\.0$/, '') + 'ألف'
    return String(count)
}

async function handler(m, { sock }) {
    const text = m.text?.trim()

    if (!text) {
        return m.reply(
            `── .✦ معرف القناة ✦. ──\n\n` +
            `> أدخل رابط قناة واتساب\n\n` +
            `> \`${m.prefix}معرف_القناة https://whatsapp.com/channel/xxxxx\``
        )
    }

    if (!text.includes('https://whatsapp.com/channel/')) {
        return m.reply(`── .✦ ──\n\n> رابط القناة غير صالح .☘︎ ݁˖`)
    }

    m.react('🕕')

    try {
        const metadata = await sock.cekIDSaluran(text)
 
        if (!metadata?.id) {
            m.react('✘')
            return m.reply(`── .✦ ──\n\n> القناة غير موجودة .☘︎ ݁˖`)
        }

        const chName = metadata.name || 'غير معروف'
        const chId = metadata.id
        const chSubs = metadata.subscribers ?? metadata.subscribers_count ?? 0
        const chDesc = metadata.description || '—'
        const chVerified = metadata.verification === 'VERIFIED' ? '✓ موثقة' : 'غير موثقة'
        const chCreated = formatDate(metadata.creation_time)
        const chPicUrl = metadata.preview === "https://mmg.whatsapp.net" ? "https://athars.space/uploads/de11c461.jpg" : metadata.preview

        const descPreview = chDesc.length > 120 ? chDesc.slice(0, 120) + '...' : chDesc

        const infoText =
            `── .✦ معلومات القناة ✦. ──\n\n` +
            `╭─〔 *${chName}* 〕───⬣\n` +
            `│  ✦ الاسم       : *${chName}*\n` +
            `│  ✦ المعرف      : \`${chId}\`\n` +
            `│  ✦ المشتركون  : *${formatSubs(chSubs)}*\n` +
            `│  ✦ الحالة     : *${chVerified}*\n` +
            `│  ✦ تاريخ الإنشاء : *${chCreated}*\n` +
            `│  ✦ الوصف      : ${descPreview}\n` +
            `╰──────────────⬣`

        const buttons = [
            {
                name: 'cta_copy',
                buttonParamsJson: JSON.stringify({
                    display_text: '✦ نسخ معرف القناة',
                    copy_code: chId
                })
            },
            {
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '✦ فتح القناة',
                    url: text
                })
            }
        ]

        await sock.sendButton(m.chat, chPicUrl, infoText, m, {
            buttons: buttons,
            footer: `© ${config.bot?.name || 'Maro-AI'}`,
        })

        m.react('✅')

    } catch (error) {
        console.error('[CekIdCh] Error:', error.message)
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }