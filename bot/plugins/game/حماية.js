import { nightActionHandler } from './مستذئب.js'
import te from '../../src/lib/maro-error.js'
const pluginConfig = {
    name: 'حماية',
    alias: ['wwprotect'],
    category: 'game',
    description: 'حركة الحارس الليلية - اختر هدفاً للحماية',
    usage: '.حماية <رقم>',
    example: '.حماية 3',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: true,
    cooldown: 0,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        return await nightActionHandler(m, { sock })
    } catch (error) {
        console.error('[حماية ERROR]', error)
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }