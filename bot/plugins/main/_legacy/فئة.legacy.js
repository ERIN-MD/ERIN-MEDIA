import * as botmodePlugin from "../../group/وضع_البوت.js";
import { getCasesByCategory } from "../../../case/maro.js";
import { prepareWAMessageMedia, generateWAMessageFromContent } from "maro";
import config from "../../../config.js";
import axios from "axios";
import sharp from "sharp";
import {
  getCommandsByCategory,
  getCategories,
  getPlugin,
} from "../../../src/lib/maro-plugins.js";
import { getDatabase } from "../../../src/lib/maro-database.js";
import { getTimeGreeting } from "../../../src/lib/maro-formatter.js";
import fs from "fs"

const pluginConfig = {
  name: "فئة",
  alias: ["menucat"],
  category: "main",
  description: "عرض الأوامر في فئة معينة",
  usage: ".فئة <الفئة>",
  example: ".فئة tools",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

const CATEGORY_EMOJIS = {
  owner: "♛", main: "♞", utility: "۩", fun: "☜", group: "♢",
  download: "♬", search: "♪", tools: "✪", sticker: "♭", ai: "✦",
  game: "♡", media: "♧", info: "©", religi: "•", panel: "∆",
  user: "®", jpm: "♤", pushkontak: "♤", ephoto: "•", store: "£",
  linode: "☆", random: "☞", canvas: "§", vps: "∆", premium: "✪",
  convert: "✦", economy: "★", cek: "©"
};

function getCategoryEmoji(category) {
  return CATEGORY_EMOJIS[category] || "☞";
}

function toMathBold(text) {
  const bold = {
    "0": "𝟎","1": "𝟏","2": "𝟐","3": "𝟑","4": "𝟒","5": "𝟓","6": "𝟔","7": "𝟕","8": "𝟖","9": "𝟗",
    a: "𝗮",b: "𝗯",c: "𝗰",d: "𝗱",e: "𝗲",f: "𝗳",g: "𝗴",h: "𝗵",i: "𝗶",j: "𝗷",k: "𝗸",l: "𝗹",m: "𝗺",
    n: "𝗻",o: "𝗼",p: "𝗽",q: "𝗾",r: "𝗿",s: "𝘀",t: "𝘁",u: "𝘂",v: "𝘃",w: "𝘄",x: "𝘅",y: "𝘆",z: "𝘇",
    A: "𝗔",B: "𝗕",C: "𝗖",D: "𝗗",E: "𝗘",F: "𝗙",G: "𝗚",H: "𝗛",I: "𝗜",J: "𝗝",K: "𝗞",L: "𝗟",M: "𝗠",
    N: "𝗡",O: "𝗢",P: "𝗣",Q: "𝗤",R: "𝗥",S: "𝗦",T: "𝗧",U: "𝗨",V: "𝗩",W: "𝗪",X: "𝗫",Y: "𝗬",Z: "𝗭",
    "/": "/"
  };
  return text.split("").map((c) => bold[c] || c).join("");
}

function toSmallCaps(text) {
  const smallCaps = {
    a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ",
    i: "ɪ", j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ",
    q: "ǫ", r: "ʀ", s: "s", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x",
    y: "ʏ", z: "ᴢ",
  };
  return text.toLowerCase().split("").map((c) => smallCaps[c] || c).join("");
}

async function handler(m, { sock, db }) {
  const prefix = config.command?.prefix || ".";
  const args = m.args || [];
  const categoryArg = args[0]?.toLowerCase();
  const categories = getCategories();
  const commandsByCategory = getCommandsByCategory();
  const casesByCategory = getCasesByCategory();
  const botName = config.bot?.name || "Tarboo Bot-BOT";

  let imageBuffer = null;
  try { imageBuffer = fs.readFileSync(config.assets["maro"]); } catch (e) {}
  const thumbnail = await sharp(imageBuffer).resize(300, 170).toBuffer().catch(() => null);

  if (!categoryArg) {
    const groupData = m.isGroup ? db.getGroup(m.chat) || {} : {};
    const botMode = groupData.botMode || "md";

    let modeExcludeMap = {
      md: ["panel", "pushkontak", "store"],
      store: ["panel", "pushkontak", "jpm", "ephoto", "cpanel"],
      pushkontak: ["panel", "store", "jpm", "ephoto", "cpanel"],
      cpanel: ["pushkontak", "store", "jpm", "ephoto"],
    };

    try {
      if (botmodePlugin && botmodePlugin.MODES) {
        const modes = botmodePlugin.MODES;
        modeExcludeMap = {};
        for (const [key, val] of Object.entries(modes)) {
          if (val.excludeCategories) modeExcludeMap[key] = val.excludeCategories;
        }
      }
    } catch (e) { }

    const excludeCategories = modeExcludeMap[botMode] || modeExcludeMap.md;

    const categoryOrder = [
      "owner", "main", "utility", "tools", "fun", "game", "download",
      "search", "sticker", "media", "ai", "group", "religi", "info",
      "cek", "economy", "user", "canvas", "random", "premium",
      "jpm", "pushkontak", "panel", "ephoto", "store"
    ];

    const allCats = [...new Set([...categories, ...Object.keys(casesByCategory)])];

    const sortedCats = allCats.sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    const visibleCats = sortedCats.filter((cat) => {
      if (cat === "owner" && !m.isOwner) return false;
      if (excludeCategories.includes(cat.toLowerCase())) return false;
      const total = (commandsByCategory[cat] || []).length + (casesByCategory[cat] || []).length;
      return total > 0;
    });

    let categoryRows = [];
    for (const cat of visibleCats) {
      const emoji = getCategoryEmoji(cat);
      categoryRows.push({
        title: `${emoji} ${cat.toUpperCase()}`,
        id: `${prefix}فئة ${cat}`,
        description: `°⃟𑁁⚡ عرض أوامر ${cat}`
      });
    }

    let txt = `*╭━━━${toMathBold('𝐌𝐀𝐑𝐎/𝐁𝐎𝐓')}━━━━°⃟𑁁*\n`;

    for (const cat of visibleCats) {
      const pluginCmds = commandsByCategory[cat] || [];
      const caseCmds = casesByCategory[cat] || [];
      const allCmds = [...pluginCmds, ...caseCmds];
      if (allCmds.length === 0) continue;

      const emoji = getCategoryEmoji(cat);
      txt += `◈ *${cat.toUpperCase()}* ${emoji} ◈\n`;
      allCmds.forEach(cmd => {
        txt += `> °⃟𑁁⚡ ${prefix}${cmd}\n`;
      });
      txt += `\n`;
    }

    txt += `*╭━━━━━━━━━━━━°⃟𑁁⚡*\n`;
    txt += `*〔 مــرحبا بيك في ${botName} 〕*\n`;
    txt += `*╰━━━━━━━━━━━━°⃟𑁁⚡*\n`;
    txt += `${toSmallCaps('_اختر فئة من الزر أدناه_')}`;

    const content = {
      buttonsMessage: {
        buttons: [
          {
            buttonText: { displayText: '°⃟𑁁⚡ اختر فئة' },
            buttonId: 'menu',
            type: 1,
            nativeFlowInfo: {
              name: 'single_select',
              paramsJson: JSON.stringify({
                title: '°⃟𑁁⚡ كل فئات البوت',
                sections: [{ title: 'اختر القسم', rows: categoryRows }],
              }),
            },
          },
        ],
        locationMessage: {
          jpegThumbnail: thumbnail,
          name: botName,
          address: `Tarboo Bot 𝑶𝒏𝒍𝒊𝒏𝒆`,
          url: "https://ẉ.Tarboo Bot",
          isLive: true
        },
        contextInfo: {
          externalAdReply: {
            title: botName,
            body: `Tarboo Bot 𝑶𝒏𝒍𝒊𝒏𝒆`,
            thumbnail: thumbnail,
            mediaType: 1,
            sourceUrl: "https://mabrokgmal.netlify.app",
            renderLargerThumbnail: true,
            showAdAttribution: true
          }
        },
        contentText: txt,
        footerText: `${botName} - https://ẉ.Tarboo Bot`,
        headerType: 6,
      },
    };

    const msg = generateWAMessageFromContent(m.chat, content, { userJid: sock.user.jid });
    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    return;
  }

  // عرض فئة محددة
  const allCategories = [...new Set([...categories, ...Object.keys(casesByCategory)])];
  const matchedCat = allCategories.find((c) => c.toLowerCase() === categoryArg);

  if (!matchedCat) {
    return m.reply(`°⃟𑁁⚡ الفئة غير موجودة`);
  }

  if (matchedCat === "owner" && !m.isOwner) {
    return m.reply(`°⃟𑁁⚡ لا يمكنك الوصول لهذه الفئة`);
  }

  const pluginCommands = commandsByCategory[matchedCat] || [];
  const caseCommands = casesByCategory[matchedCat] || [];
  const allCommands = [...pluginCommands, ...caseCommands];

  if (allCommands.length === 0) {
    return m.reply(`°⃟𑁁⚡ الفئة فارغة`);
  }

  const emoji = getCategoryEmoji(matchedCat);

  let txt = `*╭━━${toMathBold(matchedCat.toUpperCase())}━━━━°⃟𑁁⚡*\n`;

  allCommands.forEach(cmd => {
    txt += `> °⃟𑁁⚡ ${prefix}${cmd}\n`;
  });

  txt += `\n*╭━━━━━━━━━━━°⃟𑁁⚡*\n`;
  txt += `*〔 مــرحبا بيك في ${botName} 〕*\n`;
  txt += `*╰━━━━━━━━━━━°⃟𑁁⚡*`;

  const content = {
    buttonsMessage: {
      buttons: [
        {
          buttonId: `${prefix}menu`,
          buttonText: { displayText: '°⃟𑁁⚡ رجوع' },
          type: 1,
        },
      ],
      locationMessage: {
        jpegThumbnail: thumbnail,
        name: `${emoji} ${matchedCat}`,
        address: `Tarboo Bot 𝑶𝒏𝒍𝒊𝒏𝒆`,
        url: "https://ẉ.Tarboo Bot",
        isLive: true
      },
      contextInfo: {
        externalAdReply: {
          title: `${emoji} ${matchedCat}`,
          body: `Tarboo Bot 𝑶𝒏𝒍𝒊𝒏𝒆 https://ẉ.Tarboo Bot`,
          thumbnail: thumbnail,
          mediaType: 1,
          sourceUrl: "https://mabrokgmal.netlify.app",
          renderLargerThumbnail: true,
          showAdAttribution: true
        }
      },
      contentText: txt,
      footerText: `${botName} - https://mabrokgmal.netlify.app`,
      headerType: 6,
    },
  };

  const msg = generateWAMessageFromContent(m.chat, content, { userJid: sock.user.jid });
  await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}

export { pluginConfig as config, handler };