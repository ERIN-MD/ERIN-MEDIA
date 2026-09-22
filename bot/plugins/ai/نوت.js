import axios from "axios";
import crypto from "crypto";
import config from '../../config.js';
import te from '../../src/lib/maro-error.js';

async function noteGPT(message) {
  try {
    const { data } = await axios.post(
      "https://notegpt.io/api/v2/chat/stream",
      {
        message,
        language: "ar",
        model: "gemini-3.1-flash-lite-preview",
        tone: "default",
        length: "moderate",
        conversation_id: crypto.randomUUID(),
        image_urls: [],
        chat_mode: "standard"
      },
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36",
          Accept: "*/*",
          "Content-Type": "application/json",
          Origin: "https://notegpt.io",
          Referer: "https://notegpt.io/ai-chat"
        }
      }
    );
    return { success: true, result: data };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

const pluginConfig = {
  name: 'نوت',
  alias: ['notegpt'],
  category: 'ai',
  description: 'محادثة مع NoteGPT (Gemini Flash)',
  usage: '.نوت <سؤال>',
  example: '.نوت من انت',
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 10, energi: 1, isEnabled: true
};

async function handler(m, { sock }) {
  const text = m.args.join(' ')?.trim();

  if (!text) {
    return m.reply(`🤖 *NoteGPT*\n\n📌 مثال: \`${m.prefix}نوت من انت\``);
  }

  m.react('🤖');

  try {
    const res = await noteGPT(text);

    if (!res?.success) {
      m.react('❌');
      return m.reply('❌ فشل الحصول على رد');
    }

    // استخراج الرد من البيانات
    let answer = '';
    const data = res.result;
    
    if (typeof data === 'string') {
      answer = data;
    } else if (data?.choices?.[0]?.message?.content) {
      answer = data.choices[0].message.content;
    } else if (data?.response) {
      answer = data.response;
    } else if (data?.text) {
      answer = data.text;
    } else {
      answer = JSON.stringify(data);
    }

    if (!answer || answer.length < 2) {
      m.react('❌');
      return m.reply('❌ لم يتم الحصول على رد');
    }

    await m.reply(answer);
    m.react('✅');
  } catch (error) {
    console.error('NoteGPT Error:', error);
    m.react('❌');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };