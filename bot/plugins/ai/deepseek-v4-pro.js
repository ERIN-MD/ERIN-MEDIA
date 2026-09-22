import axios from 'axios';
import { createErrorMessage } from '../../src/lib/maro-formatter.js';

const OLLAMA_URL = 'https://ollama.com/v1/chat/completions';

const MODELS = [
    { id: '1', name: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro', desc: 'الأكبر والأذكى' },
    { id: '2', name: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash', desc: 'سريع وذكي' },
    { id: '3', name: 'kimi-k3', label: 'Kimi K3', desc: 'الأحدث' },
    { id: '4', name: 'kimi-k2.7-code', label: 'Kimi K2.7 Code', desc: 'متخصص برمجة' },
    { id: '5', name: 'kimi-k2.6', label: 'Kimi K2.6', desc: 'متوازن' },
    { id: '6', name: 'kimi-k2.5', label: 'Kimi K2.5', desc: 'سريع' },
    { id: '7', name: 'qwen3.5:397b', label: 'Qwen 3.5 397B', desc: 'ضخم وقوي' },
    { id: '8', name: 'gemma4:31b', label: 'Gemma 4 31B', desc: 'من جوجل' },
    { id: '9', name: 'mistral-large-3:675b', label: 'Mistral Large 3', desc: 'ضخم جداً' },
    { id: '10', name: 'nemotron-3-ultra', label: 'Nemotron Ultra', desc: 'قوي ومتعدد' },
    { id: '11', name: 'nemotron-3-super', label: 'Nemotron Super', desc: 'ممتاز' },
    { id: '12', name: 'gpt-oss:120b', label: 'GPT-OSS 120B', desc: 'مفتوح المصدر' },
    { id: '13', name: 'minimax-m3', label: 'MiniMax M3', desc: 'متوازن' },
    { id: '14', name: 'minimax-m2.7', label: 'MiniMax M2.7', desc: 'سريع' },
    { id: '15', name: 'minimax-m2.5', label: 'MiniMax M2.5', desc: 'خفيف' },
    { id: '16', name: 'glm-5.2', label: 'GLM 5.2', desc: 'قوي' },
    { id: '17', name: 'glm-5.1', label: 'GLM 5.1', desc: 'مستقر' },
    { id: '18', name: 'nemotron-3-nano:30b', label: 'Nemotron Nano', desc: 'خفيف وسريع' },
    { id: '19', name: 'gpt-oss:20b', label: 'GPT-OSS 20B', desc: 'صغير وسريع' }
];

async function chatWithOllama(model, messages) {
    const response = await axios.post(OLLAMA_URL, {
        model,
        messages,
        stream: false
    }, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        timeout: 120000
    });

    if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('لم يتم الحصول على رد');
    }

    return response.data.choices[0].message.content;
}

const pluginConfig = {
    name: 'اسأل',
    alias: ['اسال', 'ai', 'ذكاء', 'شات'],
    category: 'ai',
    description: '🤖 اسأل الذكاء الاصطناعي بـ 19 نموذج مختلف',
    usage: '.اسأل [رقم النموذج] [السؤال]\n.اسأل (يعرض القائمة)',
    example: '.اسأل 1 ما هو الذكاء الاصطناعي\n.اسأل',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 2,
    isEnabled: true
};

async function handler(m, { sock }) {
    const args = m.args || [];
    const text = m.text || '';

    // لو كتب .اسأل فقط - اعرض القائمة
    if (!text) {
        let list = `🤖 *النماذج المتاحة*\n\n`;
        for (const model of MODELS) {
            list += `*${model.id}.* ${model.label}\n   ↳ ${model.desc}\n\n`;
        }
        list += `📌 *الاستخدام:* \`.اسأل [الرقم] [السؤال]\`\nمثال: \`.اسأل 1 ما هو الذكاء\``;
        return m.reply(list);
    }

    // لو أول حاجة رقم
    const modelId = args[0];
    const model = MODELS.find(m => m.id === modelId);

    if (!model) {
        // لو مش رقم - استخدم النموذج الافتراضي (deepseek-v4-flash)
        await m.react('⏳');

        try {
            const reply = await chatWithOllama('deepseek-v4-flash', [
                { role: 'user', content: text }
            ]);

            await m.reply(`🤖 *DeepSeek V4 Flash*\n\n${reply}`);
            await m.react('✅');
        } catch (error) {
            await m.react('❌');
            return m.reply(createErrorMessage(error.message));
        }
        return;
    }

    // استخدم النموذج المختار
    const question = args.slice(1).join(' ');
    if (!question) {
        return m.reply(`❌ اكتب السؤال بعد رقم النموذج\nمثال: \`.اسأل ${modelId} ما هو الذكاء الاصطناعي\``);
    }

    await m.react('⏳');

    try {
        const reply = await chatWithOllama(model.name, [
            { role: 'user', content: question }
        ]);

        await m.reply(`🤖 *${model.label}*\n\n${reply}`);
        await m.react('✅');
    } catch (error) {
        await m.react('❌');
        return m.reply(createErrorMessage(error.message));
    }
}

export { pluginConfig as config, handler };