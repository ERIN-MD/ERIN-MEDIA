import { getRandomItem } from '../../src/lib/maro-game-data.js'
const pluginConfig = {
    name: 'غزل',
    alias: ['bucin'],
    category: 'fun',
    description: 'عبارات غزل ورومانسية عشوائية',
    usage: '.غزل',
    example: '.غزل',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

async function handler(m) {
    const quote = getRandomItem('bucin.json');
    
    if (!quote) {
        await m.reply('❌ البيانات غير متوفرة!');
        return;
    }
    
    await m.reply(`\`\`\`"${quote}"\`\`\`\n\n`);
}

export { pluginConfig as config, handler }