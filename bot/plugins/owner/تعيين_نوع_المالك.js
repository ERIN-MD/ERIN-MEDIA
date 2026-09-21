// تعيين نوع المالك - أمر لتعيين شكل رسالة المالك

import config from '../../config.js'
import { getDatabase } from '../../src/lib/maro-database.js'
import fs from 'fs'
import path from 'path'

const pluginConfig = {
    name: 'تعيين_نوع_المالك',
    alias: ['setownertype'],
    category: 'owner',
    description: 'تعيين شكل رسالة المالك',
    usage: '.تعيين_نوع_المالك',
    example: '.تعيين_نوع_المالك',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

const VARIANTS = {
    1: { name: 'التصميم الحالي', desc: 'الشكل الافتراضي الحالي' },
    2: { name: 'جهات اتصال متعددة', desc: 'إرسال بطاقات اتصال لجميع المالكين' }
}

async function handler(m, { sock, db }) {
    const args = m.args || []
    const variant = args[0]?.toLowerCase()
    const current = db.setting('ownerType') || 1

    if (variant && /^v?[1-3]$/.test(variant)) {
        const id = parseInt(variant.replace('v', ''))
        db.setting('ownerType', id)
        await db.save()

        await m.reply(
            `✅ تم تغيير نوع المالك إلى *V${id}*\n\n` +
            `> *${VARIANTS[id].name}*\n` +
            `> _${VARIANTS[id].desc}_`
        )
        return
    }

    const buttons = []
    for (const [id, val] of Object.entries(VARIANTS)) {
        const mark = parseInt(id) === current ? ' ✓' : ''
        buttons.push({
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
                display_text: `V${id}${mark} - ${val.name}`,
                id: `${m.prefix}تعيين_نوع_المالك v${id}`
            })
        })
    }

    await sock.sendMessage(m.chat, {
        text: `🎨 *تعيين نوع المالك*\n\n> النوع الحالي: *V${current}*\n> _${VARIANTS[current].name}_\n\n> اختر شكل المالك:`,
        footer: config.bot?.name || 'Maro-AI',
        contextInfo: {
            mentionedJid: [m.sender],
            isForwarded: true,
            forwardingScore: 999
        },
        interactiveButtons: buttons
    }, { quoted: m })
}

export { pluginConfig as config, handler }