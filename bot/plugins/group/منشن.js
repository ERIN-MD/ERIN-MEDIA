import {
  getParticipantJid,
  getParticipantJids,
} from "../../src/lib/maro-lid.js";
import te from "../../src/lib/maro-error.js";
import { generateWAMessageFromContent, proto } from "maro";
import { getDatabase } from "../../src/lib/maro-database.js";
import fs from 'fs';
import path from 'path';
import moment from 'moment-timezone';

const limitsPath = path.join(process.cwd(), 'data', 'mention_limits.json');

function loadLimits() {
    try { if (fs.existsSync(limitsPath)) return JSON.parse(fs.readFileSync(limitsPath, 'utf8')); } catch (e) {}
    return {};
}

function saveLimits(data) {
    if (!fs.existsSync(path.dirname(limitsPath))) fs.mkdirSync(path.dirname(limitsPath), { recursive: true });
    fs.writeFileSync(limitsPath, JSON.stringify(data, null, 2));
}

const pluginConfig = {
  name: "منشن",
  alias: ["الكل"],
  category: "group",
  description: "نظام المنشن المطور مع قائمة تفاعلية وحدود استخدام",
  usage: ".منشن <الكل/اعضاء/مشرفين> أو .منشن تحديد <عدد>",
  example: ".منشن الكل",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 30,
  energi: 0,
  isEnabled: true,
  isAdmin: true,
  isBotAdmin: false,
};

async function handler(m, { sock }) {
    const args = m.args || [];
    const action = args[0]?.toLowerCase();
    const limits = loadLimits();
    const groupId = m.chat;

    // ====================== تحديد الحد ======================
    if (action === 'تحديد' || action === 'حد') {
        if (!m.isOwner) return m.reply('❌ هذا الأمر متاح فقط للمطور.');
        const limit = parseInt(args[1]);
        if (isNaN(limit) || limit <= 0) return m.reply('❌ الرجاء إدخال رقم صحيح.');
        
        if (!limits[groupId]) limits[groupId] = { limit: 3, usage_all: 0, usage_members: 0, usage_admins: 0 };
        limits[groupId].limit = limit;
        saveLimits(limits);
        return m.reply(`✨ تم تعيين الحد الأقصى إلى *${limit}* مرة لكل نوع.`);
    }

    // ====================== عرض القائمة التفاعلية ======================
    if (!action || (action !== 'الكل' && action !== 'اعضاء' && action !== 'مشرفين')) {
        const content = {
            buttonsMessage: {
                buttons: [
                    { buttonId: `.منشن الكل`, buttonText: { displayText: '👥 منشن الكل' }, type: 1 },
                    { buttonId: `.منشن اعضاء`, buttonText: { displayText: '🌟 منشن الأعضاء' }, type: 1 },
                    { buttonId: `.منشن مشرفين`, buttonText: { displayText: '👑 منشن المشرفين' }, type: 1 },
                ],
                contentText: `*◞👥 قــائـمـة أوامـر المنـشـن*\n*اخـتـر النـوع المـناسـب*\n> 👥 منشن الكل\n> 🌟 منشن الأعضاء فقط\n> 👑 منشن المشرفين`,
                footerText: 'نظام المنشن',
                headerType: 1,
            },
        };
        const msg = generateWAMessageFromContent(m.chat, content, { quoted: m });
        return sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    }

    // ====================== تنفيذ المنشن ======================
    let type;
    if (action === 'الكل') type = 'all';
    else if (action === 'اعضاء') type = 'members';
    else if (action === 'مشرفين') type = 'admins';
    if (!type) return m.reply('❌ نوع غير معروف. استخدم: الكل، اعضاء، مشرفين.');

    let participants;
    try {
        const metadata = m.groupMetadata;
        participants = metadata.participants;
    } catch (err) {
        return m.reply('❌ تعذر جلب قائمة الأعضاء.');
    }

    let filtered;
    if (type === 'members') filtered = participants.filter(p => !p.admin);
    else if (type === 'admins') filtered = participants.filter(p => p.admin);
    else filtered = participants;

    // التحقق من الحدود
    if (!m.isOwner) {
        if (!limits[groupId]) limits[groupId] = { limit: 3, usage_all: 0, usage_members: 0, usage_admins: 0 };
        const limit = limits[groupId].limit || 3;
        const usageKey = type === 'all' ? 'usage_all' : (type === 'members' ? 'usage_members' : 'usage_admins');
        const currentUsage = limits[groupId][usageKey] || 0;
        if (currentUsage >= limit) {
            return m.reply(`❌ تم استنفاد الحد الأقصى (${limit}) لاستخدام هذا النوع.`);
        }
        limits[groupId][usageKey] = currentUsage + 1;
        saveLimits(limits);
    }

    const time = moment.tz('Africa/Cairo').format('hh:mm A');
    const date = moment.tz('Africa/Cairo').format('YYYY/MM/DD');
    const typeNames = { all: 'الجميع', members: 'الأعـضـاء', admins: 'المشرفـين' };

    let teks = `*◞👥 مـنـشـن جـديـد*\n\n`;
    teks += `*📌 النـوع:* ${typeNames[type]}\n`;
    teks += filtered.map(p => `@${getParticipantJid(p).split('@')[0]}`).join('\n') + '\n\n';
    teks += `*🕒 الوقت:* ${time}\n*📅 التاريخ:* ${date}`;

    await m.reply(teks, { mentions: getParticipantJids(filtered) });
}

export { pluginConfig as config, handler }