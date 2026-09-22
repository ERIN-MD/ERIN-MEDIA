import { games } from '../../src/lib/maro-games.js'

const pluginConfig = {
    name: 'ألغاز',
    alias: ['tekateki'],
    category: 'game',
    description: 'لعبة ألغاز تقليدية',
    usage: '.ألغاز',
    example: '.ألغاز',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

games.register('ألغاز', {
    alias: ['tekateki'],
    emoji: '🧩',
    title: 'ألغاز',
    description: 'لعبة ألغاز تقليدية',
    dataFile: 'tekateki.json'
})

const { handler, answerHandler } = games.createPlugin('ألغاز')

export { pluginConfig as config, handler, answerHandler }