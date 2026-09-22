import { games } from '../../src/lib/maro-games.js'

const pluginConfig = {
    name: 'من_أنا',
    alias: ['siapakahaku'],
    category: 'game',
    description: 'خمن من الوصف',
    usage: '.من_أنا',
    example: '.من_أنا',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

games.register('من_أنا', {
    alias: ['siapakahaku'],
    emoji: '🎭',
    title: 'من أنا',
    description: 'خمن من الوصف',
    dataFile: 'siapakahaku.json'
})

const { handler, answerHandler } = games.createPlugin('من_أنا')

export { pluginConfig as config, handler, answerHandler }