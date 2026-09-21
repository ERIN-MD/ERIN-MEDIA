import axios from 'axios';
import { generateWAMessageFromContent } from 'maro';
import te from "../../src/lib/maro-error.js";
import fs from 'fs';
import config from '../../config.js';
import sharp from 'sharp';

const DEFAULT_IMAGE = "https://i.postimg.cc/bS01zQwK/upload-1767808833485.jpg";
const ALGOLIA_BASE = "https://8vrewc6s4t-dsn.algolia.net/1/indexes";
const CANIME_API = "https://canime.web.id/api.php";

const ALGOLIA_HEADERS = {
  'User-Agent': 'Algolia for Android (3.27.0); Android (14)',
  'X-Algolia-Application-Id': '8VREWC6S4T',
  'X-Algolia-API-Key': '7a6d050dcc5fc37edd98a7f9e2d5a223',
  'Content-Type': 'application/json'
};

const GOOGLEBOT_HEADERS = {
  "User-Agent": "Googlebot/2.1 (+http://www.google.com/bot.html)",
  "Referer": "https://canime.web.id/",
  "Content-Type": "application/json"
};

const pluginConfig = {
  name: "أنمي",
  alias: ["انمي", "anime"],
  category: "search",
  description: "بحث عن الأنمي واختيار حلقة للتحميل",
  usage: ".انمي <اسم>",
  example: ".انمي ناروتو",
  isOwner: false,
  isGroup: true,
  isPrivate: true,
  cooldown: 10,
  isEnabled: true,
};

async function searchAnime(query) {
  const res = await axios.post(`${ALGOLIA_BASE}/series/query`, {
    params: `attributesToRetrieve=["objectID","name","poster_uri","path","type","rating"]&hitsPerPage=30&page=0&query=${encodeURIComponent(query)}`
  }, { headers: ALGOLIA_HEADERS, timeout: 15000 });
  return res.data?.hits || [];
}

async function fetchCanime(body) {
  const res = await fetch(CANIME_API, { method: "POST", headers: GOOGLEBOT_HEADERS, body: JSON.stringify(body) });
  return res.json();
}

async function handler(m, { sock }) {
  const text = m.args.join(" ");
  
  if (!text) {
    return m.reply(`🎌 *بحث أنمي*\n\n📌 ${m.prefix}${m.command} ناروتو`);
  }

  m.react('🔍');

  try {
    const results = await searchAnime(text);
    if (!results.length) { m.react('❌'); return m.reply('❌ لا توجد نتائج'); }

    const first = results[0];
    const poster = first.poster_uri || first.poster || DEFAULT_IMAGE;
    
    let thumbBuffer;
    try {
      const { data } = await axios.get(poster, { responseType: 'arraybuffer', timeout: 10000 });
      thumbBuffer = await sharp(Buffer.from(data)).resize(300, 170).jpeg().toBuffer();
    } catch {
      thumbBuffer = await sharp(fs.readFileSync(config.assets["maro"])).resize(300, 170).jpeg().toBuffer();
    }

    // زر لكل أنمي → يستدعي .تحميل_انمي بالاسم
    const rows = results.slice(0, 10).map((anime, i) => ({
      title: `${i + 1}. ${anime.name}`,
      description: `⭐ ${anime.rating?.rate || '?'} | 📺 ${anime.type || '?'}`,
      id: `.تحميل_انمي ${anime.name} 1`,
    }));

    const content = {
      buttonsMessage: {
        buttons: [{
          buttonText: { displayText: '📋 اختر أنمي للتحميل' },
          buttonId: 'list',
          type: 1,
          nativeFlowInfo: {
            name: 'single_select',
            paramsJson: JSON.stringify({
              title: `🔍 ${text}`,
              sections: [{ title: 'اختر (الحلقة 1)', rows }],
            }),
          },
        }],
        locationMessage: {
          jpegThumbnail: thumbBuffer,
          name: first.name,
          address: `⭐ ${first.rating?.rate || '?'} | ${results.length} نتيجة`
        },
        contentText: `🎌 *${first.name}*\n⭐ ${first.rating?.rate || '?'}\n📊 ${results.length} نتيجة\n\n📌 اضغط للتحميل`,
        footerText: '🎌 أنمي',
        headerType: 6,
      },
    };

    const msg = generateWAMessageFromContent(m.chat, content, { userJid: sock.user.jid });
    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    m.react('✅');

  } catch (error) {
    console.log(error);
    m.react('❌');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };