import axios from 'axios';
import te from "../../src/lib/maro-error.js";
import { generateWAMessageFromContent } from 'maro';

const STYLES = {
  'انيمي': { suffix: 'anime style, studio ghibli, detailed anime art' },
  'كرتون': { suffix: 'cartoon style, pixar, vibrant colors' },
  'زيتي': { suffix: 'oil painting, classical art, rich textures' },
  'رسم_رصاص': { suffix: 'pencil sketch, black and white, detailed drawing' },
  'ماء': { suffix: 'watercolor painting, soft colors, artistic' },
  'ثلاثي': { suffix: '3D render, hyperrealistic, cinema 4D, octane render' },
  'فانتازيا': { suffix: 'fantasy art, magical, epic, concept art' },
  'سايبر': { suffix: 'cyberpunk, neon lights, futuristic, dark atmosphere' },
  'قديم': { suffix: 'vintage, retro, old photo style, sepia' },
  'ابيض_اسود': { suffix: 'black and white, monochrome, artistic photography' },
};

const pluginConfig = {
  name: "فن",
  alias: ["فن", "art", "رسم", "draw"],
  category: "ai",
  description: "توليد صور مع اختيار استايل الرسم",
  usage: ".فن <استايل> <وصف>",
  example: ".فن انيمي قطة",
  isOwner: false,
  cooldown: 30,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const text = m.args.join(" ").trim();
  
  if (!text) {
    const rows = Object.entries(STYLES).map(([key, val]) => ({
      title: key,
      description: val.suffix.substring(0, 40),
      id: `${m.prefix}${m.command} ${key} `
    }));

    const msg = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: { text: `🎨 *اختر استايل*\n📌 ${m.prefix}${m.command} انيمي وصف` },
            footer: { text: 'Pollinations AI' },
            header: { title: 'الاستايلات', hasMediaAttachment: false },
            nativeFlowMessage: {
              buttons: [{
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                  title: 'اختر الاستايل',
                  sections: [{ title: 'الاستايلات', rows }]
                })
              }]
            }
          }
        }
      }
    }, { quoted: m });

    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    return;
  }

  const parts = text.split(/\s+/);
  const styleKey = parts[0]?.toLowerCase();
  const style = STYLES[styleKey];

  if (!style) {
    const list = Object.keys(STYLES).join(', ');
    return m.reply(`❌ استايل غير معروف: ${styleKey}\n✅ المتاح: ${list}`);
  }

  const prompt = parts.slice(1).join(' ');
  if (!prompt) return m.reply(`📝 اكتب وصف\n📌 ${m.prefix}${m.command} ${styleKey} وصف`);

  m.react('🎨');

  try {
    const seed = Math.floor(Math.random() * 999);
    const fullPrompt = `${prompt}, ${style.suffix}`;
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=1024&height=1024&seed=${seed}&nologo=true`;

    await sock.sendMessage(m.chat, {
      image: { url: imageUrl },
      caption: `🎨 ${prompt}\n✨ ${styleKey}`
    }, { quoted: m });

    m.react('✅');

  } catch (error) {
    console.log(error);
    m.react('❌');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };