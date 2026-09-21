import { nightActionHandler } from './مستذئب.js'
import te from '../../src/lib/maro-error.js'
const pluginConfig = {
    name: 'قتل',
    alias: ['wwkill'],
    category: 'game',
    description: 'حركة المستذئب الليلية - اختر هدفاً للقتل',
    usage: '.قتل <رقم>',
    example: '.قتل 2',
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
        console.error('[قتل ERROR]', error)
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }