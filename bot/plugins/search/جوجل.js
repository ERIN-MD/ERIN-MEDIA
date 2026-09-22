import axios from 'axios';
import * as cheerio from 'cheerio';
import te from '../../src/lib/maro-error.js';

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "جوجل",
  alias: ["google"],
  category: "search",
  description: "بحث في جوجل",
  usage: ".جوجل <بحث>",
  example: ".جوجل الذكاء الاصطناعي",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 5, energi: 0, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🔍 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m) {
  const query = m.text?.trim();

  if (!query) {
    return m.reply(`🔍 *جوجل*\n\n📌 مثال: \`${m.prefix}جوجل الذكاء الاصطناعي\``);
  }

  m.react('🔍');

  try {
    // استخدام DuckDuckGo HTML
    const { data } = await axios.get(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 }
    );

    const $ = cheerio.load(data);
    const results = [];

    $('.result').each((i, el) => {
      if (i >= 5) return;
      const title = $(el).find('.result__title').text().trim();
      const link = $(el).find('.result__url').text().trim();
      const desc = $(el).find('.result__snippet').text().trim();
      if (title) results.push({ title, link, desc });
    });

    if (!results.length) {
      m.react('❌');
      return m.reply(`❌ لا توجد نتائج لـ: *${query}*`);
    }

    let txt = `🔍 *جوجل*\n\n> البحث: *${query}*\n\n`;
    results.forEach((r, i) => {
      txt += `*${i + 1}.* ${r.title}\n`;
      txt += `   ├ 🔗 ${r.link}\n`;
      txt += `   └ 📝 ${r.desc}\n\n`;
    });

    m.reply(txt.trim());
    m.react('✅');

  } catch (e) {
    m.react('❌');
    m.reply('❌ فشل البحث، حاول لاحقاً');
  }
}

export { pluginConfig as config, handler };