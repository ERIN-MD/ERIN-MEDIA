import { games } from '../../src/lib/maro-games.js'

const pluginConfig = {
    name: 'خمن_الكلمة',
    alias: ['tebakkata'],
    category: 'game',
    description: 'خمن الكلمة من التلميح',
    usage: '.خمن_الكلمة',
    example: '.خمن_الكلمة',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

games.register('خمن_الكلمة', {
    alias: ['tebakkata'],
    emoji: '📝',
    title: 'خمن الكلمة',
    description: 'خمن الكلمة من التلميح',
    dataFile: 'tebakkata.json'
})

const { handler, answerHandler } = games.createPlugin('خمن_الكلمة')

export { pluginConfig as config, handler, answerHandler }