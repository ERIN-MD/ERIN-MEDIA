import { hotReloadPlugin } from '../../src/lib/maro-plugins.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const pluginConfig = {
    name: 'تثبيت',
    alias: ['install', 'addplugin'],
    category: 'owner',
    description: 'تثبيت بلوقن جديد من رابط مباشر أو GitHub raw',
    usage: '.تثبيت <القسم> <الرابط>',
    example: '.تثبيت tools https://raw.githubusercontent.com/user/repo/main/test.js',
    isOwner: true,
    isEnabled: true
};

async function handler(m, { text, args }) {
    if (args.length < 2) {
        return m.reply(`⚠️ الاستخدام: ${m.prefix}${m.command} <القسم> <الرابط>\nمثال: ${m.prefix}${m.command} tools https://.../test.js`);
    }

    const category = args[0].toLowerCase();
    let url = args[1];

    // تحويل روابط GitHub العادية إلى Raw إذا لزم الأمر
    if (url.includes('github.com') && !url.includes('raw.githubusercontent.com')) {
        url = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }

    m.react('⏳');
    try {
        const response = await axios.get(url);
        const code = response.data;

        if (typeof code !== 'string' || !code.includes('export')) {
            throw new Error('الرابط لا يحتوي على كود بلوقن صالح.');
        }

        const fileName = path.basename(url);
        const dirPath = path.join(process.cwd(), 'plugins', category);
        
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        const filePath = path.join(dirPath, fileName);
        fs.writeFileSync(filePath, code);

        const result = await hotReloadPlugin(filePath);
        if (result.success) {
            m.react('✅');
            m.reply(`✅ تم تثبيت البلوقن بنجاح!\n📁 القسم: ${category}\n📄 الملف: ${fileName}`);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        m.react('❌');
        m.reply(`❌ فشل التثبيت: ${error.message}`);
    }
}

export { pluginConfig as config, handler };
