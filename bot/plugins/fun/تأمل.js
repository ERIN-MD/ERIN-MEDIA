import { getRandomItem } from '../../src/lib/maro-game-data.js'
import { fetchBuffer } from '../../src/lib/maro-utils.js'
const pluginConfig = {
    name: 'تأمل',
    alias: ['renungan'],
    category: 'fun',
    description: 'صورة تأمل/تحفيز عشوائية',
    usage: '.تأمل',
    example: '.تأمل',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

async function handler(m, { sock }) {
    m.react('🕕')
    try {
        await sock.sendMedia(m.chat, getRandomItem('renungan.json'), null, m, {
            type: 'image'
        })
        m.react('✅')
    } catch (error) {
        m.react('❌')
        await m.reply('❌ فشل جلب الصورة. حاول مجدداً!');
    }
}

export { pluginConfig as config, handler }