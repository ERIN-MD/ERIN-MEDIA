import axios from 'axios';
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "التميز",
  alias: ["التميز", "تميز", "unlimited", "ai"],
  category: "ai",
  description: "دردشة ذكاء اصطناعي UnlimitedAI",
  usage: ".التميز <سؤال>",
  example: ".التميز من انت؟",
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const text = m.args.join(" ");
  
  if (!text) {
    return m.reply(`🤖 *التميز AI*\n\n📌 ${m.prefix}${m.command} من انت؟`);
  }

  m.react('⭐');

  try {
    const { data } = await axios.post(
      'https://app.unlimitedai.chat/api/chat',
      {
        chatId: "d4ba75bb-17f4-4af2-bcfd-c83a1c54f951",
        messages: [
          {
            id: Date.now().toString(),
            role: "user",
            content: text,
            parts: [{ type: "text", text: text }],
            createdAt: new Date().toISOString()
          }
        ],
        selectedChatModel: "chat-model-reasoning",
        selectedCharacter: null,
        selectedStory: null,
        deviceId: "4f7fcfb4-f23e-45d4-afc6-12aea62e889a",
        locale: "fr"
      },
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Content-Type': 'application/json',
          'Origin': 'https://app.unlimitedai.chat',
          'Referer': 'https://app.unlimitedai.chat/',
        },
        timeout: 60000,
        responseType: 'stream'
      }
    );

    let reply = '';
    
    data.on('data', chunk => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line.trim());
          if (json.type === "delta" && json.delta) {
            reply += json.delta;
          }
        } catch {}
      }
    });

    data.on('end', async () => {
      if (reply.trim()) {
        await m.reply(reply.trim());
        m.react('✅');
      } else {
        m.react('❌');
        m.reply('❌ لم يتم الحصول على رد');
      }
    });

  } catch (error) {
    console.log(error);
    m.react('❌');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };