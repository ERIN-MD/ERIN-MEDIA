import { games } from '../../src/lib/maro-games.js'

const pluginConfig = {
    name: 'رتب_الكلمة',
    alias: ['susunkata'],
    category: 'game',
    description: 'رتب الكلمة من الحروف',
    usage: '.رتب_الكلمة',
    example: '.رتب_الكلمة',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

games.register('رتب_الكلمة', {
    alias: ['susunkata'],
    emoji: '🔠',
    title: 'رتب الكلمة',
    description: 'رتب الكلمة من الحروف',
    dataFile: 'susunkata.json'
})

const { handler, answerHandler } = games.createPlugin('رتب_الكلمة')

export { pluginConfig as config, handler, answerHandler }