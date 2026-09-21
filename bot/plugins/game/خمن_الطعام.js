import { games } from '../../src/lib/maro-games.js'

const pluginConfig = {
    name: 'خمن_الطعام',
    alias: ['tebakmakanan'],
    category: 'game',
    description: 'خمن اسم الطعام',
    usage: '.خمن_الطعام',
    example: '.خمن_الطعام',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

games.register('خمن_الطعام', {
    alias: ['tebakmakanan'],
    emoji: '🍲',
    title: 'خمن الطعام',
    description: 'خمن اسم الطعام',
    dataFile: 'tebakmakanan.json',
    hasImage: true
})

const { handler, answerHandler } = games.createPlugin('خمن_الطعام')

export { pluginConfig as config, handler, answerHandler }