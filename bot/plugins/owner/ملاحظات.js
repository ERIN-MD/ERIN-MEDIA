import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const NOTES_FILE = path.join(DATA_DIR, 'notes.json');

function readNotes() { try { return JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8')); } catch { return {}; } }
function writeNotes(data) { fs.writeFileSync(NOTES_FILE, JSON.stringify(data, null, 2)); }

function addNote(userId, content) {
    const db = readNotes();
    if (!db[userId]) db[userId] = { counter: 0, notes: {} };
    db[userId].counter++;
    const num = db[userId].counter;
    db[userId].notes[num] = { number: num, content, createdAt: new Date().toISOString() };
    writeNotes(db);
    return db[userId].notes[num];
}

function getNote(userId, number) { const db = readNotes(); return db[userId]?.notes[number] || null; }

function getAllNotes(userId) {
    const db = readNotes();
    const notes = db[userId]?.notes || {};
    return Object.values(notes).sort((a, b) => a.number - b.number);
}

function updateNote(userId, number, content) {
    const db = readNotes();
    if (!db[userId]?.notes[number]) return null;
    db[userId].notes[number].content = content;
    writeNotes(db);
    return db[userId].notes[number];
}

function deleteNote(userId, number) {
    const db = readNotes();
    if (!db[userId]?.notes[number]) return false;
    delete db[userId].notes[number];
    writeNotes(db);
    return true;
}

function deleteAllNotes(userId) {
    const db = readNotes();
    const count = Object.keys(db[userId]?.notes || {}).length;
    if (db[userId]) { db[userId].notes = {}; writeNotes(db); }
    return count;
}

const pluginConfig = {
    name: 'ملاحظات',
    alias: ['notes'],
    category: 'owner',
    description: '📝 نظام الملاحظات الشخصية (للمطور فقط)',
    usage: '.ملاحظات <اضافة/عرض/الكل/تعديل/حذف/مسح>',
    example: '.ملاحظات اضافة ملاحظتي',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

async function handler(m) {
    const args = m.args || [];
    const subCmd = args[0]?.toLowerCase();
    const rest = args.slice(1).join(' ');
    const senderId = m.sender;

    if (!subCmd) {
        return m.reply(
            `📝 *نظام الملاحظات*\n\n` +
            `✍️ *.ملاحظات اضافة [نص]* - إضافة ملاحظة\n` +
            `📄 *.ملاحظات عرض [رقم]* - عرض ملاحظة\n` +
            `📋 *.ملاحظات الكل* - عرض الكل\n` +
            `✏️ *.ملاحظات تعديل [رقم] [نص]* - تعديل\n` +
            `🗑️ *.ملاحظات حذف [رقم]* - حذف\n` +
            `🗑️ *.ملاحظات مسح* - حذف الكل`
        );
    }

    if (subCmd === 'اضافة' || subCmd === 'add') {
        let content = rest;
        if (!content && m.quoted?.body) content = m.quoted.body;
        if (!content) return m.reply('❌ اكتب النص: *.ملاحظات اضافة هذه ملاحظتي*');
        const note = addNote(senderId, content);
        return m.reply(`✅ *ملاحظة #${note.number}*\n📝 ${note.content}`);
    }

    if (subCmd === 'عرض' || subCmd === 'get') {
        const num = parseInt(args[1]);
        if (!num) return m.reply('❌ اكتب رقم الملاحظة: *.ملاحظات عرض 1*');
        const note = getNote(senderId, num);
        if (!note) return m.reply(`❌ ملاحظة #${num} غير موجودة`);
        return m.reply(`📝 *ملاحظة #${note.number}*\n${note.content}\n\n_${new Date(note.createdAt).toLocaleString('ar-EG')}_`);
    }

    if (subCmd === 'الكل' || subCmd === 'all' || subCmd === 'قائمة') {
        const notes = getAllNotes(senderId);
        if (!notes.length) return m.reply('📭 لا يوجد ملاحظات');
        let text = `📋 *ملاحظاتك (${notes.length})*\n\n`;
        notes.forEach(n => { const preview = n.content.length > 40 ? n.content.substring(0, 40) + '...' : n.content; text += `*#${n.number}* ${preview}\n`; });
        text += `\n_*.ملاحظات عرض [رقم]* للمشاهدة_`;
        return m.reply(text);
    }

    if (subCmd === 'تعديل' || subCmd === 'edit') {
        const num = parseInt(args[1]);
        const content = args.slice(2).join(' ');
        if (!num || !content) return m.reply('❌ *.ملاحظات تعديل 1 النص الجديد*');
        const note = updateNote(senderId, num, content);
        if (!note) return m.reply(`❌ ملاحظة #${num} غير موجودة`);
        return m.reply(`✅ *ملاحظة #${note.number} تم تعديلها*\n📝 ${note.content}`);
    }

    if (subCmd === 'حذف' || subCmd === 'delete' || subCmd === 'del') {
        const num = parseInt(args[1]);
        if (!num) return m.reply('❌ *.ملاحظات حذف 1*');
        const deleted = deleteNote(senderId, num);
        if (!deleted) return m.reply(`❌ ملاحظة #${num} غير موجودة`);
        return m.reply(`✅ ملاحظة #${num} حذفت`);
    }

    if (subCmd === 'مسح' || subCmd === 'clear') {
        const count = deleteAllNotes(senderId);
        if (!count) return m.reply('📭 لا يوجد ملاحظات للحذف');
        return m.reply(`✅ حذفت ${count} ملاحظات`);
    }

    return m.reply('❌ أمر غير معروف. اكتب *.ملاحظات* للمساعدة');
}

export { pluginConfig as config, handler };