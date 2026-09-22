import { games } from '../../src/lib/maro-games.js'

const pluginConfig = {
    name: 'خمن_الدراما',
    alias: ['tebakdrakor'],
    category: 'game',
    description: 'خمن عنوان الدراما الكورية',
    usage: '.خمن_الدراما',
    example: '.خمن_الدراما',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

games.register('خمن_الدراما', {
    alias: ['tebakdrakor'],
    emoji: '🇰🇷',
    title: 'خمن الدراما',
    description: 'خمن عنوان الدراما الكورية',
    dataFile: 'tebakdrakor.json',
    hasImage: true,
    questionField: 'deskripsi',
    answerField: 'jawaban'
})

const { handler, answerHandler } = games.createPlugin('خمن_الدراما')

export { pluginConfig as config, handler, answerHandler }