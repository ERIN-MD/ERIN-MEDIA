// ═══════════════════════════════════════════════
// 📁 plugins/ai/gemini.js
// 🤖 Gemini AI - شات ذكي مع عرض جداول وأكواد
// ═══════════════════════════════════════════════

import gemini from '../../src/scraper/gemini.js';
import { AIRich } from '../../src/lib/maro-builder.js';
import te from '../../src/lib/maro-error.js';

const pluginConfig = {
    name: 'ai',
    alias: ['ai4chat', 'gemini', 'ذكاء', 'شات'],
    category: 'ai',
    description: 'محادثة ذكية مع Gemini AI (يدعم جداول، أكواد، تنسيق متقدم)',
    usage: '.ai <سؤال>',
    example: '.ai قارن بين JavaScript و Python في جدول',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
};

const sessions = {};

const systemPrompt = `أنت مساعد ذكي ومتقدم يتحدث باللغة العربية. اسمك Tarboo Bot AI.
استخدم تنسيق markdown بدقة:
1. عند إنشاء جداول أو مقارنات، استخدم دائماً تنسيق الجدول (يبدأ وينتهي بـ |).
2. عند كتابة أكواد برمجية، استخدم دائماً \`\`\`لغة ... \`\`\`.
3. استخدم **نص عريض** للعناوين المهمة.
4. اجعل الردود منظمة ومرتبة.
5. تحدث باللغة العربية الفصحى أو العامية المصرية حسب السؤال.`;

async function handler(m, { sock, text }) {
    if (!text) {
        return m.reply(
            `🤖 *Tarboo Bot AI*\n\n` +
            `> مساعد ذكي متقدم\n\n` +
            `*الاستخدام:*\n` +
            `> \`.ai <سؤال>\`\n\n` +
            `*أمثلة:*\n` +
            `> \`.ai قارن بين JS و Python في جدول\`\n` +
            `> \`.ai اكتبلي كود Fibonacci في بايثون\`\n` +
            `> \`.ai اشرحلي يعني ايه API\``
        );
    }

    m.react('⏳');

    const userJid = m.sender;
    const sessionId = sessions[userJid] || null;

    try {
        const result = await gemini({
            message: text,
            instruction: systemPrompt,
            sessionId: sessionId
        });

        if (result && result.sessionId) {
            sessions[userJid] = result.sessionId;
        }

        const replyText = result.text || '';
        const aiRich = new AIRich(sock);
        const lines = replyText.split('\n');
        let currentTable = [];
        let currentCode = [];
        let inCode = false;
        let codeLang = '';
        let textBuffer = [];

        const flushText = () => {
            if (textBuffer.length > 0) {
                aiRich.addText(textBuffer.join('\n').trim());
                textBuffer = [];
            }
        };

        const flushTable = () => {
            if (currentTable.length > 0) {
                const tableData = currentTable.map(line => {
                    return line.split('|').map(c => c.trim()).filter((_, i, arr) => i !== 0 && i !== arr.length - 1);
                });
                const filteredTableData = tableData.filter(row => !row.every(c => /^[-:]+$/.test(c)));
                if (filteredTableData.length > 0 && filteredTableData.every(row => row.length > 0)) {
                    aiRich.addTable(filteredTableData);
                } else {
                    aiRich.addText(currentTable.join('\n'));
                }
                currentTable = [];
            }
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim().startsWith('```')) {
                if (!inCode) {
                    flushText();
                    flushTable();
                    inCode = true;
                    codeLang = line.trim().substring(3).trim() || 'text';
                } else {
                    inCode = false;
                    aiRich.addCode(codeLang, currentCode.join('\n'));
                    currentCode = [];
                }
                continue;
            }
            if (inCode) {
                currentCode.push(line);
                continue;
            }
            if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
                flushText();
                currentTable.push(line.trim());
                continue;
            }
            flushTable();
            textBuffer.push(line);
        }

        flushText();
        flushTable();
        await aiRich.send(m.chat, { quoted: m });
        m.react('✅');
    } catch (error) {
        console.error('[AI Error]', error);
        m.react('❌');
        return m.reply(te(m.prefix, m.command, m.pushName));
    }
}

export { pluginConfig as config, handler };