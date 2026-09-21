import { games } from '../../src/lib/maro-games.js'

const pluginConfig = {
    name: 'خمن_الأغنية',
    alias: ['tebaklagu'],
    category: 'game',
    description: 'خمن عنوان الأغنية',
    usage: '.خمن_الأغنية',
    example: '.خمن_الأغنية',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

games.register('خمن_الأغنية', {
    alias: ['tebaklagu'],
    emoji: '🎵',
    title: 'خمن الأغنية',
    description: 'خمن عنوان الأغنية',
    dataFile: 'tebaklagu.json'
})

const { handler, answerHandler } = games.createPlugin('خمن_الأغنية')

export { pluginConfig as config, handler, answerHandler }