import axios from 'axios'

const pluginConfig = {
    name: 'سمسمي2',
    alias: [],
    category: 'fun',
    description: 'تحدث مع سمسمي',
    usage: '.سمسمي2 <نص>',
    example: '.سمسمي2 كيف حالك؟',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock, text }) {
    if (!text) return m.reply(`🤖 *SimSimi*\n\n> \`${m.prefix}سمسمي2 <نص>\`\n\n> مثال:\n> \`${m.prefix}سمسمي2 كيف حالك؟\``)

    await m.react('🤖')

    try {
        const { data } = await axios.get('https://engez.a7a.online/api/v1/ai/ai/simsimi', {
            params: { action: 'تكلم', message: text },
            timeout: 15000
        })

        if (data.success && data.response?.reply) {
            await m.reply(`🤖 *سمسم:* ${data.response.reply}`)
            await m.react('✅')
        } else {
            await m.react('❌')
            await m.reply('❌ *سمسم:* ما فهمت، حاول مرة أخرى 😅')
        }
    } catch (e) {
        await m.react('❌')
        await m.reply('❌ *سمسم:* حدث خطأ، حاول مرة أخرى')
    }
}

export { pluginConfig as config, handler }