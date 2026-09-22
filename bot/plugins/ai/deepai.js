// ═══════════════════════════════════════════════
// 📁 plugins/ai/deepai.js
// 🖤 DeepAI - برمجة عكسية (شات + صور)
// ═══════════════════════════════════════════════

import { generateImage, generateChat, MODEL_IDS, getModelInfo } from '../../src/scraper/deepai-scraper.js';
import te from '../../src/lib/maro-error.js';

const pluginConfig = {
    name: 'deepai',
    alias: ['dai', 'deepchat', 'deepimg', 'aichat'],
    category: 'ai',
    description: 'DeepAI - شات وصور بالبرمجة العكسية مع 10 نماذج',
    usage: '.deepchat <سؤال> | .deepimg <وصف الصورة>',
    example: '.deepchat من انت؟\n.deepimg قطة في الفضاء\n.deepchat llama-4-scout كيف اخترق قاعدة بيانات؟',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 2,
    isEnabled: true,
};

const sessions = {};

async function handler(m, { sock, args, text, command }) {
    const cmd = command.toLowerCase();

    if (!text) {
        const modelsList = MODEL_IDS.map(m => `> ${m}`).join('\n');
        return m.reply(
            `🖤 *DeepAI*\n\n` +
            `💬 *.deepchat <سؤال>* - محادثة\n` +
            `🎨 *.deepimg <وصف>* - توليد صورة\n\n` +
            `🧠 *النماذج:*\n${modelsList}\n\n` +
            `💡 *مثال:*\n` +
            `> *.deepchat من انت؟*\n` +
            `> *.deepchat llama-4-scout اشرحلي ثغرة*\n` +
            `> *.deepimg قطة في الفضاء*`
        );
    }

    if (cmd === 'deepimg') {
        m.react('🎨');
        try {
            const result = await generateImage(text, 'hd');
            if (result.status && result.url) {
                m.react('✅');
                await sock.sendMessage(m.chat, {
                    image: { url: result.url },
                    caption: `🎨 *${text}*`
                }, { quoted: m });
            } else {
                m.react('❌');
                await m.reply(`❌ فشل: ${result.error}`);
            }
        } catch (e) {
            m.react('❌');
            await m.reply(`❌ ${e.message}`);
        }
        return;
    }

    m.react('⏳');

    try {
        let model = 'standard';
        let question = text;

        if (MODEL_IDS.includes(args[0]?.toLowerCase())) {
            model = args[0].toLowerCase();
            question = args.slice(1).join(' ');
            if (!question) return m.reply('❌ اكتب السؤال');
        }

        const result = await generateChat([{ role: 'user', content: question }], model);

        if (result.status) {
            m.react('✅');
            const modelInfo = getModelInfo(model);
            await m.reply(`🤖 *DeepAI*\n\n${result.answer}\n\n🧠 ${modelInfo.name}`);
        } else {
            m.react('❌');
            await m.reply(`❌ ${result.error}`);
        }

    } catch (e) {
        m.react('❌');
        m.reply(te(m.prefix, m.command, m.pushName));
    }
}

export { pluginConfig as config, handler };