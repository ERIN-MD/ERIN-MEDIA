import { games } from '../../src/lib/maro-games.js'

const pluginConfig = {
    name: 'خمن_الحيوان',
    alias: ['tebakhewan'],
    category: 'game',
    description: 'خمن اسم الحيوان',
    usage: '.خمن_الحيوان',
    example: '.خمن_الحيوان',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

games.register('خمن_الحيوان', {
    alias: ['tebakhewan'],
    emoji: '🐾',
    title: 'خمن الحيوان',
    description: 'خمن اسم الحيوان',
    dataFile: 'tebakhewan.json'
})

const { handler, answerHandler } = games.createPlugin('خمن_الحيوان')

export { pluginConfig as config, handler, answerHandler }