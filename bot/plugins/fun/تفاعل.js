import fs from 'fs';
import path from 'path';

const AUTO_REACT_PATH = path.join(process.cwd(), 'data', 'autoReact.json');
const EMOJIS = ['👍', '❤️', '😂', '🔥', '🎉', '👏', '😍', '🤔', '😎', '🥳', '✨', '💪', '👑', '⭐', '🌸', '🎈', '💡', '🔮', '🎨', '🏆', '😊', '🙌', '🤝', '💯', '⚡', '🌟', '🍕', '🍦', '🎵', '💎'];

export function loadAutoReact() {
    try {
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        if (!fs.existsSync(AUTO_REACT_PATH)) {
            fs.writeFileSync(AUTO_REACT_PATH, JSON.stringify({}, null, 2));
            return {};
        }
        const data = JSON.parse(fs.readFileSync(AUTO_REACT_PATH, 'utf8'));
        
        // تحويل البيانات القديمة من true → { emoji: null }
        let updated = false;
        for (const key in data) {
            if (data[key] === true) {
                data[key] = { emoji: null };
                updated = true;
            }
        }
        if (updated) {
            fs.writeFileSync(AUTO_REACT_PATH, JSON.stringify(data, null, 2));
        }
        
        return data;
    } catch (e) { return {}; }
}

export function saveAutoReact(data) {
    try { fs.writeFileSync(AUTO_REACT_PATH, JSON.stringify(data, null, 2)); return true; }
    catch (e) { return false; }
}

export async function checkAutoReact(m, sock) {
    if (!m?.isGroup) return;
    if (!m?.sender) return;
    if (m?.key?.fromMe) return;
    if (m?.isCommand) return;
    
    // اقرا الملف مباشرة بدون كاش
    let data = {};
    try {
        if (fs.existsSync(AUTO_REACT_PATH)) {
            data = JSON.parse(fs.readFileSync(AUTO_REACT_PATH, 'utf8'));
        }
    } catch (e) { return; }
    
    const config = data[m.sender];
    if (!config) return;
    
    try {
        let emoji;
        if (typeof config === 'object' && config.emoji && config.emoji !== null) {
            emoji = config.emoji;
        } else {
            emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
        }
        
        await sock.sendMessage(m.chat, { react: { text: emoji, key: m.key } });
    } catch {}
}

const pluginConfig = {
    name: 'تفاعل',
    alias: ['autoReact'],
    category: 'fun',
    description: '😊 تفعيل/تعطيل التفاعل التلقائي بإيموجي مخصص',
    usage: '.تفاعل <تشغيل/إيقاف> [إيموجي]',
    example: '.تفاعل تشغيل 🍷\n.تفاعل تشغيل\n.تفاعل إيقاف',
    isOwner: false, isPremium: false, isGroup: true, isPrivate: false,
    cooldown: 5, energi: 0, isEnabled: true
};

async function handler(m) {
    const args = m.args;
    const action = args[0]?.toLowerCase();
    const customEmoji = args[1] || null;
    
    // اقرا الملف مباشرة
    let data = {};
    try {
        if (fs.existsSync(AUTO_REACT_PATH)) {
            data = JSON.parse(fs.readFileSync(AUTO_REACT_PATH, 'utf8'));
        }
    } catch (e) {}
    
    const currentConfig = data[m.sender];
    const isEnabled = currentConfig && currentConfig !== null;

    if (!action) {
        let status = '🔴 معطل';
        let emojiInfo = '';
        if (isEnabled) {
            status = '🟢 مفعل';
            emojiInfo = currentConfig.emoji ? `\n🎯 الإيموجي: ${currentConfig.emoji}` : '\n🎲 الإيموجي: عشوائي';
        }
        return m.reply(`😊 *التفاعل التلقائي*\n📊 الحالة: ${status}${emojiInfo}\n\n*.تفاعل تشغيل* لتشغيل عشوائي\n*.تفاعل تشغيل 🍷* لإيموجي مخصص\n*.تفاعل إيقاف* للتعطيل`);
    }

    if (action === 'تشغيل' || action === 'on') {
        if (customEmoji) {
            data[m.sender] = { emoji: customEmoji };
            saveAutoReact(data);
            return m.reply(`✅ تم تفعيل التفاعل التلقائي\n🎯 الإيموجي: ${customEmoji}`);
        } else {
            if (isEnabled && currentConfig.emoji === null) return m.reply('⚠️ مفعل بالفعل (عشوائي)');
            data[m.sender] = { emoji: null };
            saveAutoReact(data);
            return m.reply('✅ تم تفعيل التفاعل التلقائي\n🎲 الإيموجي: عشوائي');
        }
    }
    
    if (action === 'ايقاف' || action === 'off') {
        if (!isEnabled) return m.reply('⚠️ معطل بالفعل');
        delete data[m.sender];
        saveAutoReact(data);
        return m.reply('❌ تم تعطيل التفاعل التلقائي');
    }
    
    return m.reply('❌ استخدم:\n*.تفاعل تشغيل* - عشوائي\n*.تفاعل تشغيل 🍷* - إيموجي مخصص\n*.تفاعل إيقاف* - تعطيل');
}

export { pluginConfig as config, handler };