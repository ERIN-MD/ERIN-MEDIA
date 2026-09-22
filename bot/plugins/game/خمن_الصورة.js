import { games } from '../../src/lib/maro-games.js'

const pluginConfig = {
    name: 'خمن_الصورة',
    alias: ['tebakgambar'],
    category: 'game',
    description: 'خمن الكلمة من الصورة',
    usage: '.خمن_الصورة',
    example: '.خمن_الصورة',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

games.register('خمن_الصورة', {
    alias: ['tebakgambar'],
    emoji: '🖼️',
    title: 'خمن الصورة',
    description: 'خمن الكلمة من الصورة',
    dataFile: 'tebakgambar.json',
    timeout: 90000,
    hasImage: true,
    questionField: null,
    hintCount: 3
})

const { handler, answerHandler } = games.createPlugin('خمن_الصورة')

export { pluginConfig as config, handler, answerHandler }