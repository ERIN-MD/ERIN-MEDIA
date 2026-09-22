import { getCasesByCategory } from "../../../case/maro.js";
import { prepareWAMessageMedia, generateWAMessageFromContent } from "maro";
import sharp from "sharp";
import config from "../../../config.js";
import { formatUptime, getTimeGreeting } from "../../../src/lib/maro-formatter.js";
import { getCommandsByCategory, getCategories } from "../../../src/lib/maro-plugins.js";
import { getDatabase } from "../../../src/lib/maro-database.js";
import fs from "fs";

const pluginConfig = {
  name: "menu",
  alias: ["help", "اوامر", "commands", "m", "أوامر"],
  category: "main",
  description: "عرض القائمة الرئيسية",
  usage: ".menu",
  example: ".menu",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

const CATEGORY_EMOJIS = {
  owner: "👑", main: "🏠", utility: "🔧", tools: "🛠️",
  fun: "🎮", game: "🎯", download: "📥", search: "🔍",
  sticker: "🖼️", media: "🎬", ai: "🤖", group: "👥",
  religi: "☪️", info: "ℹ️", user: "📊", rpg: "🗡️",
  ephoto: "🖌️", anime: "🍥", panel: "🖥️", vps: "🌊",
  convert: "🔄", random: "🎲", premium: "💎", nsfw: "🔞",
  cek: "📁", canvas: "🎨", store: "🏪", jpm: "📨",
  pushkontak: "📤", linode: "☁️", primbon: "🔮", cecan: "💃",
  stalker: "🕵️", tts: "🗣️", berita: "📰", clan: "⚔️"
};

function toSmallCaps(text) {
  const smallCaps = {
    a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ",
    i: "ɪ", j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ",
    q: "ǫ", r: "ʀ", s: "s", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x",
    y: "ʏ", z: "ᴢ",
  };
  return text.toLowerCase().split("").map((c) => smallCaps[c] || c).join("");
}

function toMathBold(text) {
  const map = {
    'A':'𝐀','B':'𝐁','C':'𝐂','D':'𝐃','E':'𝐄','F':'𝐅','G':'𝐆','H':'𝐇','I':'𝐈','J':'𝐉',
    'K':'𝐊','L':'𝐋','M':'𝐌','N':'𝐍','O':'𝐎','P':'𝐏','Q':'𝐐','R':'𝐑','S':'𝐒','T':'𝐓',
    'U':'𝐔','V':'𝐕','W':'𝐖','X':'𝐗','Y':'𝐘','Z':'𝐙',
    '0':'𝟎','1':'𝟏','2':'𝟐','3':'𝟑','4':'𝟒','5':'𝟓','6':'𝟔','7':'𝟕','8':'𝟖','9':'𝟗'
  };
  return text.split('').map(c => map[c] || c).join('');
}

function getSortedCategories(m, botMode) {
  const categories = getCategories();
  const commandsByCategory = getCommandsByCategory();
  const categoryOrder = [
    "owner", "main", "utility", "tools", "fun", "game", "download",
    "search", "sticker", "media", "ai", "group", "religi", "info",
    "cek", "economy", "user", "canvas", "random", "premium", "ephoto",
    "jpm", "pushkontak", "panel", "store"
  ];
  let modeExcludeMap = { md: ["panel", "pushkontak", "store"] };
  const excludeCats = modeExcludeMap[botMode] || [];
  const sortedCats = [...categories].sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });
  const result = [];
  for (const cat of sortedCats) {
    if (cat === "owner" && !m.isOwner) continue;
    if (excludeCats.includes(cat.toLowerCase())) continue;
    const cmds = commandsByCategory[cat] || [];
    if (cmds.length === 0) continue;
    const emoji = CATEGORY_EMOJIS[cat] || "📁";
    result.push({ cat, cmds, emoji });
  }
  return { sorted: result, commandsByCategory };
}

async function handler(m, { sock, config: botConfig, db, uptime }) {
  const savedVariant = db.setting("menuVariant");
  const menuVariant = savedVariant || botConfig.ui?.menuVariant || 1;
  const groupData = m.isGroup ? db.getGroup(m.chat) || {} : {};
  const botMode = groupData.botMode || "md";
  const prefix = botConfig.command?.prefix || ".";
  const greeting = getTimeGreeting();
  const uptimeFormatted = formatUptime(uptime);
  const user = await db.getUser(m.sender) || {};
  const totalUsers = db.getUserCount();
  const categories = getSortedCategories(m, botMode);
  const totalCmds = categories.sorted.reduce((acc, { cmds }) => acc + cmds.length, 0);

  const level = Math.floor((user?.exp || 0) / 20000) + 1;
  const requiredXP = level * 20000;
  const xp = user?.exp || 0;
  const percent = Math.min(Math.floor((xp / requiredXP) * 100), 100);
  const progressBar = '█'.repeat(Math.floor(percent / 10)) + '░'.repeat(10 - Math.floor(percent / 10));
  let rankEmoji = "👤", rankTitle = "عضو", userRole = "مستخدم";
  if (m.isOwner) { rankEmoji = "👑"; rankTitle = "مالك"; userRole = "مالك"; }
  else if (m.isPremium) { rankEmoji = "💎"; rankTitle = "مميز"; userRole = "مميز"; }

  const categoryRows = categories.sorted.map(({ cat, cmds, emoji }) => ({
    title: `${emoji} ${cat.toUpperCase()}`,
    id: `${m.prefix}menucat ${cat}`,
    description: `(${cmds.length}) أوامر`
  }));

  const now = new Date();
  const time = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });

  // ==============================================
  // الشكل 1 - Tarboo Bot العربي (مع صوت + صورة)
  // ==============================================
  if (menuVariant === 1) {
    const thumbnail = await sharp(fs.readFileSync(config.assets["maro"])).resize(300, 170).toBuffer();

    const textBody = 
`*╭━━${toMathBold('M A R O   B O T')}━━━°⃟𑁁⚡*
${toSmallCaps(`> °⃟𑁁⚡ الاسم: ${config.bot?.name}`)}
${toSmallCaps(`> °⃟𑁁⚡ الرقم: ${config.owner?.number?.[0] || ""}`)}
${toSmallCaps(`> °⃟𑁁⚡ التشغيل: ${uptimeFormatted}`)}
${toSmallCaps(`> °⃟𑁁⚡ التاريخ: ${date}`)}
${toSmallCaps(`> °⃟𑁁⚡ الوقت: ${time}`)}
${toSmallCaps(`> °⃟𑁁⚡ الأوامر: ${totalCmds}`)}
${toSmallCaps(`> °⃟𑁁⚡ المستخدمين: ${totalUsers}`)}
*╰━━${toMathBold(config.bot?.name || 'BOT')}━━°⃟𑁁⚡*
${toSmallCaps(`> °⃟𑁁⚡ المستخدم: ${m.pushName} ${rankEmoji}`)}
${toSmallCaps(`> °⃟𑁁⚡ الصلاحية: ${userRole}`)}
${toSmallCaps(`> °⃟𑁁⚡ الرتبة: ${rankTitle}`)}
${toSmallCaps(`> °⃟𑁁⚡ المستوى: ${level} (${xp}/${requiredXP})`)}
${toSmallCaps(`> °⃟𑁁⚡ التقدم: ${progressBar}`)}
*╭━━━━━━━━━━━━°⃟𑁁⚡*
 *〔 مرحبا بيك في ${toMathBold(config.bot?.name || 'BOT')} 〕*
*╰━━━━━━━━━━━━°⃟𑁁⚡*

${toSmallCaps('_اختر قسم من زر القائمة أدناه_')}`;

    const content = {
      buttonsMessage: {
        buttons: [
          {
            buttonText: { displayText: '📂 القائمة' },
            buttonId: 'menu',
            type: 1,
            nativeFlowInfo: {
              name: 'single_select',
              paramsJson: JSON.stringify({
                title: '📋 الأقسام',
                sections: [{ title: 'اختر القسم', rows: categoryRows }],
              }),
            },
          },
          { buttonId: `${m.prefix}owner`, buttonText: { displayText: '👑 المطور' }, type: 1 },
          { buttonId: `${m.prefix}rules`, buttonText: { displayText: '📜 القوانين' }, type: 1 },
        ],
        locationMessage: { jpegThumbnail: thumbnail, name: config.bot.name, address: `● متصل | v${config.bot.version}` },
        contentText: textBody,
        footerText: config.bot.name,
        headerType: 6,
      },
    };

    const msg = generateWAMessageFromContent(m.chat, content, { userJid: sock.user.jid });
    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

    // صوت الشكل 1 مع صورة
    const audioEnabled = db.setting("audioMenu") !== false;
    if (audioEnabled) {
      try {
        const thumbBuffer = fs.readFileSync(config.assets["maro2"]);
        const resizedThumb = await sharp(thumbBuffer).resize(300, 300).toBuffer();
        
        const qOrder = { 
          key: { fromMe: false, participant: "0@s.whatsapp.net", remoteJid: "status@broadcast" },
          message: { 
            orderMessage: { 
              orderId: "44444444444444", 
              thumbnail: resizedThumb,
              itemCount: totalCmds, 
              status: "INQUIRY", 
              surface: "CATALOG", 
              message: `★ ${config.bot.name}`, 
              orderTitle: `📋 ${totalCmds} أوامر`, 
              sellerJid: m.sender, 
              token: "maro-menu", 
              totalAmount1000: 3333333, 
              totalCurrencyCode: "IDR" 
            } 
          }
        };
        await sock.sendMessage(m.chat, { audio: fs.readFileSync(config.assets["maro-mp3"]), mimetype: "audio/mpeg" }, { quoted: qOrder });
      } catch (e) {}
    }

    return;
  }

  // ==============================================
  // الشكل 2 - الجديد (nativeFlow + أيقونة + صوت + رد مزيف)
  // ==============================================
  if (menuVariant === 2) {
    const thumbnail = await sharp(fs.readFileSync(config.assets["maro2"])).resize(300, 300).toBuffer();

    const qOrder = { 
      key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: m.sender }, 
      message: { 
        locationMessage: { 
          degreesLatitude: 0, degreesLongitude: 0, 
          name: `🟢 ${config.bot.name} متصل`, 
          address: `📋 ${categories.sorted.length} قسم | 👥 ${totalUsers} مستخدم`,
          jpegThumbnail: thumbnail 
        } 
      } 
    };

    const media = await prepareWAMessageMedia(
      { image: fs.readFileSync(config.assets["maro2"]) },
      { upload: sock.waUploadToServer }
    );

    const footerText = 
`╭━━━ ${toMathBold('M A R O   B O T')} ━━━╮
┃  ${toSmallCaps('مرحباً')} *${m.pushName}* 👋
┃  ${toSmallCaps('الوقت')} : ${time} ⏰
┃  ${toSmallCaps('التاريخ')} : ${date} 📅
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭─「 🤖 *معلومات البوت* 」─╮
┃  📛 *الاسم* : ${config.bot?.name}
┃  📌 *الإصدار* : ${config.bot?.version}
┃  👥 *المستخدمين* : ${totalUsers}
╰━━━━━━━━━━━━━━━━━━╯

╭─「 👤 *ملفك الشخصي* 」─╮
┃  ${rankEmoji} *الرتبة* : ${rankTitle}
┃  ⭐ *المستوى* : ${level}
┃  📊 *الخبرة* : ${xp}/${requiredXP}
┃  ${progressBar} ${percent}%
╰━━━━━━━━━━━━━━━━━━╯

${toSmallCaps('_اختر من الأزرار أدناه ↓_')}`;

    const content = {
      interactiveMessage: {
        header: { imageMessage: media.imageMessage, hasMediaAttachment: true },
        footer: { text: footerText },
        body: { text: '' },
        nativeFlowMessage: {
          messageParamsJson: JSON.stringify({ settings: { button_layout: 'horizontal' } }),
          buttons: [
            { name: "", buttonParamsJson: "" },
            { name: "single_select", buttonParamsJson: JSON.stringify({
              title: '📂', sections: [{ title: 'الأقسام', rows: categoryRows }], icon: 'REVIEW'
            })},
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "📜", id: `${m.prefix}rules` }) },
            { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "👑", url: `https://wa.me/${config.owner?.number?.[0] || "201142324733"}`, merchant_url: `https://wa.me/${config.owner?.number?.[0] || "201142324733"}` }) },
          ]
        }
      }
    };

    const msg = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: { message: { messageContextInfo: {}, interactiveMessage: content.interactiveMessage } }
    }, { quoted: qOrder, userJid: sock.user.jid });

    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

    // صوت الشكل 2
    const audioEnabled = db.setting("audioMenu") !== false;
    if (audioEnabled) {
      try {
        await sock.sendMessage(m.chat, { audio: fs.readFileSync(config.assets["maro-mp3"]), mimetype: "audio/mpeg" }, { quoted: qOrder });
      } catch (e) {}
    }

    return;
  }

  await m.reply("القائمة غير متوفرة");
}

export default { config: pluginConfig, handler };