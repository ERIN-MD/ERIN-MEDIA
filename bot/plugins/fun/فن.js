import axios from 'axios';
import * as cheerio from 'cheerio';
import config from '../../config.js';
import te from '../../src/lib/maro-error.js';
import { AIRich } from '../../src/lib/maro-builder.js';

async function searchEmojiArt(keyword) {
  const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  const BASE_URL = 'https://emojicombos.com';
  
  try {
    const searchRes = await axios.get(`${BASE_URL}/api/search?keyphrase=${encodeURIComponent(keyword)}`, {
      headers: { 'User-Agent': USER_AGENT, 'Referer': BASE_URL + '/', 'Accept': 'text/html' },
      timeout: 10000
    });

    let url = searchRes.data.trim();
    if (url.startsWith('/')) url = BASE_URL + url;

    const pageResp = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 10000
    });

    const html = pageResp.data;
    const $ = cheerio.load(html);
    const results = [];

    $('div.combo-ctn').each((_, comboDiv) => {
      const emojisDiv = $(comboDiv).find('div.emojis');
      if (!emojisDiv.length) return;
      const dataType = emojisDiv.attr('data-type');
      if (dataType !== 'dot_art' && dataType !== 'text_art') return;
      const artText = emojisDiv.text().trim();
      if (!artText || artText.length < 5) return;

      const keywords = [];
      $(comboDiv).find('div.keywords a').each((_, a) => keywords.push($(a).text().trim()));

      results.push({ art: artText, keywords, type: dataType });
    });

    if (!results.length) {
      const emojiMatches = html.match(/<div[^>]*class="[^"]*emojis[^"]*"[^>]*>([\s\S]*?)<\/div>/gi) || [];
      for (const match of emojiMatches) {
        const text = match.replace(/<[^>]*>/g, '').trim();
        if (text && text.length > 5 && text.length < 500) {
          results.push({ art: text, keywords: [], type: 'text_art' });
        }
      }
    }

    return results;
  } catch {
    return [];
  }
}

function isDotArt(text) {
  // الفن النقطي بيحتوي على نقاط ومسافات كتير
  const dots = (text.match(/[.]/g) || []).length;
  const spaces = (text.match(/\s/g) || []).length;
  return dots > 20 || spaces > 30;
}

const pluginConfig = {
  name: 'فن',
  alias: ['رسمة', 'اموجي', 'emojiart'],
  category: 'fun',
  description: 'بحث عن رسومات إيموجي فنية',
  usage: '.فن <كلمة>',
  example: '.فن cat',
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 10, energi: 1, isEnabled: true
};

async function handler(m, { sock }) {
  const text = m.args.join(' ')?.trim();

  if (!text) {
    return m.reply(`🎨 *فن الإيموجي*\n\n📌 مثال: \`${m.prefix}فن cat\`\n\`${m.prefix}فن حب\``);
  }

  m.react('🔍');

  try {
    const results = await searchEmojiArt(text);

    if (!results || results.length === 0) {
      m.react('❌');
      return m.reply(`❌ لم يتم العثور على نتائج لـ *${text}*`);
    }

    // فصل النتائج: dot_art (ميتا) و text_art (نص عادي)
    const dotArts = results.filter(r => r.type === 'dot_art' || isDotArt(r.art));
    const textArts = results.filter(r => !dotArts.includes(r));

    // إذا في فن نقطي، استخدم AIRich
    if (dotArts.length > 0) {
      const rich = new AIRich(sock);
      rich.setTitle('🎨 فن الإيموجي');
      rich.setFooter(`🔍 ${text} | 📊 ${results.length} رسمة • ${new Date().toLocaleDateString('ar-EG')}`);

      // جدول ملخص
      rich.addText(`# 🎨 نتائج: *${text}*`);
      rich.addTable([
        ['📊 الإجمالي', '🟢 نقطية', '📝 نصية'],
        [String(results.length), String(dotArts.length), String(textArts.length)]
      ]);

      // عرض الفنون النقطية في كودات
      const maxShow = Math.min(dotArts.length, 8);
      for (let i = 0; i < maxShow; i++) {
        const item = dotArts[i];
        const kw = item.keywords.slice(0, 3).join(' • ');
        rich.addText(`*${i + 1}.* 🟢 فن نقطي${kw ? ` | ${kw}` : ''}`);
        rich.addCode('txt', item.art);
      }

      if (dotArts.length > maxShow) {
        rich.addTip(`📌 + ${dotArts.length - maxShow} رسمة نقطية إضافية`);
      }

      // لو في نصوص عادية، نضيفهم كنص في الآخر
      if (textArts.length > 0) {
        let txtSummary = '';
        textArts.slice(0, 3).forEach((item, i) => {
          txtSummary += `*${i + 1}.* 📝 ${item.art.substring(0, 50)}...\n`;
        });
        rich.addText(`\n📝 *نصوص إيموجي:*\n${txtSummary}`);
        if (textArts.length > 3) rich.addTip(`+ ${textArts.length - 3} نص إضافي`);
      }

      await rich.send(m.chat, { quoted: m });
    } else {
      // لو كلها نصوص عادية، عرض بسيط
      let reply = `🎨 *نتائج: ${text}*\n📊 ${results.length} رسمة\n\n`;
      results.slice(0, 5).forEach((item, i) => {
        reply += `*${i + 1}.*\n\`\`\`\n${item.art}\n\`\`\`\n\n`;
      });
      if (results.length > 5) reply += `... و ${results.length - 5} رسمة أخرى`;
      await m.reply(reply);
    }

    m.react('✅');
  } catch (error) {
    console.error('EmojiArt Error:', error);
    m.react('❌');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };