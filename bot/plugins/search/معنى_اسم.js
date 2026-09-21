import axios from 'axios';
import * as cheerio from 'cheerio';
import config from '../../config.js';
import te from '../../src/lib/maro-error.js';

const cache = new Map();

async function cekArtiNama(nama) {
  if (cache.has(nama)) return cache.get(nama);
  await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
  
  const { data } = await axios.post("https://berinama.com/wp-json/baby-names/v1/meaning", { name: nama }, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36",
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Origin": "https://berinama.com",
      "Referer": "https://berinama.com/"
    },
    timeout: 15000
  });
  
  const $ = cheerio.load(data.meaning);
  const result = $("p").map((_, el) => $(el).text().trim()).get().join("\n\n");
  
  const res = { status: true, name: data.name, result };
  cache.set(nama, res);
  setTimeout(() => cache.delete(nama), 600000);
  
  return res;
}

const pluginConfig = {
  name: 'معنى_اسم',
  alias: ['artinama'],
  category: 'search',
  description: 'معرفة معنى الاسم',
  usage: '.معنى_اسم <اسم>',
  example: '.معنى_اسم محمد',
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 10, energi: 1, isEnabled: true
};

async function handler(m, { sock }) {
  const nama = m.args.join(' ')?.trim();

  if (!nama) {
    return m.reply(`📛 *معنى_اسم*\n\n📌 مثال: \`${m.prefix}معنى_اسم محمد\``);
  }

  m.react('🔍');

  try {
    const res = await cekArtiNama(nama);

    if (!res?.status || !res?.result) {
      m.react('❌');
      return m.reply('❌ لم يتم العثور على معنى الاسم');
    }

    const caption = `📛 *${res.name}*\n\n${res.result}`;
    await m.reply(caption);
    m.react('✅');
  } catch (error) {
    console.error('ArtiNama Error:', error);
    m.react('❌');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };