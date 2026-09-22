import { games } from '../../src/lib/maro-games.js'

const pluginConfig = {
    name: 'لغز',
    alias: ['riddle'],
    category: 'game',
    description: 'ألغاز وتخمينات',
    usage: '.لغز',
    example: '.لغز',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

games.register('لغز', {
    alias: ['riddle'],
    emoji: '❓',
    title: 'لغز',
    description: 'ألغاز وتخمينات',
    dataFile: 'riddle.json'
})

const { handler, answerHandler } = games.createPlugin('لغز')

export { pluginConfig as config, handler, answerHandler }