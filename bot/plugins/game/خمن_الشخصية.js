import { games } from '../../src/lib/maro-games.js'

const pluginConfig = {
    name: 'خمن_الشخصية',
    alias: ['tebakepep'],
    category: 'game',
    description: 'خمن شخصية فري فاير',
    usage: '.خمن_الشخصية',
    example: '.خمن_الشخصية',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

games.register('خمن_الشخصية', {
    alias: ['tebakepep'],
    emoji: '🔫',
    title: 'خمن الشخصية',
    description: 'خمن شخصية فري فاير',
    dataFile: 'tebakepep.json',
    hasImage: true,
    questionField: 'deskripsi',
    answerField: 'jawaban'
})

const { handler, answerHandler } = games.createPlugin('خمن_الشخصية')

export { pluginConfig as config, handler, answerHandler }