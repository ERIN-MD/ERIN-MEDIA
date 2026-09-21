import { games } from '../../src/lib/maro-games.js'

const pluginConfig = {
    name: 'كلمة_عشوائية',
    alias: ['kataacak'],
    category: 'game',
    description: 'رتب الحروف العشوائية',
    usage: '.كلمة_عشوائية',
    example: '.كلمة_عشوائية',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

games.register('كلمة_عشوائية', {
    alias: ['kataacak'],
    emoji: '🔤',
    title: 'كلمة عشوائية',
    description: 'رتب الحروف العشوائية'
})

const { handler, answerHandler } = games.createPlugin('كلمة_عشوائية')

export { pluginConfig as config, handler, answerHandler }