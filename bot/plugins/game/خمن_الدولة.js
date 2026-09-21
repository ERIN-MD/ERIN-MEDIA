import { games } from '../../src/lib/maro-games.js'

const pluginConfig = {
    name: 'خمن_الدولة',
    alias: ['tebaknegara'],
    category: 'game',
    description: 'خمن اسم الدولة',
    usage: '.خمن_الدولة',
    example: '.خمن_الدولة',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

games.register('خمن_الدولة', {
    alias: ['tebaknegara'],
    emoji: '🌍',
    title: 'خمن الدولة',
    description: 'خمن اسم الدولة',
    dataFile: 'tebaknegara.json'
})

const { handler, answerHandler } = games.createPlugin('خمن_الدولة')

export { pluginConfig as config, handler, answerHandler }