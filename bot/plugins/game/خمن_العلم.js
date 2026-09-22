import { games } from '../../src/lib/maro-games.js'

const pluginConfig = {
    name: 'خمن_العلم',
    alias: ['tebakbendera'],
    category: 'game',
    description: 'خمن الدولة من العلم',
    usage: '.خمن_العلم',
    example: '.خمن_العلم',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

games.register('خمن_العلم', {
    alias: ['tebakbendera'],
    emoji: '🏳️',
    title: 'خمن العلم',
    description: 'خمن الدولة من العلم',
    dataFile: 'tebakbendera2.json',
    answerField: 'name',
    hasImage: true
})

const { handler, answerHandler } = games.createPlugin('خمن_العلم')

export { pluginConfig as config, handler, answerHandler }