import { games } from '../../src/lib/maro-games.js'

const pluginConfig = {
    name: 'خمن_العضوة',
    alias: ['tebakjkt48'],
    category: 'game',
    description: 'خمن عضوة JKT48',
    usage: '.خمن_العضوة',
    example: '.خمن_العضوة',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

games.register('خمن_العضوة', {
    alias: ['tebakjkt48'],
    emoji: '🎀',
    title: 'خمن العضوة',
    description: 'خمن عضوة JKT48',
    dataFile: 'tebakjkt48.json',
    hasImage: true
})

const { handler, answerHandler } = games.createPlugin('خمن_العضوة')

export { pluginConfig as config, handler, answerHandler }