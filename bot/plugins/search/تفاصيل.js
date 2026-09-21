import yts from 'yt-search';

const pluginConfig = {
    name: 'تفاصيل',
    alias: ['info'],
    category: 'search',
    description: 'عرض تفاصيل فيديو يوتيوب وخيارات التحميل',
    usage: '.تفاصيل <رابط>',
    example: '.تفاصيل https://youtu.be/xxxxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

function extractVideoId(url) {
    if (!url) return null;
    
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
        /(?:youtu\.be\/)([^?\n#]+)/,
        /(?:youtube\.com\/embed\/)([^?\n#]+)/,
        /(?:youtube\.com\/v\/)([^?\n#]+)/,
        /(?:youtube\.com\/shorts\/)([^?\n#]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
    
    return null;
}

function formatDuration(duration) {
    if (!duration) return 'غير معروف';
    
    if (typeof duration === 'number') {
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = duration % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return duration.toString();
}

function formatViews(views) {
    if (!views) return 'غير معروف';
    
    if (typeof views === 'number') {
        if (views >= 1000000) {
            return (views / 1000000).toFixed(1) + 'M';
        }
        if (views >= 1000) {
            return (views / 1000).toFixed(1) + 'K';
        }
        return views.toLocaleString();
    }
    
    return views.toString();
}

async function handler(m) {
    const url = m.text?.trim();
    
    if (!url) {
        return m.reply(
            `📹 *تفاصيل فيديو يوتيوب*\n\n` +
            `📝 *الاستخدام:*\n` +
            `.تفاصيل <رابط>\n\n` +
            `💡 *مثال:*\n` +
            `.تفاصيل https://youtu.be/xxxxx`
        );
    }
    
    await m.react('🔍');
    
    try {
        const videoId = extractVideoId(url);
        let video;
        
        if (videoId) {
            video = await yts({ videoId });
        }
        
        if (!video || !video.title) {
            const altSearch = await yts(url);
            if (!altSearch || !altSearch.videos || !altSearch.videos.length) {
                await m.react('❌');
                return m.reply(`❌ *لم يتم العثور على الفيديو*\nتأكد من صحة الرابط`);
            }
            video = altSearch.videos[0];
        }
        
        const videoUrl = video.url;
        const duration = formatDuration(video.duration || video.timestamp);
        const views = formatViews(video.views);
        
        let txt = `🎬 *${video.title}*\n\n`;
        txt += `📺 *القناة:* ${video.author?.name || video.channel || 'غير معروف'}\n`;
        txt += `⏱️ *المدة:* ${duration}\n`;
        txt += `👁️ *المشاهدات:* ${views}\n`;
        txt += `📅 *تاريخ النشر:* ${video.ago || video.uploadDate || 'غير معروف'}\n`;
        txt += `━━━━━━━━━━━━━━━━━━\n`;
        txt += `🔗 *الرابط:* ${videoUrl}\n\n`;
        txt += `⚡ *خيارات التحميل:*\n`;
        txt += `.يوت_صوت ${videoUrl}\n`;
        txt += `.يوت_فيديو ${videoUrl}`;
        
        await m.reply(txt);
        await m.react('✅');
        
    } catch (error) {
        console.error('❌ خطأ في جلب التفاصيل:', error);
        await m.react('❌');
        await m.reply(`❌ *حدث خطأ أثناء جلب التفاصيل*\nحاول مرة أخرى.`);
    }
}

export { pluginConfig as config, handler };