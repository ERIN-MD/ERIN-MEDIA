import { getRandomItem } from '../../src/lib/maro-game-data.js'
const pluginConfig = {
    name: 'صراحة',
    alias: ['truth'],
    category: 'fun',
    description: 'سؤال صراحة عشوائي',
    usage: '.صراحة',
    example: '.صراحة',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

async function handler(m) {
    const question = getRandomItem('truth.json');
    if (!question) {
        await m.reply('❌ البيانات غير متوفرة!');
        return;
    }
    await m.reply(`\`\`\`${question}\`\`\``);
}

export { pluginConfig as config, handler }