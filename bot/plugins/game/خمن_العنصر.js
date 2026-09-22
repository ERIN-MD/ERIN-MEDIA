import { games } from '../../src/lib/maro-games.js'

const pluginConfig = {
    name: 'خمن_العنصر',
    alias: ['tebakkimia'],
    category: 'game',
    description: 'خمن العنصر الكيميائي',
    usage: '.خمن_العنصر',
    example: '.خمن_العنصر',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

games.register('خمن_العنصر', {
    alias: ['tebakkimia'],
    emoji: '🧪',
    title: 'خمن العنصر',
    description: 'خمن العنصر الكيميائي',
    dataFile: 'tebakkimia.json',
    questionField: 'unsur',
    answerField: 'lambang'
})

const { handler, answerHandler } = games.createPlugin('خمن_العنصر')

export { pluginConfig as config, handler, answerHandler }