import axios from 'axios';
import crypto from 'crypto';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import config from '../../config.js';
import te from '../../src/lib/maro-error.js';

async function monicaAI(text) {
  const url = 'https://api.monica.im/api/custom_bot/chat';
  const jar = new CookieJar();
  const client = wrapper(axios.create({ jar }));

  const localstorage = {
    _grecaptcha: "09AKhCRwjwCm4ykPjRkckp-g4MnWdUI6ibB35f8aX9_MXRBB2Yjb7Quh-6_m59GtqRPgTBDJd-ykOrVf6c2XopScQCAtEH46hN4Fn88Vxkbt7E18QwDgIakpGCAzLznott",
    monica_refer: "https://www.google.com/",
    _uetvid: "994b4df071f811f188bded49f1534ac6"
  };

  const conversationId = "conv:e8ffbf35-6a21-4739-9ee4-a3dcc06c5f6d";
  const taskUid = `task:${crypto.randomUUID()}`;
  const welcomeMsgId = `msg:${crypto.randomUUID()}`;
  const questionMsgId = `msg:${crypto.randomUUID()}`;
  const preGeneratedReplyId = `msg:${crypto.randomUUID()}`;
  const clientId = "e8823c29-b6e0-4c48-9554-45aa4e296985";

  await jar.setCookie(`_uetvid=${localstorage._uetvid}; Domain=monica.im; Path=/`, url);
  // ⚠️ أمان: كان رمز الجلسة (JWT) مكتوباً هنا صراحةً.
  const monicaSession = process.env.MONICA_SESSION_ID || '';
  if (monicaSession) {
    await jar.setCookie(`session_id=${monicaSession}; Domain=monica.im; Path=/`, url);
  }

  const requestData = {
    "task_uid": taskUid,
    "bot_uid": "claude_4_5_haiku",
    "data": {
      "conversation_id": conversationId,
      "items": [
        {
          "item_id": welcomeMsgId,
          "conversation_id": conversationId,
          "item_type": "reply",
          "summary": "__RENDER_BOT_WELCOME_MSG__",
          "data": { "type": "text", "content": "__RENDER_BOT_WELCOME_MSG__" }
        },
        {
          "conversation_id": conversationId,
          "item_id": questionMsgId,
          "item_type": "question",
          "summary": text,
          "parent_item_id": welcomeMsgId,
          "data": {
            "type": "text",
            "content": text,
            "quote_content": "",
            "max_token": 0,
            "is_incognito": false
          }
        }
      ],
      "pre_generated_reply_id": preGeneratedReplyId,
      "pre_parent_item_id": questionMsgId,
      "origin": localstorage.monica_refer,
      "origin_page_title": "Free AI Chat - Unlock Your Daily Conversation Quota",
      "trigger_by": "auto",
      "use_model": "claude-haiku-4-5",
      "is_incognito": false,
      "use_new_memory": true,
      "use_memory_suggestion": true
    },
    "language": "auto",
    "locale": "en",
    "task_type": "chat",
    "tool_data": { "sys_skill_list": [] },
    "ai_resp_language": "English"
  };

  const headers = {
    'Content-Type': 'application/json',
    'X-Client-Locale': 'en',
    'X-Product-Name': 'Monica',
    'X-Client-Type': 'web',
    'X-From-Channel': 'NA',
    'X-Time-Zone': 'Asia/Jakarta;-420',
    'X-Client-Version': '5.4.3',
    'X-Client-Id': clientId,
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36',
    'Referer': 'https://monica.im/en/products/ai-chat',
    'Accept': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'X-Grecaptcha-Token': localstorage._grecaptcha
  };

  try {
    const response = await client.post(url, requestData, { headers, responseType: 'stream' });
    let fullResponseText = '';

    return new Promise((resolve, reject) => {
      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        for (let line of lines) {
          line = line.trim();
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.text) {
                fullResponseText += parsed.text;
              }
            } catch (e) {}
          }
        }
      });

      response.data.on('end', () => {
        const answer = fullResponseText.replace(/__RENDER_BOT_WELCOME_MSG__$/g, '').trim();
        resolve(answer);
      });

      response.data.on('error', (err) => {
        reject(err);
      });
    });
  } catch (error) {
    throw new Error(error.message);
  }
}

const pluginConfig = {
  name: 'مونيكا',
  alias: ['monica'],
  category: 'ai',
  description: 'محادثة مع Monica AI (Claude Haiku)',
  usage: '.مونيكا <سؤال>',
  example: '.مونيكا من انت',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 15,
  energi: 2,
  isEnabled: true
};

async function handler(m, { sock }) {
  const text = m.args.join(' ')?.trim();

  if (!text) {
    return m.reply(`🤖 *Monica AI*\n\n📌 مثال: \`${m.prefix}مونيكا من انت\``);
  }

  m.react('🤖');

  try {
    const answer = await monicaAI(text);
    
    if (!answer || answer.length === 0) {
      m.react('❌');
      return m.reply('❌ لم يتم الحصول على رد');
    }

    await m.reply(answer);
    m.react('✅');
  } catch (error) {
    console.error('Monica Error:', error);
    m.react('❌');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };