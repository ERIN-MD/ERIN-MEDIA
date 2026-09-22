import config from '../../config.js';
import te from '../../src/lib/maro-error.js';
import axios from 'axios';

async function fbStalk(username) {
    try {
        const { data } = await axios.get(`https://www.facebook.com/${username}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            timeout: 30000
        });

        const title = data.match(/<title>(.*?)<\/title>/)?.[1] || '';
        const ogTitle = data.match(/<meta property="og:title" content="(.*?)"/)?.[1] || '';
        const ogDescription = data.match(/<meta property="og:description" content="(.*?)"/)?.[1] || '';
        const ogImage = data.match(/<meta property="og:image" content="(.*?)"/)?.[1] || '';
        const ogUrl = data.match(/<meta property="og:url" content="(.*?)"/)?.[1] || '';

        return {
            status: true,
            result: {
                name: ogTitle || title,
                description: ogDescription,
                image: ogImage,
                url: ogUrl,
                title: title
            }
        };
    } catch (e) {
        return {
            status: false,
            message: e.message
        };
    }
}

const pluginConfig = {
    name: 'تجسس_فيسبوك',
    alias: [],
    category: 'stalker',
    description: 'استخراج معلومات حساب فيسبوك',
    usage: '.تجسس_فيسبوك <معرف>',
    example: '.تجسس_فيسبوك rozhak.official',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
};

async function handler(m, { sock }) {
    const username = m.args.join(' ')?.trim() || m.text?.trim();

    if (!username) {
        return m.reply(`📘 *تجسس_فيسبوك*\n\n📌 مثال: \`${m.prefix}تجسس_فيسبوك rozhak.official\``);
    }

    const cleanUsername = username.replace(/https?:\/\/.*?facebook\.com\//, '').replace(/[^a-zA-Z0-9._-]/g, '');

    if (!cleanUsername) {
        return m.reply('❌ اسم مستخدم غير صالح');
    }

    m.react('🔍');

    try {
        const res = await fbStalk(cleanUsername);

        if (!res?.status || !res?.result) {
            m.react('❌');
            return m.reply('❌ لم يتم العثور على الحساب');
        }

        const result = res.result;
        const caption = `📘 *${result.name || cleanUsername}*\n📝 ${result.description || 'لا يوجد وصف'}\n🔗 ${result.url || `https://facebook.com/${cleanUsername}`}`;

        if (result.image) {
            await sock.sendMessage(m.chat, {
                image: { url: result.image },
                caption: caption,
                footer: '📘 تجسس_فيسبوك'
            }, { quoted: m });
        } else {
            await m.reply(caption);
        }

        m.react('✅');
    } catch (error) {
        console.error('Facebook Error:', error);
        m.react('❌');
        m.reply(te(m.prefix, m.command, m.pushName));
    }
}

export { pluginConfig as config, handler };