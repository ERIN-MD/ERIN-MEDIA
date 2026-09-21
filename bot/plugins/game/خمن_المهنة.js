import { games } from '../../src/lib/maro-games.js'

const pluginConfig = {
    name: 'خمن_المهنة',
    alias: ['tebakprofesi'],
    category: 'game',
    description: 'خمن اسم المهنة',
    usage: '.خمن_المهنة',
    example: '.خمن_المهنة',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

games.register('خمن_المهنة', {
    alias: ['tebakprofesi'],
    emoji: '👨‍💼',
    title: 'خمن المهنة',
    description: 'خمن اسم المهنة',
    dataFile: 'tebakprofesi.json'
})

const { handler, answerHandler } = games.createPlugin('خمن_المهنة')

export { pluginConfig as config, handler, answerHandler }