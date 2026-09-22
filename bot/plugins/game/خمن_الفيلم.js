import { games } from '../../src/lib/maro-games.js'

const pluginConfig = {
    name: 'خمن_الفيلم',
    alias: ['tebakfilm'],
    category: 'game',
    description: 'خمن عنوان الفيلم',
    usage: '.خمن_الفيلم',
    example: '.خمن_الفيلم',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

games.register('خمن_الفيلم', {
    alias: ['tebakfilm'],
    emoji: '🎬',
    title: 'خمن الفيلم',
    description: 'خمن عنوان الفيلم',
    dataFile: 'tebakfilm.json'
})

const { handler, answerHandler } = games.createPlugin('خمن_الفيلم')

export { pluginConfig as config, handler, answerHandler }