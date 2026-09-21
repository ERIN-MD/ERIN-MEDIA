import axios from 'axios';
import config from '../../config.js';
import te from '../../src/lib/maro-error.js';

// RSS Parser بسيط بدون مكتبة خارجية
async function parseRSS(feedUrl, limit = 10) {
  const { data } = await axios.get(feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    timeout: 15000
  });

  // استخراج العناصر من XML
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(data)) !== null && items.length < limit) {
    const xml = match[1];
    const title = (xml.match(/<title>(.*?)<\/title>/i) || [])[1] || '';
    const link = (xml.match(/<link>(.*?)<\/link>/i) || [])[1] || '';
    const pubDate = (xml.match(/<pubDate>(.*?)<\/pubDate>/i) || [])[1] || '';
    const description = ((xml.match(/<description>(.*?)<\/description>/i) || [])[1] || '').replace(/<[^>]*>/g, '').substring(0, 200);

    if (title && link) {
      items.push({ title, link, pubDate, description });
    }
  }

  // العنوان
  const feedTitle = (data.match(/<title>(.*?)<\/title>/i) || [])[1] || 'RSS Feed';

  return { feedTitle, items };
}

const pluginConfig = {
  name: 'اخبار',
  alias: ['news', 'rss'],
  category: 'search',
  description: 'جلب آخر الأخبار من RSS',
  usage: '.اخبار <رابط RSS>',
  example: '.اخبار https://rss.cnn.com/rss/edition.rss',
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 15, energi: 1, isEnabled: true
};

async function handler(m, { sock }) {
  const url = m.args.join(' ')?.trim() || m.text?.trim();

  if (!url) {
    return m.reply(`📰 *اخبار RSS*\n\n📌 مثال: \`${m.prefix}اخبار https://rss.cnn.com/rss/edition.rss\`\n\n📋 *روابط مشهورة:*\n• https://feeds.bbci.co.uk/arabic/rss.xml\n• https://rss.cnn.com/rss/edition.rss`);
  }

  m.react('📰');

  try {
    const { feedTitle, items } = await parseRSS(url, 10);

    if (!items.length) {
      m.react('❌');
      return m.reply('❌ لا توجد أخبار');
    }

    let text = `📰 *${feedTitle}*\n📊 ${items.length} خبر\n\n`;
    items.forEach((item, i) => {
      text += `*${i + 1}.* ${item.title}\n📅 ${item.pubDate || '?'}\n🔗 ${item.link}\n${item.description ? '📝 ' + item.description + '\n' : ''}\n`;
    });

    await m.reply(text);
    m.react('✅');
  } catch (error) {
    console.error('RSS Error:', error);
    m.react('❌');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };