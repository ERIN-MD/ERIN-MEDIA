import axios from 'axios';
import * as cheerio from 'cheerio';
import config from '../../config.js';
import te from '../../src/lib/maro-error.js';

const BASE_URL = "https://happymod.net";
const HEADERS = { "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36" };

const pluginConfig = {
  name: 'happydl',
  alias: [],
  category: 'downloader',
  description: 'تحميل من هابي مود',
  usage: '.happydl <رابط>',
  example: '.happydl https://happymod.net/...',
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 10, energi: 1, isEnabled: true
};

async function handler(m, { sock }) {
  const url = m.text?.trim();

  if (!url) {
    return m.reply(`🎮 *تحميل هابي مود*\n\n📌 مثال: \`${m.prefix}happydl https://happymod.net/...\``);
  }

  m.react('⏳');

  try {
    const { data } = await axios.get(url, { headers: HEADERS });
    const $ = cheerio.load(data);
    const title = $(".pdt-info-title").first().text().trim() || 'تطبيق';
    const version = $(".table-box table.content-table tr").eq(3).find("td").eq(1).text().trim() || '';
    const size = $(".table-box table.content-table tr").eq(2).find("td").eq(1).text().trim() || '';
    
    let download = $("a.m-download-btn").attr("href") || null;
    if (download?.startsWith("/")) download = BASE_URL + download;

    if (!download) {
      m.react('❌');
      return m.reply('❌ رابط التحميل غير موجود');
    }

    const caption = `✅ *${title}*\n📦 ${size} | 📌 ${version}`;

    await sock.sendMessage(m.chat, {
      document: { url: download },
      mimetype: 'application/vnd.android.package-archive',
      fileName: `${title}.apk`,
      caption: caption
    }, { quoted: m });

    m.react('✅');
  } catch (error) {
    console.error('HappyDL Error:', error);
    m.react('❌');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };