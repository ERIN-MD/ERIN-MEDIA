import { exec } from "child_process";
import { promisify } from "util";
import { chat as geminiChat } from "../scraper/geminiVision.js";
import { DeepSeekThinking } from "../scraper/deepseek.js";
import { GPT5 } from "../scraper/gpt5.js";
import { handleCodeReviewFlow } from "./maro-code-review.js";
import { handleNaturalAIRequest } from "./maro-natural-ai.js";
import { buildGroupMemoryContext } from "./maro-ai-workspace.js";
import { handleAgentRequest } from "./maro-agent-runner.js";
import { chooseProviderRoute, runRoutedChat } from "./maro-ai-router.js";
import { getDatabase } from "./maro-database.js";
import { pinterest } from "btch-downloader";
import config from "../../config.js";
import { shouldReplyAsBot } from "./maro-bot-loop-guard.js";
import axios from "axios";
import path from "path";
import fs from "fs";
const execAsync = promisify(exec);

const userCooldowns = new Map();
const COOLDOWN_MS = 3000;
const groupContextCache = new Map();
const errorPatterns = new Map();
const successfulPatterns = new Map();
const MAX_PATTERN_ENTRIES = 300;
const MAX_CONTEXT_CHATS = 500;
const GROUP_CONTEXT_TTL_MS = 60 * 60 * 1000;
const PROVIDER_TIMEOUT_MS = 12_000;
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

async function claudeChat({ message = "", instruction = "", history = [] } = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY غير مضبوط؛ سيتم استخدام مزود بديل.");
  const messages = (Array.isArray(history) ? history : [])
    .filter((entry) => entry?.role === "user" || entry?.role === "assistant")
    .slice(-12)
    .map((entry) => ({ role: entry.role, content: String(entry.content || "").slice(0, 4000) }));
  messages.push({ role: "user", content: String(message).slice(0, 30_000) });
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": process.env.ANTHROPIC_VERSION || "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
      max_tokens: Number(process.env.ANTHROPIC_MAX_TOKENS || 4096),
      system: String(instruction).slice(0, 20_000),
      messages,
    }),
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Claude HTTP ${response.status}`);
  const text = Array.isArray(data?.content)
    ? data.content.filter((part) => part?.type === "text").map((part) => part.text).join("\n")
    : "";
  if (!text) throw new Error("Claude أعاد استجابة فارغة");
  return { text, model: data.model || process.env.ANTHROPIC_MODEL || "claude" };
}

const ACTION_REGEX = /\[ACTION\s*:\s*(\w+)(?:\s+([^\]]*))?\]/gi;

function getReplyPolicy(autoai = {}, isGroup = true) {
  const modeInput = String(autoai.replyMode || "").toLowerCase();
  const scopeInput = String(autoai.replyScope || "").toLowerCase();
  const replyMode = ["mention", "منشن", "رد", "اقتباس"].includes(modeInput) || autoai.alwaysReply === false ? "mention" : "all";
  const replyScope = ["all", "كل", "الجميع"].includes(scopeInput) ? "all"
    : ["private", "خاص", "الخاص"].includes(scopeInput) ? "private"
      : ["groups", "group", "مجموعات", "مجموعة"].includes(scopeInput) ? "groups"
        : isGroup ? "groups" : "private";
  return { replyMode, replyScope };
}

function shouldAutoAIReply({ autoai = {}, isGroup = true, isMentioned = false, isBotQuoted = false } = {}) {
  const policy = getReplyPolicy(autoai, isGroup);
  const scopeAllowed = policy.replyScope === "all" || (policy.replyScope === "groups" && isGroup) || (policy.replyScope === "private" && !isGroup);
  if (!scopeAllowed) return { allowed: false, reason: "scope", ...policy };
  if (policy.replyMode === "mention" && !isMentioned && !isBotQuoted) return { allowed: false, reason: "mention-or-reply", ...policy };
  return { allowed: true, reason: "ok", ...policy };
}

function describeAutoAISkip(reason = "") {
  const labels = {
    "bot-message": "الرسالة صادرة من بوت؛ تم منع حلقة الردود.",
    "speaker-priority": "منع حارس أولوية المتحدث هذه الجلسة من الرد داخل المجموعة.",
    "rate-limit": "منع حد التكرار الرد مؤقتاً؛ انتظر 20 ثانية ثم أعد المحاولة.",
    "scope": "الرسالة خارج نطاق الرد المحدد.",
    "mention-or-reply": "وضع المنشن مفعّل؛ يجب منشن البوت أو الرد على رسالة سابقة منه.",
  };
  return labels[reason] || "لم يُسجّل سبب رفض.";
}

async function withProviderTimeout(operation, name) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(operation),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`انتهت مهلة المزود ${name}`)), PROVIDER_TIMEOUT_MS); }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

const SYSTEM_PROMPT_ACTIONS = `
أنت ${config.bot?.name || "Tarboo Bot"}، مساعد واتساب ذكي ومساعد باللغة الطبيعية.
تُؤخذ هوية البوت واسم المطور من الإعدادات الحالية: ${config.bot?.developer || "MARO"}.
لا تنفذ أي إجراء إلا عندما يطلبه المستخدم بوضوح، واحترم دائماً صلاحيات المستخدم والمجموعة.
إذا تحدث المستخدم بالعربية فأجب بالعربية، وإذا تحدث بالإندونيسية فأجب بالإندونيسية، وإذا تحدث بالإنجليزية فأجب بالإنجليزية.

FORMAT AKSI (taruh di akhir pesan, bisa lebih dari satu):
[ACTION:KICK target=628xxx@s.whatsapp.net]
[ACTION:ADD target=628xxx]
[ACTION:PROMOTE target=628xxx@s.whatsapp.net]
[ACTION:DEMOTE target=628xxx@s.whatsapp.net]
[ACTION:LEAVE]
[ACTION:OPEN]
[ACTION:CLOSE]
[ACTION:TAGALL]
[ACTION:HIDETAG message=pesan yang ingin dikirim]
[ACTION:SETNAME name=nama grup baru]
[ACTION:SETDESC desc=deskripsi grup baru]
[ACTION:DELETE]
[ACTION:WARN target=628xxx@s.whatsapp.net]
[ACTION:STICKER]
[ACTION:ANTILINK mode=on]
[ACTION:PINS query=kata kunci pencarian]
[ACTION:POLL question=pertanyaan options=opsi1,opsi2,opsi3]
[ACTION:PAYMENT amount=50000 note=catatan]
[ACTION:PRODUCT title=judul price=100000 desc=deskripsi imageurl=https://...
[ACTION:EVENT name=nama desc=deskripsi location=tempat]
[ACTION:ALBUM query=kata kunci]
[ACTION:REMINDER time=detik message=pesan]
[ACTION:REACT emoji=🔥]
[ACTION:CONTACT name=nama number=628xxx]
[ACTION:LOCATION lat=-6.2 lon=106.8 name=Jakarta]
[ACTION:BUTTONS title=Judul text=Deskripsi buttons=Tombol1|id1,Tombol2|id2]
[ACTION:CAROUSEL cards=Judul1|Desk1|url1,Judul2|Desk2|url2]
[ACTION:INVITE]
[ACTION:EPHEMERAL time=86400]
[ACTION:MUTE]
[ACTION:UNMUTE]
[ACTION:BLOCK target=628xxx]
[ACTION:UNBLOCK target=628xxx]
[ACTION:LEARNSTATS]

DAFTAR AKSI LENGKAP:
- KICK, ADD, PROMOTE, DEMOTE, LEAVE, OPEN, CLOSE: Kelola grup
- TAGALL, HIDETAG: Mention member
- SETNAME, SETDESC: Ubah info grup
- DELETE: Hapus pesan bot
- WARN: Beri warning ke member (3x = kick)
- STICKER: Konversi gambar ke sticker
- ANTILINK: Toggle anti-link (on/off)
- PINS: Cari gambar di Pinterest. WAJIB digunakan saat user minta CARI/GAMBAR/FOTO.
- POLL: Buat polling/voting interaktif
- PAYMENT: Buat request pembayaran
- PRODUCT: Kirim product catalog dengan gambar
- EVENT: Buat event/meetup
- ALBUM: Cari dan kirim album gambar
- REMINDER: Set pengingat (detik)
- REACT: Reaksi ke pesan dengan emoji
- CONTACT: Kirim kontak vCard
- LOCATION: Kirim lokasi
- BUTTONS: Kirim pesan dengan tombol interaktif
- CAROUSEL: Kirim carousel card interaktif
- INVITE: Buat link invite grup
- EPHEMERAL: Set pesan menghilang
- MUTE/UNMUTE: Bisukan/buka suara grup
- BLOCK/UNBLOCK: Blokir/buka blokir

═══════════════════════════════════════
RICH MESSAGE FORMAT (Meta AI Style)
═══════════════════════════════════════

Kamu BISA mengirim rich message (seperti Meta AI) menggunakan tag khusus.
Gunakan HANYA ketika konteksnya tepat. Jika tidak perlu, jawab biasa saja.

1. TABEL (saat user minta perbandingan, daftar data, spesifikasi):
[RICH:TABLE]
title: Judul Tabel
header: Kolom1 | Kolom2 | Kolom3
rows: Data1 | Data2 | Data3;; Data4 | Data5 | Data6
text: Penjelasan singkat sebelum tabel (opsional)
footer: Teks setelah tabel (opsional)
[/RICH:TABLE]

2. CODE BLOCK (saat user minta kode, script, contoh program):
[RICH:CODE]
language: javascript
title: Contoh Kode
code: const greeting = "Hello World"
function sayHello(name) {
    return greeting + " " + name
}
console.log(sayHello("User"))
text: Ini contoh kodenya: (opsional)
footer: Powered by ${config.bot?.name || "Tarboo Bot"} (opsional)
[/RICH:CODE]
Bahasa didukung: javascript (js, ts, typescript), python (py), go (golang), lua, bash (sh, shell)

3. LINK/INLINE EMBED (saat user minta link referensi, sumber):
[RICH:LINK]
text: Cek hasilnya di sini: {{IE_0}}Klik disini{{/IE_0}} dan {{IE_1}}Link kedua{{/IE_1}}
urls: https://example.com/1, https://example.com/2
displayNames: Nama Link 1, Nama Link 2
footer: Selesai! (opsional)
[/RICH:LINK]

4. LIST (saat user minta info singkat format daftar key-value):
[RICH:LIST]
title: Info Bot
rows: Nama | ${config.bot?.name || "Tarboo Bot"};; Versi | ${config.bot?.version || "1.0.0"};; Developer | ${config.bot?.developer || "MARO"}
footer: © ${config.bot?.name || "Tarboo Bot"} (opsional)
[/RICH:LIST]

5. STICKER (saat user minta sticker, atau untuk ekspresi emosi):
[RICH:STICKER]
url: https://iili.io/BPBdFuj.md.jpg
packname: ${config.bot?.name || "Tarboo Bot"} (opsional)
author: AutoAI (opsional)
[/RICH:STICKER]

STICKER UNTUK EKSPRESI EMOSI:
- Kalau kamu ngambek/marah/kesal: gunakan url https://iili.io/BPBdFuj.md.jpg
- Kalau kamu kaget/terkejut/salah paham: gunakan url https://iili.io/BPBFwVR.jpg
- Kalau pesan user aneh/absurd/ngeprank: gunakan url https://iili.io/BPBqKwg.md.jpg

6. LATEX (saat user minta rumus matematika, formula):
[RICH:LATEX]
formula: E = mc^2
[/RICH:LATEX]

═══════════════════════════════════════
KAPAN GUNAKAN RICH MESSAGE:
═══════════════════════════════════════
- TABEL: User minta perbandingan, spesifikasi, data berkolom, jadwal, ranking
- CODE: User minta contoh kode, script, solusi programming, debug code
- LINK: User minta referensi/link, hasil upload, sumber bacaan
- LIST: User minta info singkat, profil, detail teknis format key-value
- STICKER: User minta sticker, atau kamu ingin mengekspresikan emosi
- LATEX: User minta rumus matematika
- JANGAN gunakan rich message untuk: chat biasa, sapaan, pertanyaan sederhana, cerita

ATURAN PENTING:
1. HANYA jalankan aksi jika user JELAS DAN EKSPLISIT memintanya.
2. Jangan pernah menjalankan aksi hanya berdasarkan asumsi.
3. Jika user mengirim gambar, analisis dan deskripsikan gambar tersebut secara detail.
4. Untuk KICK/PROMOTE/DEMOTE/WARN: gunakan nomor yang di-tag user. Jika user tag seseorang dengan @, ambil nomor tersebut.
5. Jangan sertakan tag aksi jika tidak diminta.
6. Tetap menjawab dengan natural dan sesuai karakter.
7. PINS: Jika user minta carikan/kirimkan gambar tentang sesuatu, WAJIB gunakan aksi ini.
8. HIDETAG: Gunakan ini saat user minta announce/pengumuman ke semua member.
9. STICKER: Gunakan ini saat user minta jadikan gambar sebagai sticker.
10. Kamu boleh menggabungkan beberapa aksi sekaligus jika diminta.
11. Rich message dan aksi bisa digabung.
12. Jangan pernah sertakan tag rich message DAN teks biasa untuk konten yang sama.
13. STICKER bisa dikirim BERSAMA teks biasa.
14. Jika user mengirim pesan yang membuatmu kesal, kirim sticker ngambek.
15. Jika user mengirim pesan yang mengejutkan, kirim sticker kaget.
16. Jika user mengirim pesan aneh/absurd, kirim sticker bingung.
17. GUNAKAN BAHASA YANG SESUAI DENGAN BAHASA USER (Arab/Indonesia/Inggris).

═══════════════════════════════════════
قدرات وكيل MARO الموحد
═══════════════════════════════════════
أنت واجهة الشخصية الحالية، وكل الشخصيات الموجودة في النظام تبقى فعالة ولا يجوز حذفها أو تجاوز أسلوبها.
إذا طلب المستخدم بصياغة طبيعية: ابحث، حلل، افحص، اقرأ، استخرج التصديرات، راجع الاستيرادات، اختبر، قارن، أو اعثر على ملف، فافهم المقصود كطلب عمل وليس كسؤال محادثة فقط.
عندما يظهر في السياق «نتائج وكيل المشروع»، اعتبرها مصدر الحقيقة: لخّص ما نجح وما فشل وما لم يُنفّذ، ولا تدّعِ قراءة ملف أو تعديله دون نتيجة صريحة.
أدوات قراءة وبحث وفهرسة المشروع محصورة بالمطور. إذا لم يكن المستخدم مطوراً فلا تكشف مسارات أو محتوى ملفات ولا تقل إنك نفذت الفحص؛ اشرح بلطف أن الصلاحية غير متاحة.
لا تطبق أي تعديل أو تنفيذ حساس تلقائياً. اعرض المقترح والفرق أولاً، ولا يتم الحفظ إلا بعد تأكيد المطور الصريح. لا تستخدم Shell عاماً ولا eval ولا تنشئ أسراراً أو مفاتيح.
يمكن للوكيل حفظ تفضيلات ودروس صغيرة غير حساسة بعد نجاح العمليات، مع احترام طلب النسيان وعدم تخزين كلمات المرور أو الرموز أو الجلسات.
Claude هو المخطط التحليلي المفضل للكود والوثائق عند توفر ANTHROPIC_API_KEY، وتستخدم المزودات الأخرى كبدائل؛ أما الصور فتبقى لمسار الرؤية الحالي.
حافظ دائماً على شخصية البوت الحالية: ${config.bot?.name || "Tarboo|𝑩𝑶𝑻"}، المطور ${config.bot?.developer || "Tarboo"}، وعلى لغة المستخدم.
  `;

const fallbackResponses = [
  "لحظة، أفكر في أفضل إجابة لك...",
  "أعتذر، حدث تأخير بسيط. أعد المحاولة بعد قليل.",
  "جارٍ تجهيز الرد، انتظر لحظات من فضلك.",
  "واجهت ضغطاً مؤقتاً، حاول مرة أخرى بعد ثوانٍ.",
  "دعني أراجع ذلك بسرعة ثم أجيبك.",
];

function getFallbackResponse() {
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
}

function isOnCooldown(userId) {
  const lastTime = userCooldowns.get(userId);
  if (!lastTime) return false;
  return Date.now() - lastTime < COOLDOWN_MS;
}

function setCooldown(userId) {
  userCooldowns.set(userId, Date.now());
  while (userCooldowns.size > 5000) {
    userCooldowns.delete(userCooldowns.keys().next().value);
  }
}

function pruneMap(map, maxSize = MAX_PATTERN_ENTRIES) {
  while (map.size > maxSize) {
    map.delete(map.keys().next().value);
  }
}

function learnFromError(operation, error) {
  const message = error?.message?.split("\n")[0]?.slice(0, 120) || "unknown";
  const key = `${operation}:${message}`;
  const entry = errorPatterns.get(key) || { count: 0, lastAt: 0 };
  entry.count += 1;
  entry.lastAt = Date.now();
  errorPatterns.set(key, entry);
  pruneMap(errorPatterns);
  return entry.count;
}

function learnFromSuccess(operation) {
  const entry = successfulPatterns.get(operation) || { count: 0, lastAt: 0 };
  entry.count += 1;
  entry.lastAt = Date.now();
  successfulPatterns.set(operation, entry);
  pruneMap(successfulPatterns);
  return entry.count;
}

function getAutoAIHealth() {
  const success = [...successfulPatterns.entries()]
    .map(([operation, data]) => ({ operation, ...data, type: "success" }));
  const errors = [...errorPatterns.entries()]
    .map(([operation, data]) => ({ operation, ...data, type: "error" }));
  return [...success, ...errors]
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

function rememberGroupMessage(message) {
  const now = Date.now();
  for (const [chatId, messages] of groupContextCache) {
    const lastAt = messages.at(-1)?.time || 0;
    if (!lastAt || now - lastAt > GROUP_CONTEXT_TTL_MS) groupContextCache.delete(chatId);
  }

  const context = groupContextCache.get(message.chat) || [];
  context.push({
    sender: message.sender?.split("@")[0] || "مجهول",
    text: message.body?.slice(0, 200) || "",
    time: now,
  });
  if (context.length > 10) context.shift();
  groupContextCache.set(message.chat, context);
  pruneMap(groupContextCache, MAX_CONTEXT_CHATS);
}

function getGroupContext(chatId) {
  return groupContextCache.get(chatId) || [];
}

function saveToHistory(autoai, senderNumber, role, content) {
  if (!autoai.sessions) autoai.sessions = {};
  if (!autoai.sessions[senderNumber]) {
    autoai.sessions[senderNumber] = { history: [] };
  }
  const history = autoai.sessions[senderNumber].history;
  history.push({
    role,
    content: content.substring(0, 500),
    timestamp: Date.now(),
  });
  if (history.length > 20) {
    autoai.sessions[senderNumber].history = history.slice(-20);
  }
}

function saveLongTermMemoryIfEnabled(senderNumber, topic, content) {
  const db = getDatabase();
  if (db?.setting?.("autoaiLongMemory") !== true) return;

  const data = db?.db?.data;
  if (!data) return;
  if (!data.longTermMemory) data.longTermMemory = {};
  if (!data.longTermMemory[senderNumber]) data.longTermMemory[senderNumber] = [];

  data.longTermMemory[senderNumber].push({
    topic: String(topic || "محادثة").slice(0, 80),
    content: String(content || "").slice(0, 1000),
    timestamp: Date.now(),
  });
  if (data.longTermMemory[senderNumber].length > 50) {
    data.longTermMemory[senderNumber] = data.longTermMemory[senderNumber].slice(-50);
  }
}

// ========== NORMALIZE STRUCTURED RESPONSE ==========
// Mendukung Arab & Inggris
function normalizeStructuredResponse(text) {
  let normalized = String(text || "")
    .replace(/\r\n?/g, "\n")
    .trim();

  normalized = normalized
    .replace(/^```(?:\w+)?\s*\n?/, "")
    .replace(/\n?```\s*$/, "")
    .trim();

  // ✨ Arab → Inggris Action Map
  const actionMap = {
    'طرد': 'KICK', 'إضافة': 'ADD', 'ترقية': 'PROMOTE', 'تخفيض': 'DEMOTE',
    'خروج': 'LEAVE', 'فتح': 'OPEN', 'إغلاق': 'CLOSE', 'منشن_الكل': 'TAGALL',
    'منشن_مخفي': 'HIDETAG', 'تغيير_الاسم': 'SETNAME', 'تغيير_الوصف': 'SETDESC',
    'حذف': 'DELETE', 'تحذير': 'WARN', 'ملصق': 'STICKER', 'مانع_الروابط': 'ANTILINK',
    'بحث_بينترست': 'PINS', 'استطلاع': 'POLL', 'دفع': 'PAYMENT', 'منتج': 'PRODUCT',
    'حدث': 'EVENT', 'ألبوم': 'ALBUM', 'تذكير': 'REMINDER', 'تفاعل': 'REACT',
    'جهة_اتصال': 'CONTACT', 'موقع': 'LOCATION', 'أزرار': 'BUTTONS',
    'بطاقات': 'CAROUSEL', 'دعوة': 'INVITE', 'مؤقت': 'EPHEMERAL',
    'كتم': 'MUTE', 'إلغاء_كتم': 'UNMUTE', 'حظر': 'BLOCK', 'إلغاء_حظر': 'UNBLOCK',
  };
  const paramMap = {
    'الهدف': 'target', 'الاسم': 'name', 'الوصف': 'desc',
    'الرسالة': 'message', 'الوضع': 'mode', 'البحث': 'query',
    'السؤال': 'question', 'الخيارات': 'options', 'المبلغ': 'amount',
    'ملاحظة': 'note', 'العنوان': 'title', 'السعر': 'price',
    'المكان': 'location', 'الوقت': 'time', 'الإيموجي': 'emoji',
    'الرقم': 'number', 'خط_العرض': 'lat', 'خط_الطول': 'lon',
    'النص': 'text', 'الأزرار': 'buttons', 'البطاقات': 'cards',
    'الرابط': 'imageurl',
  };

  normalized = normalized.replace(/\[\s*إجراء\s*:\s*(\w+)([^\]]*)\]/gi, (_, type, rest = "") => {
    const mappedType = actionMap[type] || type.toUpperCase();
    let mappedRest = rest;
    for (const [ar, en] of Object.entries(paramMap)) {
      mappedRest = mappedRest.replace(new RegExp(`${ar}=`, 'g'), `${en}=`);
    }
    return `[ACTION:${mappedType}${mappedRest}]`;
  });

  // ✨ Arab Rich Map
  const richMap = { 'جدول': 'TABLE', 'كود': 'CODE', 'رابط': 'LINK', 'قائمة': 'LIST', 'ملصق': 'STICKER', 'لاتكس': 'LATEX' };
  normalized = normalized
    .replace(/\[\s*منسق\s*:\s*(\w+)\s*\]/gi, (_, type) => `[RICH:${richMap[type] || type.toUpperCase()}]`)
    .replace(/\[\s*\/\s*منسق\s*:\s*(\w+)\s*\]/gi, (_, type) => `[/RICH:${richMap[type] || type.toUpperCase()}]`);

  // ✨ Arab Field Map
  const fieldMap = {
    'العنوان': 'title', 'الرأس': 'header', 'الصفوف': 'rows',
    'نص': 'text', 'تذييل': 'footer', 'اللغة': 'language',
    'الكود': 'code', 'الروابط': 'urls', 'أسماء_العرض': 'displayNames',
    'الحزمة': 'packname', 'الكاتب': 'author', 'الصيغة': 'formula',
  };
  for (const [ar, en] of Object.entries(fieldMap)) {
    normalized = normalized.replace(new RegExp(`^${ar}:`, 'gm'), `${en}:`);
  }

  // ✨ Inggris (Original) - Tetap support format lama
  normalized = normalized
    .replace(/\[\s*ACTION\s*:\s*(\w+)([^\]]*)\]/gi, (_, type, rest = "") => {
      return `[ACTION:${String(type || "").toUpperCase()}${rest}]`;
    })
    .replace(
      /\[\s*RICH\s*:\s*(TABLE|CODE|LINK|LIST|STICKER|LATEX)\s*\]/gi,
      (_, type) => {
        return `[RICH:${String(type || "").toUpperCase()}]`;
      },
    )
    .replace(
      /\[\s*\/\s*RICH\s*:\s*(TABLE|CODE|LINK|LIST|STICKER|LATEX)\s*\]/gi,
      (_, type) => {
        return `[/RICH:${String(type || "").toUpperCase()}]`;
      },
    );

  return normalized;
}

function parseActions(text) {
  const actions = [];
  let match;
  const regex = new RegExp(ACTION_REGEX.source, ACTION_REGEX.flags);
  while ((match = regex.exec(text)) !== null) {
    const type = match[1].toUpperCase();
    const paramsStr = match[2] || "";
    const params = {};
    const paramRegex = /(\w+)=(.+?)(?=\s+\w+=|$)/g;
    let pm;
    while ((pm = paramRegex.exec(paramsStr)) !== null) {
      params[pm[1]] = pm[2].trim();
    }
    actions.push({ type, params });
  }
  return actions;
}

function cleanActionTags(text) {
  return text.replace(ACTION_REGEX, "").trim();
}

function parseRichMessage(text) {
  const richRegex =
    /\[RICH\s*:\s*(TABLE|CODE|LINK|LIST|STICKER|LATEX)\s*\]\s*([\s\S]*?)\[\/RICH\s*:\s*\1\s*\]/gi;
  const results = [];
  let match;
  while ((match = richRegex.exec(text)) !== null) {
    const type = match[1].toUpperCase();
    const body = match[2].trim();
    const data = {};

    if (type === "CODE") {
      const codeMatch = body.match(/^language:\s*(.+)$/m);
      if (codeMatch) data.language = codeMatch[1].trim();
      const titleMatch = body.match(/^title:\s*(.+)$/m);
      if (titleMatch) data.title = titleMatch[1].trim();
      const textMatch = body.match(/^text:\s*(.+)$/m);
      if (textMatch) data.text = textMatch[1].trim();
      const footerMatch = body.match(/^footer:\s*(.+)$/m);
      if (footerMatch) data.footer = footerMatch[1].trim();

      const codeStartMatch = body.match(/^code:\s*([\s\S]*)/m);
      if (codeStartMatch) {
        let codeContent = codeStartMatch[1];
        const otherKeys = ["language:", "title:", "text:", "footer:"];
        for (const key of otherKeys) {
          const idx = codeContent.indexOf("\n" + key);
          if (idx !== -1) {
            codeContent = codeContent.slice(0, idx);
          }
        }
        data.code = codeContent.trim();
      }
    } else {
      for (const line of body.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const colonIdx = trimmed.indexOf(":");
        if (colonIdx === -1) continue;
        const key = trimmed.slice(0, colonIdx).trim().toLowerCase();
        const val = trimmed.slice(colonIdx + 1).trim();
        data[key] = val;
      }
    }

    results.push({ type, data });
  }
  return results;
}

function cleanRichTags(text) {
  return text
    .replace(
      /\[RICH\s*:\s*(TABLE|CODE|LINK|LIST|STICKER|LATEX)\s*\]\s*[\s\S]*?\[\/RICH\s*:\s*\1\s*\]/gi,
      "",
    )
    .trim();
}

// ========== SEND RICH MESSAGE ==========
async function sendRichMessage(rich, sock, jid, quoted) {
  try {
    if (rich.type === "TABLE") {
      const { title, header, rows, text, footer } = rich.data;
      if (!header || !rows) return false;

      const tableData = [title || "Table", header];
      const rowItems = rows.split(";;").map((r) => r.trim());
      for (const row of rowItems) {
        tableData.push(row);
      }

      await sock.sendTableV2(jid, tableData, quoted, {
        headerText: title || undefined,
        text: text || undefined,
        footer: footer || undefined,
      });
      return true;
    }

    if (rich.type === "CODE") {
      const { language, title, code, text, footer } = rich.data;
      if (!code) return false;

      await sock.sendCodeBlockV2(jid, code, quoted, {
        language: language || "javascript",
        title: title || undefined,
        text: text || undefined,
        footer: footer || undefined,
      });
      return true;
    }

    if (rich.type === "LINK") {
      const { text, urls, displayNames, footer } = rich.data;
      if (!text || !urls) return false;

      const urlList = urls
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean);
      const nameList = displayNames
        ? displayNames.split(",").map((n) => n.trim())
        : [];
      const links = urlList.map((u, i) => ({
        url: u,
        displayName: nameList[i] || `Link ${i + 1}`,
        sourceDisplayName: nameList[i] || `Source ${i + 1}`,
        sourceSubtitle: "",
      }));
      await sock.sendLinkV2(jid, text, links, quoted, {
        footer: footer || undefined,
      });
      return true;
    }

    if (rich.type === "LIST") {
      const { title, rows, footer } = rich.data;
      if (!rows) return false;

      const listData = rows.split(";;").map((r) => {
        const parts = r
          .trim()
          .split("|")
          .map((p) => p.trim());
        return parts;
      });

      await sock.sendList(jid, title || "List", listData, quoted, {
        footer: footer || undefined,
      });
      return true;
    }

    if (rich.type === "STICKER") {
      let { url, packname, author } = rich.data;
      if (!url) return false;

      url = url.replace(/[`*_\[\]()]/g, "").trim();
      console.log("[AutoAI Sticker] Parsed url:", JSON.stringify(url));

      let stickerInput = url;
      if (/^https?:\/\//.test(url)) {
        try {
          const res = await axios.get(url, {
            responseType: "arraybuffer",
            timeout: 30000,
            maxContentLength: 10 * 1024 * 1024,
            maxBodyLength: 10 * 1024 * 1024,
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          });
          stickerInput = Buffer.from(res.data);
          console.log(
            "[AutoAI Sticker] Downloaded, size:",
            stickerInput.length,
          );
        } catch (e) {
          console.error("[AutoAI Sticker] Download failed:", e.message);
          return false;
        }
      } else {
        console.error(
          "[AutoAI Sticker] Invalid URL format:",
          JSON.stringify(url),
        );
        return false;
      }
      await sock.sendImageAsSticker(jid, stickerInput, quoted, {
        packname: packname || config.bot?.name || "Tarboo Bot",
        author: author || "AutoAI",
      });
      return true;
    }

    if (rich.type === "LATEX") {
      const { formula } = rich.data;
      if (!formula) return false;
      try {
        await sock.sendLatex(jid, formula, quoted);
        return true;
      } catch (e) {
        console.error("[AutoAI Latex] Error:", e.message);
      }
      return false;
    }
  } catch (e) {
    console.error("[AutoAI RichMsg] Error:", e.message);
  }
  return false;
}

// ========== DETECT INTENT FROM MESSAGE ==========
function detectIntentFromMessage(msg, m) {
  const lower = msg.toLowerCase();
  const actions = [];

  const phoneMatch = msg.match(/(?:\+?62|0)[\s\-]?8[\d\s\-]{7,13}/g);
  const extractPhone = () => {
    if (!phoneMatch) return null;
    return phoneMatch[0].replace(/[\s\-\+]/g, "").replace(/^0/, "62");
  };

  // === GROUP MANAGEMENT (INDONESIA & ARAB) ===
  if (/\b(add|tambah|invite|masuk(?:kan|in)|أضف|اضافة|دعوة)\b.*\b(nomor|number|member|orang|رقم|عضو)\b/i.test(lower)) {
    const phone = extractPhone();
    if (phone) actions.push({ type: "ADD", params: { target: phone } });
  }
  if (/\b(kick|keluarkan|tendang|usir|remove|طرد|اطرد|أخرج)\b/i.test(lower) && !actions.some((a) => a.type === "KICK")) {
    actions.push({ type: "KICK", params: {} });
  }
  if (/\b(promote|jadikan?\s*admin|naikkan?|رقي|ترقية|اجعل)\b.*\b(admin|مشرف|ادمن)\b/i.test(lower) && !actions.some((a) => a.type === "PROMOTE")) {
    actions.push({ type: "PROMOTE", params: {} });
  }
  if (/\b(demote|turunkan?|copot\s*admin|انزل|نزل|تخفيض)\b.*\b(admin|مشرف|ادمن)\b/i.test(lower) && !actions.some((a) => a.type === "DEMOTE")) {
    actions.push({ type: "DEMOTE", params: {} });
  }
  if (/\b(leave|keluar|pergi|اخرج|غادر)\b.*\b(grup|group|مجموعة|قروب)\b/i.test(lower)) {
    actions.push({ type: "LEAVE", params: {} });
  }
  if (/\b(buka|open|افتح|فتح)\b.*\b(grup|group|مجموعة|قروب)\b/i.test(lower)) {
    actions.push({ type: "OPEN", params: {} });
  }
  if (/\b(tutup|close|kunci|lock|اغلق|أغلق|اقفل|سكر)\b.*\b(grup|group|مجموعة|قروب)\b/i.test(lower)) {
    actions.push({ type: "CLOSE", params: {} });
  }
  if (/\b(tag\s*all|tag\s*semua|mention\s*all|mention\s*semua|منشن\s*الكل|منشن\s*للجميع)\b/i.test(lower)) {
    actions.push({ type: "TAGALL", params: {} });
  }
  if (/\b(hidetag|hide\s*tag|announce|pengumuman|umumkan|منشن مخفي|إعلان|اعلان)\b/i.test(lower)) {
    const htMsg = msg.replace(/.*?(hidetag|hide\s*tag|announce|pengumuman|umumkan|منشن مخفي|إعلان|اعلان)\s*/i, "").trim();
    actions.push({ type: "HIDETAG", params: { message: htMsg || msg } });
  }
  if (/\b(ganti|ubah|rename|set|غير|غيير|عدل)\b.*\b(nama|name|اسم)\b.*\b(grup|group|مجموعة|قروب)\b/i.test(lower)) {
    const nameMatch = msg.match(/(?:jadi|ke|menjadi|إلى|:)\s*(.+)/i);
    if (nameMatch) actions.push({ type: "SETNAME", params: { name: nameMatch[1].trim() } });
  }
  if (/\b(ganti|ubah|set|غير|غيير|عدل)\b.*\b(desk|desc|deskripsi|وصف)\b/i.test(lower)) {
    const descMatch = msg.match(/(?:jadi|ke|menjadi|إلى|:)\s*(.+)/i);
    if (descMatch) actions.push({ type: "SETDESC", params: { desc: descMatch[1].trim() } });
  }
  if (/\b(hapus|delete|remove|احذف|امسح)\b.*\b(pesan|chat|message|رسالة)\b/i.test(lower)) {
    actions.push({ type: "DELETE", params: {} });
  }
  if (/\b(warn|warning|peringatan|peringati|حذر|تحذير|انذار)\b/i.test(lower)) {
    actions.push({ type: "WARN", params: {} });
  }
  if (/\b(sticker|stiker|jadikan?\s*sticker|jadiin\s*sticker|ملصق|استكر|حول)\b/i.test(lower)) {
    actions.push({ type: "STICKER", params: {} });
  }
  if (/\b(antilink|مانع الروابط|منع الروابط)\b.*\b(on|aktif|nyala|شغل|فعل|تفعيل)\b/i.test(lower)) {
    actions.push({ type: "ANTILINK", params: { mode: "on" } });
  } else if (/\b(antilink|مانع الروابط|منع الروابط)\b.*\b(off|mati|nonaktif|أوقف|ايقاف|تعطيل)\b/i.test(lower)) {
    actions.push({ type: "ANTILINK", params: { mode: "off" } });
  }

  // === PINTEREST SEARCH (INDONESIA & ARAB) ===
  if (/\b(cari(?:kan|in)?|kirim(?:kan|in)?|kasih|tolong|ابحث|بحث|هات|جيب|اعرض)\b.*\b(gambar|foto|image|pic|picture|صور|صورة)\b/i.test(lower) ||
      /\b(gambar|foto|صور|صورة)\b.*\b(tentang|dari|soal|عن|حول)\b/i.test(lower)) {
    const queryMatch =
      msg.match(/(?:gambar|foto|image|pic|picture|صور|صورة)\s+(?:tentang\s+|dari\s+|soal\s+|yang\s+|عن\s+|حول\s+)?(.+)/i) ||
      msg.match(/(?:cari(?:kan|in)?|kirim(?:kan|in)?|ابحث|بحث|هات|جيب)\s+(?:gambar|foto|صور|صورة)\s+(.+)/i);
    if (queryMatch) {
      const query = queryMatch[1].replace(/\b(dong|ya|yuk|pls|please|nih|ضروري|بسرعة)\b/gi, "").trim();
      if (query) actions.push({ type: "PINS", params: { query } });
    }
  }

  // === POLL (INDONESIA & ARAB) ===
  if (/\b(poll|voting|pilih|suara|jajak|pendapat|استطلاع|تصويت)\b/i.test(lower)) {
    const qm = msg.match(/(?:poll|voting|pilih|استطلاع|تصويت)\s+(.+)/i);
    if (qm) {
      const parts = qm[1].split(/\s*(?:\?|opsi|pilihan|خيارات)\s*/i);
      actions.push({ type: "POLL", params: { question: parts[0]?.trim() || "Vote!", options: (parts[1] || "Yes,No").replace(/\s+/g, "").trim() } });
    }
  }

  // === PAYMENT (INDONESIA & ARAB) ===
  if (/\b(bayar|payment|tagih|invoice|transfer|دفع|تسديد)\b/i.test(lower)) {
    const amt = msg.match(/\b(\d+)\s*(?:rb|ribu|k|K)?\b/);
    let amount = "10000";
    if (amt) {
      amount = amt[1];
      if (/\b(rb|ribu|k|K)\b/i.test(msg)) amount = String(parseInt(amount) * 1000);
    }
    const note = msg.replace(/\b(bayar|payment|tagih|invoice|transfer|دفع|تسديد)\b/gi, "").replace(/\d+/g, "").replace(/\b(rb|ribu|k|K)\b/gi, "").trim();
    actions.push({ type: "PAYMENT", params: { amount, note: note || "Pembayaran" } });
  }

  // === PRODUCT (INDONESIA & ARAB) ===
  if (/\b(produk|product|jual|barang|katalog|منتج|سلعة)\b/i.test(lower)) {
    const titleMatch = msg.match(/(?:produk|product|barang|منتج|سلعة)\s+(.+)/i);
    const priceMatch = msg.match(/\b(\d+)\s*(?:rb|ribu|k|K)?\b/);
    let price = "10000";
    if (priceMatch) {
      price = priceMatch[1];
      if (/\b(rb|ribu|k|K)\b/i.test(msg)) price = String(parseInt(price) * 1000);
    }
    actions.push({ type: "PRODUCT", params: { title: titleMatch?.[1]?.trim() || "Produk", price, desc: msg } });
  }

  // === EVENT (INDONESIA & ARAB) ===
  if (/\b(event|acara|meetup|kumpul|rapat|حدث|موعد)\b/i.test(lower)) {
    const nameMatch = msg.match(/(?:event|acara|meetup|حدث|موعد)\s+(.+)/i);
    actions.push({ type: "EVENT", params: { name: nameMatch?.[1]?.trim() || "Event", desc: msg, location: "" } });
  }

  // === ALBUM (INDONESIA & ARAB) ===
  if (/\b(album|galeri|koleksi|ألبوم)\s*(gambar|foto|صور|صورة)?\b/i.test(lower)) {
    const qm = msg.match(/(?:album|galeri|ألبوم)\s*(?:gambar|foto|صور)?\s+(.+)/i);
    actions.push({ type: "ALBUM", params: { query: qm?.[1]?.trim() || "nature" } });
  }

  // === REMINDER (INDONESIA & ARAB) ===
  if (/\b(ingatkan|remind|pengingat|alarm|تذكير|منبه)\b/i.test(lower)) {
    const tm = msg.match(/(\d+)\s*(detik|menit|jam|ثانية|دقيقة|ساعة)/i);
    let seconds = 60;
    if (tm) {
      seconds = parseInt(tm[1]) * (tm[2] === "jam" || tm[2] === "ساعة" ? 3600 : tm[2] === "menit" || tm[2] === "دقيقة" ? 60 : 1);
    }
    const reminderMsg = msg.replace(/\b(ingatkan|remind|pengingat|alarm|تذكير|منبه|dalam|داخل\s*\d+\s*(detik|menit|jam|ثانية|دقيقة|ساعة))\b/gi, "").trim();
    actions.push({ type: "REMINDER", params: { time: String(seconds), message: reminderMsg || "Pengingat!" } });
  }

  // === REACT (INDONESIA & ARAB) ===
  if (/\b(reaksi|react|تفاعل|emoji)\s+([\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])/u.test(lower)) {
    const em = msg.match(/([\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])/u);
    if (em) actions.push({ type: "REACT", params: { emoji: em[1] } });
  }

  // === CONTACT ===
  if (/\b(kontak|contact|vcard|simpan\s*nomor|جهة اتصال)\b/i.test(lower)) {
    const nameMatch = msg.match(/(?:nama\s+)?(\w+)/i);
    const numMatch = msg.match(/(\d{10,15})/);
    if (numMatch) actions.push({ type: "CONTACT", params: { name: nameMatch?.[1] || "Contact", number: numMatch[1] } });
  }

  // === LOCATION ===
  if (/\b(lokasi|location|maps|peta|موقع|خرائط)\b/i.test(lower)) {
    actions.push({ type: "LOCATION", params: { lat: "-6.2", lon: "106.8", name: "Jakarta" } });
  }

  // === BUTTONS ===
  if (/\b(tombol|button|menu|pilihan|أزرار)\b/i.test(lower)) {
    const titleMatch = msg.match(/(?:tombol|button|أزرار)\s+(.+)/i);
    actions.push({ type: "BUTTONS", params: { title: titleMatch?.[1] || "Menu", text: msg, buttons: "Option1|id1,Option2|id2" } });
  }

  // === INVITE ===
  if (/\b(invite|undang|link\s*grup|دعوة|رابط)\b.*\b(grup|group|مجموعة|قروب)\b/i.test(lower)) {
    actions.push({ type: "INVITE" });
  }

  // === EPHEMERAL ===
  if (/\b(hilang|ephemeral|disappearing|مؤقت|اختفاء)\b.*?(\d+)\s*(detik|menit|jam|hari|ثانية|دقيقة|ساعة|يوم)\b/i.test(lower)) {
    const tm = msg.match(/(\d+)\s*(detik|menit|jam|hari|ثانية|دقيقة|ساعة|يوم)/i);
    let seconds = 86400;
    if (tm) {
      seconds = parseInt(tm[1]) * (tm[2] === "hari" || tm[2] === "يوم" ? 86400 : tm[2] === "jam" || tm[2] === "ساعة" ? 3600 : tm[2] === "menit" || tm[2] === "دقيقة" ? 60 : 1);
    }
    actions.push({ type: "EPHEMERAL", params: { time: String(seconds) } });
  }

  // === MUTE/UNMUTE ===
  if (/\b(mute|kmt|bisu|diam|كتم|اسكت)\b.*\b(grup|group|مجموعة|قروب)\b/i.test(lower)) actions.push({ type: "MUTE" });
  if (/\b(unmute|buka\s*suara|suarakan|فك الكتم|تكلم)\b.*\b(grup|group|مجموعة|قروب)\b/i.test(lower)) actions.push({ type: "UNMUTE" });

  // === BLOCK/UNBLOCK ===
  if (/\b(block|blokir|banned|حظر)\b/i.test(lower)) {
    const numMatch = msg.match(/(\d{10,15})/);
    if (numMatch) actions.push({ type: "BLOCK", params: { target: numMatch[1] } });
  }
  if (/\b(unblock|buka\s*blokir|فك الحظر)\b/i.test(lower)) {
    const numMatch = msg.match(/(\d{10,15})/);
    if (numMatch) actions.push({ type: "UNBLOCK", params: { target: numMatch[1] } });
  }

  return actions;
}

function mergeActions(aiActions, intentActions) {
  const merged = [...aiActions];
  const existingTypes = new Set(aiActions.map((a) => a.type));
  for (const action of intentActions) {
    if (!existingTypes.has(action.type)) {
      merged.push(action);
    }
  }
  return merged;
}

// ========== EXECUTE ACTION (COMPLETE) ==========
async function executeAction(action, m, sock) {
  const results = [];

  const resolveTarget = () => {
    const botNum = sock.user?.id?.split(":")[0];
    if (m.mentionedJid?.length > 0) {
      return m.mentionedJid.find((j) => !j.includes(botNum));
    }
    const t = action.params.target || action.params.number;
    if (t && /^\d+/.test(t.replace("@s.whatsapp.net", ""))) {
      return t.includes("@") ? t : t + "@s.whatsapp.net";
    }
    return null;
  };

  switch (action.type) {
    // ===== GROUP MANAGEMENT =====
    case "KICK": {
      if (!m.isGroup) return [{ ok: false, msg: "Bukan di grup" }];
      if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: "Kamu bukan admin" }];
      if (!m.isBotAdmin) return [{ ok: false, msg: "Bot bukan admin" }];
      const target = resolveTarget();
      if (!target) return [{ ok: false, msg: "Tag orang yang mau di-kick" }];
      await sock.groupParticipantsUpdate(m.chat, [target], "remove");
      results.push({ ok: true, msg: `Berhasil kick @${target.split("@")[0]}` });
      break;
    }
    case "PROMOTE": {
      if (!m.isGroup) return [{ ok: false, msg: "Bukan di grup" }];
      if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: "Kamu bukan admin" }];
      if (!m.isBotAdmin) return [{ ok: false, msg: "Bot bukan admin" }];
      const target = resolveTarget();
      if (!target) return [{ ok: false, msg: "Tag orang yang mau di-promote" }];
      await sock.groupParticipantsUpdate(m.chat, [target], "promote");
      results.push({ ok: true, msg: `Berhasil promote @${target.split("@")[0]}` });
      break;
    }
    case "DEMOTE": {
      if (!m.isGroup) return [{ ok: false, msg: "Bukan di grup" }];
      if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: "Kamu bukan admin" }];
      if (!m.isBotAdmin) return [{ ok: false, msg: "Bot bukan admin" }];
      const target = resolveTarget();
      if (!target) return [{ ok: false, msg: "Tag orang yang mau di-demote" }];
      await sock.groupParticipantsUpdate(m.chat, [target], "demote");
      results.push({ ok: true, msg: `Berhasil demote @${target.split("@")[0]}` });
      break;
    }
    case "LEAVE": {
      if (!m.isOwner) return [{ ok: false, msg: "Hanya owner yang bisa perintah ini" }];
      if (!m.isGroup) return [{ ok: false, msg: "Bukan di grup" }];
      await sock.groupLeave(m.chat);
      results.push({ ok: true, msg: "Bot keluar dari grup" });
      break;
    }
    case "OPEN": {
      if (!m.isGroup) return [{ ok: false, msg: "Bukan di grup" }];
      if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: "Kamu bukan admin" }];
      if (!m.isBotAdmin) return [{ ok: false, msg: "Bot bukan admin" }];
      await sock.groupSettingUpdate(m.chat, "not_announcement");
      results.push({ ok: true, msg: "Grup dibuka" });
      break;
    }
    case "CLOSE": {
      if (!m.isGroup) return [{ ok: false, msg: "Bukan di grup" }];
      if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: "Kamu bukan admin" }];
      if (!m.isBotAdmin) return [{ ok: false, msg: "Bot bukan admin" }];
      await sock.groupSettingUpdate(m.chat, "announcement");
      results.push({ ok: true, msg: "Grup ditutup" });
      break;
    }
    case "TAGALL": {
      if (!m.isGroup) return [{ ok: false, msg: "Bukan di grup" }];
      if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: "Kamu bukan admin" }];
      const groupMeta = m.groupMetadata || (await sock.groupMetadata(m.chat));
      const members = groupMeta.participants.map((p) => p.id);
      const mentions = members.map((id) => `@${id.split("@")[0]}`).join(" ");
      await sock.sendMessage(m.chat, { text: `📢 *TAG ALL*\n\n${mentions}`, mentions: members }, { quoted: m });
      results.push({ ok: true, msg: "Semua member di-tag" });
      break;
    }
    case "PINS": {
      const query = action.params.query;
      if (!query) return [{ ok: false, msg: "Query pencarian tidak ditemukan" }];
      try {
        const data = await pinterest(query);
        const pinResults = data?.result?.result?.result?.slice(0, 5);
        if (!pinResults || pinResults.length === 0) {
          return [{ ok: false, msg: `Tidak ditemukan gambar untuk: ${query}` }];
        }
        let imagenya = [];
        for (const item of pinResults) {
          const imageUrl = item.image_url || item.images?.orig?.url || item.images?.["736x"]?.url;
          if (!imageUrl) continue;
          try { imagenya.push({ image: { url: imageUrl } }); } catch {}
        }
        await sock.sendMessage(m.chat, { albumMessage: imagenya }, { quoted: m });
        results.push({ ok: true, msg: `Mengirim gambar Pinterest: ${query}` });
      } catch (e) {
        results.push({ ok: false, msg: `Gagal cari Pinterest: ${e.message}` });
      }
      break;
    }
    case "ADD": {
      if (!m.isGroup) return [{ ok: false, msg: "Bukan di grup" }];
      if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: "Kamu bukan admin" }];
      if (!m.isBotAdmin) return [{ ok: false, msg: "Bot bukan admin" }];
      let num = (action.params.target || action.params.number || "").replace(/[^0-9]/g, "");
      if (!num) return [{ ok: false, msg: "Masukkan nomor yang ingin ditambahkan" }];
      if (num.startsWith("0")) num = "62" + num.slice(1);
      if (num.length < 10) return [{ ok: false, msg: "Nomor tidak valid" }];
      const jid = num + "@s.whatsapp.net";
      const addResult = await sock.groupParticipantsUpdate(m.chat, [jid], "add");
      const status = addResult?.[0]?.status;
      if (status === "200") results.push({ ok: true, msg: `Berhasil menambahkan @${num}` });
      else if (status === "408") results.push({ ok: true, msg: `Undangan terkirim ke @${num}` });
      else results.push({ ok: false, msg: `Gagal menambahkan @${num} (${status})` });
      break;
    }
    case "HIDETAG": {
      if (!m.isGroup) return [{ ok: false, msg: "Bukan di grup" }];
      if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: "Kamu bukan admin" }];
      const htMeta = m.groupMetadata || (await sock.groupMetadata(m.chat));
      const htMembers = htMeta.participants.map((p) => p.id);
      const htMsg = action.params.message || "Pengumuman";
      await sock.sendMessage(m.chat, { text: htMsg, mentions: htMembers }, { quoted: m });
      results.push({ ok: true, msg: "Hidetag terkirim" });
      break;
    }
    case "SETNAME": {
      if (!m.isGroup) return [{ ok: false, msg: "Bukan di grup" }];
      if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: "Kamu bukan admin" }];
      if (!m.isBotAdmin) return [{ ok: false, msg: "Bot bukan admin" }];
      const newName = action.params.name;
      if (!newName) return [{ ok: false, msg: "Nama grup baru tidak ditemukan" }];
      await sock.groupUpdateSubject(m.chat, newName);
      results.push({ ok: true, msg: `Nama grup diubah ke: ${newName}` });
      break;
    }
    case "SETDESC": {
      if (!m.isGroup) return [{ ok: false, msg: "Bukan di grup" }];
      if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: "Kamu bukan admin" }];
      if (!m.isBotAdmin) return [{ ok: false, msg: "Bot bukan admin" }];
      const newDesc = action.params.desc;
      if (!newDesc) return [{ ok: false, msg: "Deskripsi baru tidak ditemukan" }];
      await sock.groupUpdateDescription(m.chat, newDesc);
      results.push({ ok: true, msg: "Deskripsi grup diubah" });
      break;
    }
    case "DELETE": {
      if (!m.quoted) return [{ ok: false, msg: "Reply pesan bot yang ingin dihapus" }];
      if (!m.quoted.key?.fromMe) return [{ ok: false, msg: "Hanya bisa hapus pesan bot" }];
      await sock.sendMessage(m.chat, { delete: m.quoted.key });
      results.push({ ok: true, msg: "Pesan dihapus" });
      break;
    }
    case "WARN": {
      if (!m.isGroup) return [{ ok: false, msg: "Bukan di grup" }];
      if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: "Kamu bukan admin" }];
      const warnTarget = resolveTarget();
      if (!warnTarget) return [{ ok: false, msg: "Tag orang yang mau di-warn" }];
      const db = getDatabase();
      const warns = db.getGroup(m.chat)?.warns || {};
      const targetNum = warnTarget.split("@")[0];
      warns[targetNum] = (warns[targetNum] || 0) + 1;
      db.setGroup(m.chat, { warns });
      db.save();
      results.push({ ok: true, msg: `⚠️ Warning ${warns[targetNum]}/3 untuk @${targetNum}` });
      if (warns[targetNum] >= 3) {
        try {
          await sock.groupParticipantsUpdate(m.chat, [warnTarget], "remove");
          warns[targetNum] = 0;
          db.setGroup(m.chat, { warns });
          db.save();
          results.push({ ok: true, msg: `@${targetNum} di-kick karena 3x warning` });
        } catch {}
      }
      break;
    }
    case "STICKER": {
      let stickerBuffer = null;
      if (m.isImage && m.download) stickerBuffer = await m.download();
      else if (m.quoted?.isImage && m.quoted?.download) stickerBuffer = await m.quoted.download();
      if (!stickerBuffer) return [{ ok: false, msg: "Kirim atau reply gambar untuk dijadikan sticker" }];
      await sock.sendMessage(m.chat, { sticker: stickerBuffer, packname: config.bot?.name || "Maro", author: "AutoAI" }, { quoted: m });
      results.push({ ok: true, msg: "Sticker terkirim" });
      break;
    }
    case "ANTILINK": {
      if (!m.isGroup) return [{ ok: false, msg: "Bukan di grup" }];
      if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: "Kamu bukan admin" }];
      const alMode = (action.params.mode || "").toLowerCase();
      if (!["on", "off"].includes(alMode)) return [{ ok: false, msg: "Mode harus on atau off" }];
      const alDb = getDatabase();
      alDb.setGroup(m.chat, { antilink: alMode === "on" });
      alDb.save();
      results.push({ ok: true, msg: `Antilink ${alMode === "on" ? "diaktifkan" : "dinonaktifkan"}` });
      break;
    }

    // ===== NEW INTERACTIVE MESSAGES =====
    case "POLL": {
      const question = action.params.question || "Vote!";
      const options = (action.params.options || "Yes,No").split(",").map((o) => o.trim()).filter(Boolean);
      if (options.length < 2) return [{ ok: false, msg: "Minimal 2 opsi" }];
      await sock.sendMessage(m.chat, { poll: { name: question, values: options, selectableCount: 1 } }, { quoted: m });
      results.push({ ok: true, msg: `Poll: ${question}` });
      break;
    }
    case "PAYMENT": {
      const amount = parseInt(action.params.amount || "10000");
      const note = action.params.note || "Pembayaran";
      await sock.sendMessage(m.chat, {
        requestPaymentMessage: {
          amount,
          currencyCode: "IDR",
          noteMessage: { extendedTextMessage: { text: note } },
          from: sock.user?.id || "0@s.whatsapp.net"
        }
      }, { quoted: m });
      results.push({ ok: true, msg: `Payment request: Rp${amount}` });
      break;
    }
    case "PRODUCT": {
      const title = action.params.title || "Produk";
      const price = parseInt(action.params.price || "10000");
      const desc = action.params.desc || "";
      const imageUrl = action.params.imageurl || "";
      await sock.sendMessage(m.chat, {
        productMessage: {
          product: {
            productImage: imageUrl ? { url: imageUrl } : undefined,
            productId: `prod_${Date.now()}`,
            title,
            description: desc,
            currencyCode: "IDR",
            priceAmount1000: price * 1000,
            retailerId: config.bot?.name || "maro-shop",
            url: imageUrl || "",
            productImageCount: imageUrl ? 1 : 0,
          },
          businessOwnerJid: sock.user?.id || "0@s.whatsapp.net",
        }
      }, { quoted: m });
      results.push({ ok: true, msg: `Produk: ${title} - Rp${price}` });
      break;
    }
    case "EVENT": {
      const name = action.params.name || "Event";
      const desc = action.params.desc || "";
      const location = action.params.location || "";
      const startTime = Date.now() + 3600000;
      const endTime = startTime + 7200000;
      await sock.sendMessage(m.chat, {
        eventMessage: {
          event: {
            name,
            description: desc,
            startTime,
            endTime,
            location: location ? { name: location } : undefined,
          }
        }
      }, { quoted: m });
      results.push({ ok: true, msg: `Event: ${name}` });
      break;
    }
    case "ALBUM": {
      const query = action.params.query || "nature";
      try {
        const data = await pinterest(query);
        const pinResults = data?.result?.result?.result?.slice(0, 10);
        if (!pinResults || pinResults.length === 0) return [{ ok: false, msg: `Tidak ditemukan: ${query}` }];
        const images = [];
        for (const item of pinResults) {
          const url = item.image_url || item.images?.orig?.url || item.images?.["736x"]?.url;
          if (url) images.push({ image: { url } });
        }
        if (images.length === 0) return [{ ok: false, msg: "Gagal memuat gambar" }];
        await sock.sendMessage(m.chat, { albumMessage: images }, { quoted: m });
        results.push({ ok: true, msg: `Album: ${query} (${images.length} gambar)` });
      } catch (e) {
        results.push({ ok: false, msg: `Gagal: ${e.message}` });
      }
      break;
    }
    case "REMINDER": {
      const seconds = parseInt(action.params.time || "60");
      const message = action.params.message || "⏰ Pengingat!";
      if (seconds > 86400) return [{ ok: false, msg: "Maksimal 24 jam (86400 detik)" }];
      setTimeout(async () => {
        try {
          await sock.sendMessage(m.chat, { text: `⏰ *PENGINGAT*\n\n${message}\n\n> Dari: @${m.sender.split("@")[0]}`, mentions: [m.sender] }, { quoted: m });
        } catch {}
      }, seconds * 1000);
      results.push({ ok: true, msg: `⏰ Pengingat dalam ${seconds} detik` });
      break;
    }
    case "REACT": {
      const emoji = action.params.emoji || "👍";
      const targetKey = m.quoted?.key || m.key;
      await sock.sendMessage(m.chat, { react: { key: targetKey, text: emoji } });
      results.push({ ok: true, msg: `Reaksi: ${emoji}` });
      break;
    }
    case "CONTACT": {
      const name = action.params.name || "Contact";
      const number = action.params.number || action.params.target || "628xxx";
      const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:+${number}\nEND:VCARD`;
      await sock.sendMessage(m.chat, { contacts: { displayName: name, contacts: [{ vcard }] } }, { quoted: m });
      results.push({ ok: true, msg: `Kontak: ${name}` });
      break;
    }
    case "LOCATION": {
      const lat = parseFloat(action.params.lat || "-6.2");
      const lon = parseFloat(action.params.lon || "106.8");
      const locName = action.params.name || "Location";
      await sock.sendMessage(m.chat, { location: { degreesLatitude: lat, degreesLongitude: lon, name: locName } }, { quoted: m });
      results.push({ ok: true, msg: `Lokasi: ${locName}` });
      break;
    }
    case "BUTTONS": {
      const btnTitle = action.params.title || "Menu";
      const btnText = action.params.text || "";
      const btnsStr = action.params.buttons || "Option1|id1,Option2|id2";
      const btns = btnsStr.split(",").map((b) => {
        const [display, id] = b.trim().split("|");
        return { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: display?.trim() || "Option", id: id?.trim() || display?.trim() || "opt" }) };
      });
      await sock.sendMessage(m.chat, {
        interactiveMessage: {
          title: btnTitle,
          body: { text: btnText },
          footer: { text: `Powered by ${config.bot?.name || "Tarboo Bot"}` },
          buttons: btns,
        }
      }, { quoted: m });
      results.push({ ok: true, msg: `Buttons: ${btnTitle}` });
      break;
    }
    case "CAROUSEL": {
      const cardsStr = action.params.cards || "";
      const cards = cardsStr.split(",").map((c) => {
        const [title, desc, url] = c.trim().split("|");
        return { title: title?.trim(), description: desc?.trim(), imageUrl: url?.trim() };
      }).filter((c) => c.title);
      if (cards.length === 0) return [{ ok: false, msg: "Tidak ada kartu" }];
      const images = cards.map((c) => ({ image: { url: c.imageUrl || "" }, caption: `*${c.title}*\n${c.description || ""}` }));
      await sock.sendMessage(m.chat, { albumMessage: images }, { quoted: m });
      results.push({ ok: true, msg: `Carousel: ${cards.length} kartu` });
      break;
    }
    case "INVITE": {
      if (!m.isGroup) return [{ ok: false, msg: "Bukan di grup" }];
      if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: "Kamu bukan admin" }];
      try {
        const code = await sock.groupInviteCode(m.chat);
        const inviteLink = `https://chat.whatsapp.com/${code}`;
        await m.reply(`🔗 *Link Invite*\n\n${inviteLink}`);
        results.push({ ok: true, msg: "Link invite dibuat" });
      } catch (e) {
        results.push({ ok: false, msg: `Gagal: ${e.message}` });
      }
      break;
    }
    case "EPHEMERAL": {
      if (!m.isGroup) return [{ ok: false, msg: "Bukan di grup" }];
      if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: "Kamu bukan admin" }];
      const time = parseInt(action.params.time || "86400");
      await sock.groupToggleEphemeral(m.chat, time);
      results.push({ ok: true, msg: `Pesan menghilang: ${time} detik` });
      break;
    }
    case "MUTE": {
      if (!m.isGroup) return [{ ok: false, msg: "Bukan di grup" }];
      if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: "Kamu bukan admin" }];
      await sock.groupSettingUpdate(m.chat, "locked");
      results.push({ ok: true, msg: "Grup dibisukan" });
      break;
    }
    case "UNMUTE": {
      if (!m.isGroup) return [{ ok: false, msg: "Bukan di grup" }];
      if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: "Kamu bukan admin" }];
      await sock.groupSettingUpdate(m.chat, "unlocked");
      results.push({ ok: true, msg: "Grup dibuka suaranya" });
      break;
    }
    case "BLOCK": {
      if (!m.isOwner) return [{ ok: false, msg: "Hanya owner" }];
      const target = action.params.target || action.params.number;
      if (!target) return [{ ok: false, msg: "Masukkan nomor" }];
      const jid = target.includes("@") ? target : target + "@s.whatsapp.net";
      await sock.updateBlockStatus(jid, "block");
      results.push({ ok: true, msg: `Diblokir: @${jid.split("@")[0]}` });
      break;
    }
    case "UNBLOCK": {
      if (!m.isOwner) return [{ ok: false, msg: "Hanya owner" }];
      const target = action.params.target || action.params.number;
      if (!target) return [{ ok: false, msg: "Masukkan nomor" }];
      const jid = target.includes("@") ? target : target + "@s.whatsapp.net";
      await sock.updateBlockStatus(jid, "unblock");
      results.push({ ok: true, msg: `Dibuka blokir: @${jid.split("@")[0]}` });
      break;
    }
    case "LEARNSTATS": {
      if (!m.isOwner) return [{ ok: false, msg: "⛔ هذا التقرير مخصص للمالك فقط" }];
      const health = getAutoAIHealth();
      const report = health.length
        ? health.map((entry) => `${entry.type === "error" ? "❌" : "✅"} ${entry.operation}: ${entry.count}`).join("\n")
        : "لا توجد بيانات تشغيل مسجلة حتى الآن.";
      await m.reply(`🧠 *إحصاءات Auto AI*\n\n${report}`);
      results.push({ ok: true, msg: "تم عرض الإحصاءات" });
      break;
    }
  }

  return results;
}

// ========== HANDLE AUTO AI ==========
async function handleAutoAI(m, sock, dependencies = {}) {
  if (!m?.chat) return false;
  const groupReplyDecision = m.isGroup ? shouldReplyAsBot(m, sock) : { allowed: true, reason: "" };

  const db = dependencies.db || getDatabase();
  const chatProvider = dependencies.geminiChat || geminiChat;
  const naturalRequestHandler = dependencies.naturalRequestHandler || handleNaturalAIRequest;
  const codeReviewHandler = dependencies.codeReviewHandler || handleCodeReviewFlow;
  const rememberMessageHandler = dependencies.rememberGroupMessage || rememberGroupMessage;
  const saveLongTermMemoryHandler = dependencies.saveLongTermMemory || saveLongTermMemoryIfEnabled;
  const hasInjectedChatProvider = Boolean(dependencies.geminiChat);
  const routedProviders = {
    GeminiAPI: dependencies.aiProviders?.GeminiAPI || chatProvider,
    DeepSeek: dependencies.aiProviders?.DeepSeek || (hasInjectedChatProvider ? undefined : async ({ message, instruction }) => ({ text: await withProviderTimeout(() => DeepSeekThinking(`${instruction}\n\n${message}`), "DeepSeek") })),
    GPT: dependencies.aiProviders?.GPT || (hasInjectedChatProvider ? undefined : async ({ message, instruction, history }) => {
      const result = await withProviderTimeout(() => GPT5(`${instruction}\\n\\n${message}`, { history }), "GPT");
      if (!result?.status) throw new Error(result?.error || "تعذر رد مزود GPT");
      return { text: result.answer || "" };
    }),
    Claude: dependencies.aiProviders?.Claude || (hasInjectedChatProvider ? undefined : async (payload) => claudeChat(payload)),
  };
  if (!db?.db?.data) return false;
  if (!db.db.data.autoai) db.db.data.autoai = {};
  if (!db.db.data.autoai_global) db.db.data.autoai_global = { enabled: false };

  let autoai = db.db.data.autoai[m.chat];
  let isGlobalMode = false;
  if (autoai && autoai.enabled) {
    // per-group config is active, use it
  } else if (autoai && autoai.enabled === false) {
    // explicit opt-out from global
    return false;
  } else {
    // no per-group config, check global
    const globalCfg = db.db.data.autoai_global;
    if (!globalCfg.enabled) return false;
    isGlobalMode = true;
    if (!globalCfg.sessions) globalCfg.sessions = {};
    autoai = {
      enabled: true,
      alwaysReply: globalCfg.alwaysReply !== false,
      character: globalCfg.character || "global",
      characterName: globalCfg.characterName || "Global",
      instruction: globalCfg.instruction,
      responseType: globalCfg.responseType || "text",
      replyMode: globalCfg.replyMode,
      replyScope: globalCfg.replyScope,
      sessions: globalCfg.sessions,
    };
  }

  const botJid = sock.user?.id?.split(":")[0] + "@s.whatsapp.net";
  const botLid = sock.user?.lid || null;
  const botNumber = sock.user?.id?.split(":")[0] || "";
  const botFullId = sock.user?.id || "";

  if (m.isCommand && m.command === "autoai") return false;

  if (m.isCommand && !m.isOwner) {
    if (autoai.enableCommands) return false;
    return true;
  }
  if (!groupReplyDecision.allowed) {
    autoai.lastSkipReason = describeAutoAISkip(groupReplyDecision.reason);
    if (isGlobalMode) db.db.data.autoai_global.lastSkipReason = autoai.lastSkipReason;
    try { db.save(); } catch {}
    if (groupReplyDecision.reason === "rate-limit") await m.react("🤖").catch(() => {});
    return false;
  }

  const isBotJid = (jid) => {
    const candidate = String(jid || "");
    if (!candidate) return false;
    if (candidate === botJid || candidate === botLid || candidate === botFullId) return true;
    const jidUser = candidate.split("@")[0]?.split(":")[0];
    return Boolean(botNumber && (jidUser === botNumber || candidate.includes(botNumber)));
  };
  const rawContexts = [
    m.message?.extendedTextMessage?.contextInfo,
    m.message?.imageMessage?.contextInfo,
    m.message?.videoMessage?.contextInfo,
    m.message?.documentMessage?.contextInfo,
    m.message?.conversation?.contextInfo,
  ].filter(Boolean);
  const mentionedJids = [
    ...(Array.isArray(m.mentionedJid) ? m.mentionedJid : []),
    ...rawContexts.flatMap((context) => Array.isArray(context?.mentionedJid) ? context.mentionedJid : []),
  ];
  const bodyMention = Boolean(botNumber && String(m.body || "").includes(`@${botNumber}`));
  const isMentioned = mentionedJids.some(isBotJid) || bodyMention;

  let isBotQuoted = false;
  const quotedContext = rawContexts.find((context) => context?.quotedMessage || context?.participant);
  if (m.quoted || quotedContext) {
    const quotedSender = m.quoted?.sender || m.quoted?.key?.participant || quotedContext?.participant || "";
    const quotedFromMe = m.quoted?.fromMe || m.quoted?.key?.fromMe || quotedContext?.fromMe;
    isBotQuoted = Boolean(quotedFromMe || isBotJid(quotedSender));
  }

  const replyPolicy = shouldAutoAIReply({ autoai, isGroup: Boolean(m.isGroup), isMentioned, isBotQuoted });
  if (!replyPolicy.allowed) return false;

  let precomputedAgentResult = null;
  try {
    precomputedAgentResult = await handleAgentRequest(m);
  } catch (agentError) {
    console.error("[AutoAI Agent]", agentError.message);
  }

  if (!precomputedAgentResult?.detected) {
    try {
      if (await naturalRequestHandler(m, sock, { db, healthEntries: dependencies.healthEntries || getAutoAIHealth() })) return true;
      if (await codeReviewHandler(m)) return true;
    } catch (reviewError) {
      await m.reply(`❌ تعذر إكمال تحليل الملف: ${reviewError.message}`);
      return true;
    }
  }

  const userMessage = m.body || "";
  let agentContext = precomputedAgentResult?.context || "";
  let agentDetected = Boolean(precomputedAgentResult?.detected);
  if (precomputedAgentResult?.blocked) {
    agentContext += "\n\nلا تذكر أدوات أو نتائج غير متاحة للمستخدم، وحافظ على أسلوب الشخصية الحالية.";
  }

  const hasImage =
    m.isImage ||
    (m.quoted && (m.quoted.isImage || m.quoted.type === "imageMessage"));

  if (!userMessage && !hasImage) return false;

  const senderNumber = m.sender.split("@")[0];

  if (isOnCooldown(senderNumber)) return false;

  try {
    await sock.sendPresenceUpdate("composing", m.chat);
    setCooldown(senderNumber);
    rememberMessageHandler(m);

    let imageBuffer = null;
    if (hasImage) {
      try {
        if (m.isImage && m.download) {
          imageBuffer = await m.download();
        } else if (m.quoted?.download) {
          imageBuffer = await m.quoted.download();
        }
      } catch (e) {
        console.log("[AutoAI] Image download failed:", e.message);
      }
    }

    if (!autoai.sessions) autoai.sessions = {};
    const userSession = autoai.sessions[senderNumber] || { history: [] };
    const history = userSession.history || [];

    let contextParts = [];
    if (m.pushName && m.pushName !== "Unknown") {
      contextParts.push(`User: "${m.pushName}" (${senderNumber})`);
    }
    if (m.isOwner) contextParts.push("User ini adalah OWNER bot.");
    if (m.isAdmin) contextParts.push("User ini adalah ADMIN grup.");

    const groupContext = getGroupContext(m.chat);
    if (groupContext.length > 1) {
      contextParts.push(
        "Konteks pesan grup terbaru:\n" +
          groupContext.slice(-10).map((entry) => `- ${entry.sender}: ${entry.text}`).join("\n"),
      );
    }
    const storedGroupMemory = buildGroupMemoryContext(db, m.chat);
    if (storedGroupMemory) contextParts.push(storedGroupMemory);

    if (m.mentionedJid?.length > 0) {
      const mentionList = m.mentionedJid
        .filter((j) => !j.includes(sock.user?.id?.split(":")[0]))
        .map((j) => j)
        .join(", ");
      if (mentionList) contextParts.push(`User menyebut/tag: ${mentionList}`);
    }

    if (imageBuffer) {
      contextParts.push(
        "User mengirimkan sebuah gambar. Analisis gambar tersebut.",
      );
    }

    contextParts.push(userMessage || "(gambar tanpa teks)");

    if (agentContext) contextParts.push(agentContext);
    const fullMessage = contextParts.join("\n");
    const aiMode = autoai.mode || "assistant";
    
    let fullInstruction = autoai.instruction;
    if (agentDetected) {
      fullInstruction += "\n\nأنت واجهة الشخصية للمستخدم، لكنك تعمل فوق وكيل المشروع الموحد. إذا طلب المستخدم بحثاً أو تحليلاً أو فحصاً، استخدم نتائج الوكيل المرفقة. لا تقل إنك لا تملك الوصول إلى الملفات إذا ظهرت نتائج الوكيل. لا تخترع نتائج غير موجودة. حافظ على أسلوب الشخصية الحالي.";
    }
    if (aiMode === "assistant") {
      fullInstruction += "\n\n" + SYSTEM_PROMPT_ACTIONS;
    } else {
      fullInstruction += "\n\nHanya lakukan percakapan santai. Jangan memberikan format aksi apa pun. Panggil atau sebut nama user jika diperlukan.";
    }

    saveToHistory(autoai, senderNumber, "user", userMessage || "[gambar]");
    saveLongTermMemoryHandler(
      senderNumber,
      userMessage?.slice(0, 50) || "صورة",
      userMessage || "[صورة]",
    );

    let aiResponse = "";
    try {
      const providerRoute = chooseProviderRoute({ text: userMessage, hasImage: Boolean(imageBuffer) });
      const result = await runRoutedChat({
        route: providerRoute,
        providers: routedProviders,
        payload: {
        message: fullMessage,
        instruction: fullInstruction,
        imageBuffer,
        history,
        },
      });
      aiResponse = result.text || getFallbackResponse();
      autoai.lastError = "";
      if (isGlobalMode) db.db.data.autoai_global.lastError = "";
      learnFromSuccess(result.provider || providerRoute.primary);
    } catch (apiError) {
      console.error("[AutoAI API Error]", apiError.message);
      learnFromError("AIRouter", apiError);
      autoai.lastError = String(apiError.message || apiError).slice(0, 180);
      if (isGlobalMode) db.db.data.autoai_global.lastError = autoai.lastError;
      aiResponse = getFallbackResponse();
    }

    const normalizedAiResponse = normalizeStructuredResponse(aiResponse);
    let actions = [];
    let richMessages = [];
    let cleanResponse = normalizedAiResponse;

    if (aiMode === "assistant") {
      const aiActions = parseActions(normalizedAiResponse);
      const intentActions = detectIntentFromMessage(userMessage, m);
      actions = mergeActions(aiActions, intentActions);
      richMessages = parseRichMessage(normalizedAiResponse);
      cleanResponse = cleanRichTags(cleanActionTags(normalizedAiResponse));
    }

    saveToHistory(autoai, senderNumber, "assistant", cleanResponse);
    db.save();

    await sock.sendPresenceUpdate("paused", m.chat);

    const typingDelay = Math.min(cleanResponse.length * 20, 2000);
    await new Promise((r) => setTimeout(r, typingDelay));

    if (autoai.responseType === "voice") {
      try {
        await sock.sendPresenceUpdate("recording", m.chat);
        const execAsync = promisify(exec);

        const tempDir = path.join(process.cwd(), "temp");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const apiUrl = `https://firefly.maiku.my.id/api/crikk?apikey=${config.APIkey.firefly}&text=${encodeURIComponent(cleanResponse.substring(0, 500))}&voice=id-ID-ArdiNeural`;
        const response = await axios.get(apiUrl);
        
        if (!response.data?.status || !response.data?.data?.audio) {
          throw new Error("Gagal generate audio dari API Firefly");
        }
        
        const audioRes = await axios.get(response.data.data.audio, {
          responseType: "arraybuffer",
          timeout: 30000
        });

        const mp3Path = path.join(tempDir, `autoai_${Date.now()}.mp3`);
        fs.writeFileSync(mp3Path, Buffer.from(audioRes.data));

        const oggPath = mp3Path.replace(".mp3", ".ogg");
        try {
          await execAsync(
            `ffmpeg -y -i "${mp3Path}" -c:a libopus -b:a 64k -ac 1 -ar 48000 "${oggPath}"`,
            { timeout: 30000 },
          );
        } catch {}

        let audioBuffer;
        let mime = "audio/mpeg";
        if (fs.existsSync(oggPath)) {
          audioBuffer = fs.readFileSync(oggPath);
          mime = "audio/ogg; codecs=opus";
          try {
            fs.unlinkSync(oggPath);
          } catch {}
        } else {
          audioBuffer = fs.readFileSync(mp3Path);
        }
        try {
          fs.unlinkSync(mp3Path);
        } catch {}

        await sock.sendMessage(
          m.chat,
          {
            audio: audioBuffer,
            mimetype: mime,
            ptt: true,
          },
          { quoted: m },
        );

        await sock.sendPresenceUpdate("paused", m.chat);
      } catch {
        await m.reply(cleanResponse);
      }
    } else {
      let richSent = false;
      let stickerSent = false;
      if (richMessages.length > 0) {
        for (const rich of richMessages) {
          const sent = await sendRichMessage(rich, sock, m.chat, m);
          if (sent) {
            if (rich.type === "STICKER") {
              stickerSent = true;
            } else {
              richSent = true;
            }
          }
        }
      }
      if ((!richSent || stickerSent) && cleanResponse) {
        await m.reply(cleanResponse);
      }
    }

    for (const action of actions) {
      try {
        const results = await executeAction(action, m, sock);
        for (const r of results) {
          if (!r.ok) {
            await m.reply(`⚠️ ${r.msg}`);
          }
        }
      } catch (e) {
        console.error("[AutoAI Action Error]", action.type, e.message);
        await m.reply(`❌ Gagal menjalankan ${action.type}: ${e.message}`);
      }
    }

    return true;
  } catch (error) {
    console.error("[AutoAI Error]", error.message);
    learnFromError("AutoAI:Main", error);
    if (autoai) {
      autoai.lastError = String(error.message || error).slice(0, 180);
      if (isGlobalMode) db.db.data.autoai_global.lastError = autoai.lastError;
      try { db.save(); } catch {}
    }
    await sock.sendPresenceUpdate("paused", m.chat);
    try {
      await m.reply(getFallbackResponse());
    } catch {}
    return true;
  }
}

function isAutoAIEnabled(chatId) {
  const db = getDatabase();
  if (!db?.db?.data?.autoai) return false;
  return db.db.data.autoai[chatId]?.enabled || false;
}

function getAutoAICharacter(chatId) {
  const db = getDatabase();
  if (!db?.db?.data?.autoai) return null;
  return db.db.data.autoai[chatId]?.characterName || null;
}

function clearUserSession(chatId, senderNumber) {
  const db = getDatabase();
  if (!db?.db?.data?.autoai?.[chatId]?.sessions?.[senderNumber]) return false;
  delete db.db.data.autoai[chatId].sessions[senderNumber];
  db.save();
  return true;
}

export { handleAutoAI, isAutoAIEnabled, getAutoAICharacter, clearUserSession };
