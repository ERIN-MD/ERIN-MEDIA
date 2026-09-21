import axios from 'axios';
import config from '../../config.js';
import te from '../../src/lib/maro-error.js';

class DramaBox {
  constructor() {
    this.buildId = "dramabox_prod_20260523";
    this.headers = {
      "x-nextjs-data": "1",
      "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36",
      "Accept": "*/*",
      "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "Accept-Encoding": "gzip, deflate, br",
      "Referer": "https://www.dramabox.com/",
      "Origin": "https://www.dramabox.com"
    };
  }

  async search(query) {
    try {
      const { data } = await axios.get(
        `https://www.dramabox.com/_next/data/${this.buildId}/in/search.json`,
        {
          params: { searchValue: query },
          headers: {
            ...this.headers,
            Referer: `https://www.dramabox.com/in/search?searchValue=${encodeURIComponent(query)}`
          },
          timeout: 15000
        }
      );
      const books = data?.pageProps?.bookList || [];
      return books.map(v => ({
        id: v.bookId, title: v.bookName, titleEn: v.bookNameEn,
        cover: v.coverWap, description: v.introduction,
        chapters: v.totalChapterNum, freeChapters: v.freeChapterNum,
        views: v.clickNum, rating: v.commentScore,
        url: `https://www.dramabox.com/in/drama/${v.bookId}/${v.bookNameEn}`
      }));
    } catch (err) {
      console.error('DramaBox Search Error:', err.message);
      return [];
    }
  }
}

const pluginConfig = {
  name: 'دراما',
  alias: ['drama', 'dramabox'],
  category: 'search',
  description: 'بحث عن مسلسلات دراما بوكس',
  usage: '.دراما <بحث>',
  example: '.دراما love',
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 10, energi: 1, isEnabled: true
};

async function handler(m, { sock }) {
  const query = m.args.join(' ')?.trim();

  if (!query) {
    return m.reply(`🎬 *دراما بوكس*\n\n📌 مثال: \`${m.prefix}دراما love\``);
  }

  m.react('🔍');

  try {
    const dramabox = new DramaBox();
    const results = await dramabox.search(query);

    if (!results || results.length === 0) {
      m.react('❌');
      return m.reply('❌ لم يتم العثور على نتائج');
    }

    const first = results[0];
    const caption = `🎬 *${first.title}*\n📝 ${first.description?.substring(0, 100) || ''}...\n⭐ ${first.rating || '?'} | 👀 ${first.views || '?'}\n📖 ${first.chapters || '?'} فصل\n🔗 ${first.url}`;

    if (first.cover) {
      await sock.sendMessage(m.chat, {
        image: { url: first.cover },
        caption: caption,
        footer: '🎬 دراما بوكس'
      }, { quoted: m });
    } else {
      await m.reply(caption);
    }

    m.react('✅');
  } catch (error) {
    console.error('DramaBox Error:', error);
    m.react('❌');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };