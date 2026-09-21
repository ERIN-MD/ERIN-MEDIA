import cloudscraper from 'cloudscraper';

const pluginConfig = {
  name: 'cfbypass',
  alias: ['bypass', 'scrape'],
  category: 'tools',
  description: 'تجاوز حماية Cloudflare واستخراج بيانات الصفحة',
  usage: '.cfbypass <رابط>',
  example: '.cfbypass https://example.com',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 30,
  energi: 1,
  isEnabled: true,
}

async function handler(m, { sock, text }) {
  const targetUrl = text.trim() || "https://www.scrapingcourse.com/cloudflare-challenge";

  await m.react('⏳');
  await m.reply(`⏳ جاري تجاوز الحماية لـ:\n${targetUrl}\n\n_يرجى الانتظار..._`);

  try {
    const html = await cloudscraper.get({
      uri: targetUrl,
      method: 'GET',
      followRedirect: true,
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : 'غير معروف';

    const caption = `✅ *تم بنجاح*\n\n` +
                    `◦ *العنوان* : ${title}\n` +
                    `◦ *الرابط* : ${targetUrl}\n` +
                    `◦ *الحجم* : ${(html.length / 1024).toFixed(2)} كيلوبايت\n\n` +
                    `_جاري إرسال الكود المصدري..._`;

    await sock.sendMessage(m.chat, { 
      document: Buffer.from(html, 'utf-8'),
      mimetype: 'text/html', 
      fileName: `source_${Date.now()}.html`,
      caption: caption
    }, { quoted: m });

    await m.react('✅');
  } catch (error) {
    console.error(error);
    await m.react('❌');
    m.reply(`❌ حدث خطأ:\n${error.message}`);
  }
}

export default { config: pluginConfig, handler }