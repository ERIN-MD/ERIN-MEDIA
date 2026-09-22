const pluginConfig = {
  name: "تحميل_انمي",
  alias: ["dlanime", "episode", "انمي", "anidl"],
  category: "downloader",
  description: "تحميل حلقات الأنمي - ابحث عن رابط الحلقة ثم حمل",
  usage: ".تحميل_انمي [رابط حلقة من otakudesu]",
  example: ".تحميل_انمي https://otakudesu.blog/episode/tykmt-episode-2-sub-indo",
  isOwner: false,
  isGroup: true,
  isPrivate: true,
  cooldown: 30,
  energi: 3,
  isEnabled: true,
};

const HEADERS = {
  "User-Agent": "Googlebot/2.1 (+http://www.google.com/bot.html)",
  "Referer": "https://canime.web.id/",
  "Content-Type": "application/json"
};

async function fetchAPI(body) {
  const res = await fetch("https://canime.web.id/api.php", {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(body)
  });
  return res.json();
}

async function handler(m, { sock }) {
  const url = m.args?.[0] || '';
  
  if (!url || !url.includes('otakudesu')) {
    return m.reply(
      `🎬 *تحميل أنمي*\n\n` +
      `📝 *الطريقة:*\n` +
      `1. ابحث عن الأنمي في otakudesu.blog\n` +
      `2. انسخ رابط الحلقة\n` +
      `3. استخدم الأمر:\n\n` +
      `*.تحميل_انمي* https://otakudesu.blog/episode/...\n\n` +
      `📋 *الجودة:* 720p HD\n` +
      `⚡ *السيرفر:* filedon (الأسرع)`
    );
  }

  await m.react('⏳');
  await m.reply('🔍 *جاري البحث عن الحلقة...*');

  try {
    // Resolve
    const info = await fetchAPI({ action: "resolve", url });
    if (!info.detail) throw new Error('لم يتم العثور على الحلقة');

    await m.reply(`✅ *تم العثور:* ${info.detail.title}\n📥 *جاري التحميل...*`);

    // اختيار السيرفر
    const mirror = info.mirrors.find(m => m.server === 'filedon' && m.quality === '720p') 
                || info.mirrors.find(m => m.quality === '720p')
                || info.mirrors[0];

    if (!mirror) throw new Error('لا توجد سيرفرات متاحة');

    // Start download
    const task = await fetchAPI({ 
      action: "start", 
      url, 
      quality: mirror.quality, 
      server: mirror.server 
    });

    if (!task.url) throw new Error('فشل التحميل');

    // إرسال الفيديو
    await m.reply('📤 *جاري إرسال الحلقة...*');
    
    await sock.sendMessage(m.chat, {
      video: { url: task.url },
      caption: `🎬 *${info.detail.title}*\n\n` +
               `⭐ Score: ${info.detail.score || 'N/A'}\n` +
               `📊 الجودة: ${task.quality}\n` +
               `🖥️ السيرفر: ${task.server}\n` +
               `🎭 النوع: ${info.detail.genres?.join(', ') || 'N/A'}\n\n` +
               `📥 *تم التحميل بواسطة البوت*`,
      mimetype: 'video/mp4'
    }, { quoted: m });

    await m.react('✅');

  } catch (e) {
    console.error('Anime DL Error:', e);
    await m.reply(`❌ *فشل التحميل*\n${e.message}`);
    await m.react('❌');
  }
}

export { pluginConfig as config, handler };