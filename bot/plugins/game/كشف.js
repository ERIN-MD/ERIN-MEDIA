import { nightActionHandler } from './مستذئب.js'
import te from '../../src/lib/maro-error.js'
const pluginConfig = {
    name: 'كشف',
    alias: ['wwsee'],
    category: 'game',
    description: 'حركة العراف الليلية - اكتشف دور الهدف',
    usage: '.كشف <رقم>',
    example: '.كشف 1',
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
        console.error('[كشف ERROR]', error)
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }