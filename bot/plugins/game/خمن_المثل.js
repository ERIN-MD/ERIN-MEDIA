import { games } from '../../src/lib/maro-games.js'

const pluginConfig = {
    name: 'خمن_المثل',
    alias: ['tebakkalimat'],
    category: 'game',
    description: 'خمن المثل أو المقولة',
    usage: '.خمن_المثل',
    example: '.خمن_المثل',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

games.register('خمن_المثل', {
    alias: ['tebakkalimat'],
    emoji: '📖',
    title: 'خمن المثل',
    description: 'خمن المثل أو المقولة',
    dataFile: 'tebakkalimat.json'
})

const { handler, answerHandler } = games.createPlugin('خمن_المثل')

export { pluginConfig as config, handler, answerHandler }