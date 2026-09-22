import { games } from '../../src/lib/maro-games.js'

const pluginConfig = {
    name: 'فوازير',
    alias: ['tebaktebakan'],
    category: 'game',
    description: 'فوازير وألغاز مضحكة',
    usage: '.فوازير',
    example: '.فوازير',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

games.register('فوازير', {
    alias: ['tebaktebakan'],
    emoji: '😄',
    title: 'فوازير',
    description: 'فوازير وألغاز مضحكة',
    dataFile: 'tebaktebakan.json'
})

const { handler, answerHandler } = games.createPlugin('فوازير')

export { pluginConfig as config, handler, answerHandler }