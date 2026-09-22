// ═══════════════════════════════════════════════
// 📁 plugins/ai/notrack.js
// 🖤 NoTrack AI - غير خاضع للرقابة
// ═══════════════════════════════════════════════

import te from '../../src/lib/maro-error.js';

const pluginConfig = {
    name: 'notrack',
    alias: ['nt', 'تراك', 'track'],
    category: 'ai',
    description: 'NoTrack AI - ذكاء اصطناعي غير خاضع للرقابة',
    usage: '.notrack <سؤال>',
    example: '.notrack من انت؟',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 2,
    isEnabled: true,
};

const sessions = {};

async function chatWithNoTrack(prompt, chatId = null) {
    const url = "https://notrack.ai/api/dispatch";
    const payload = {
        user_input: prompt,
        mode: "usual",
        model: "C",
        persona: "normal",
        max_turns: 6,
        chat_id: chatId,
        attachments: [],
        regenerate: false,
        edit: false,
        edit_mid: null
    };
    const headers = {
        "Content-Type": "application/json",
        "Origin": "https://notrack.ai",
        "Referer": "https://notrack.ai/chat",
        "User-Agent": "Mozilla/5.0"
    };

    const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const text = await response.text();
    const lines = text.split("\n\n");
    let finalAnswer = "";
    let returnedChatId = chatId;

    for (const part of lines) {
        if (part.startsWith("data: ")) {
            try {
                const data = JSON.parse(part.slice(6));
                if (data.type === "chat_meta") returnedChatId = data.chat_id;
                if (data.type === "delta" && data.chunk) finalAnswer += data.chunk;
            } catch {}
        }
    }

    return { answer: finalAnswer, chatId: returnedChatId };
}

async function handler(m, { sock, text }) {
    if (!text) {
        return m.reply(`🖤 *NoTrack AI*\n\n📝 .notrack <سؤال>\n💡 .notrack من انت؟`);
    }

    m.react("⏳");

    const sessionId = sessions[m.sender] || null;

    try {
        const result = await chatWithNoTrack(text, sessionId);
        if (result.chatId) sessions[m.sender] = result.chatId;

        m.react("✅");
        await m.reply(result.answer);
    } catch (e) {
        m.react("❌");
        m.reply(te(m.prefix, m.command, m.pushName));
    }
}

export { pluginConfig as config, handler };