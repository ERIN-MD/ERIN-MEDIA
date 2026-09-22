import { games } from '../../src/lib/maro-games.js'

const pluginConfig = {
    name: 'أسئلة_ذكاء',
    alias: ['asahotak'],
    category: 'game',
    description: 'لعبة أسئلة ذكاء - خمن الإجابة',
    usage: '.أسئلة_ذكاء',
    example: '.أسئلة_ذكاء',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

games.register('أسئلة_ذكاء', {
    alias: ['asahotak'],
    emoji: '🧠',
    title: 'أسئلة ذكاء',
    description: 'لعبة أسئلة ذكاء - خمن الإجابة'
})

const { handler, answerHandler } = games.createPlugin('أسئلة_ذكاء')

export { pluginConfig as config, handler, answerHandler }