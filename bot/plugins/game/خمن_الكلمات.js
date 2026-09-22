import { games } from '../../src/lib/maro-games.js'

const pluginConfig = {
    name: 'خمن_الكلمات',
    alias: ['tebaklirik'],
    category: 'game',
    description: 'خمن كلمات الأغنية',
    usage: '.خمن_الكلمات',
    example: '.خمن_الكلمات',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

games.register('خمن_الكلمات', {
    alias: ['tebaklirik'],
    emoji: '🎤',
    title: 'خمن الكلمات',
    description: 'خمن كلمات الأغنية',
    dataFile: 'tebaklirik.json'
})

const { handler, answerHandler } = games.createPlugin('خمن_الكلمات')

export { pluginConfig as config, handler, answerHandler }