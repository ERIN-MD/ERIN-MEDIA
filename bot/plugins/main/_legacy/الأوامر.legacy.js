import * as botmodePlugin from "../../group/وضع_البوت.js";
import { getCasesByCategory, getCaseCount } from "../../../case/maro.js";
import config from "../../../config.js";
import fs from "fs"
import {
  getCommandsByCategory,
  getCategories,
} from "../../../src/lib/maro-plugins.js";
import { getDatabase } from "../../../src/lib/maro-database.js";

const pluginConfig = {
  name: "الأوامر",
  alias: ["allmenu"],
  category: "main",
  description: "عرض جميع الأوامر الكاملة حسب الفئة",
  usage: ".الأوامر",
  example: ".الأوامر",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 5, energi: 0, isEnabled: true,
};

const CATEGORY_EMOJIS = {
  owner: "👑", main: "🏠", utility: "🔧", fun: "🎮", group: "👥",
  download: "📥", search: "🔍", tools: "🛠️", sticker: "🖼️", ai: "🤖",
  game: "🎯", media: "🎬", info: "ℹ️", religi: "☪️", panel: "🖥️",
  user: "📊", random: "🎲", canvas: "🎨", premium: "💎",
  convert: "🔄", economy: "💰", cek: "📋",
};

const THEMES = {
  1: { emoji: "🍒", name: "أحمر" },
  2: { emoji: "🍊", name: "برتقالي" },
  3: { emoji: "🍋", name: "أصفر" },
  4: { emoji: "🍀", name: "أزرق" },
  5: { emoji: "🍇", name: "بنفسجي" },
  6: { emoji: "🌸", name: "وردي" },
  7: { emoji: "💎", name: "سماوي" },
};

async function handler(m, { sock, db }) {
  const prefix = config.command?.prefix || ".";
  const groupData = m.isGroup ? db.getGroup(m.chat) || {} : {};
  const botMode = groupData.botMode || "md";
  const categories = getCategories();
  const commandsByCategory = getCommandsByCategory();
  const casesByCategory = getCasesByCategory();
  let totalCommands = 0;
  for (const category of categories) {
    totalCommands += (commandsByCategory[category] || []).length;
  }
  const totalCases = getCaseCount();
  const totalFeatures = totalCommands + totalCases;
  const botName = config.bot?.name || "Maro-AI";
  const botVersion = config.bot?.version || "1.2.0";
  const ownerName = config.owner?.name || "Maro";

  const savedVariant = db.setting("allmenuVariant");
  const allmenuVariant = savedVariant || config.ui?.allmenuVariant || 2;
  const theme = THEMES[allmenuVariant] || THEMES[2];

  const categoryOrder = [
    "owner", "main", "utility", "tools", "fun", "game", "download",
    "search", "sticker", "media", "ai", "group", "religi", "info",
    "cek", "economy", "user", "canvas", "random", "premium"
  ];

  const sortedCategories = [...categories].sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  let modeAllowedMap = { md: null, cpanel: ["main", "group", "sticker", "owner", "tools", "panel"], store: ["main", "group", "sticker", "owner", "store"], pushkontak: ["main", "group", "sticker", "owner", "pushkontak"] };
  let modeExcludeMap = { md: ["panel", "pushkontak", "store"], cpanel: null, store: null, pushkontak: null };

  try {
    if (botmodePlugin && botmodePlugin.MODES) {
      const modes = botmodePlugin.MODES;
      modeAllowedMap = {}; modeExcludeMap = {};
      for (const [key, val] of Object.entries(modes)) {
        modeAllowedMap[key] = val.allowedCategories;
        modeExcludeMap[key] = val.excludeCategories;
      }
    }
  } catch (e) { }

  const allowedCategories = modeAllowedMap[botMode];
  const excludeCategories = modeExcludeMap[botMode] || [];

  const categoryRows = [];

  for (const category of sortedCategories) {
    if (category === "owner" && !m.isOwner) continue;
    if (allowedCategories && !allowedCategories.includes(category.toLowerCase())) continue;
    if (excludeCategories && excludeCategories.includes(category.toLowerCase())) continue;

    const pluginCmds = commandsByCategory[category] || [];
    const caseCmds = casesByCategory[category] || [];
    const allCmds = [...pluginCmds, ...caseCmds];
    if (allCmds.length === 0) continue;

    const emoji = CATEGORY_EMOJIS[category] || "📋";
    
    categoryRows.push({
      title: `${emoji} ${category}`,
      description: `(${allCmds.length}) Commands`,
      id: `${prefix}menucat ${category}`,
    });
  }

  const txt = `*📋 ${botName}*\n⚡ v${botVersion} | 👑 ${ownerName}\n📂 ${totalFeatures} Commands | 🎨 ${theme.name}\n\n_اختر فئة من زر القائمة أدناه_`;

  const img = fs.readFileSync(config.assets["maro"]);
  const { ButtonV2 } = await import('/home/container/src/lib/maro-builder.js');
  
  const msg = await new ButtonV2(sock)
    .setTitle(`📋 ${botName}`)
    .setSubtitle(`⚡ v${botVersion} | 👑 ${ownerName}`)
    .setBody(txt)
    .setFooter(`📋 ${totalFeatures} Commands | 🎨 ${theme.name}`)
    .setThumbnail(img)
    .addRawButton({
      buttonText: { displayText: '📂 Menu' },
      buttonId: 'menu',
      type: 1,
      nativeFlowInfo: {
        name: 'single_select',
        paramsJson: JSON.stringify({
          title: '📂 Categories',
          sections: [{ title: 'Select Category', rows: categoryRows }],
        }),
      },
    })
    .addButton('👑 Owner', `${prefix}owner`)
    .build(m.chat);

  await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
  await m.react(theme.emoji);
}

export { pluginConfig as config, handler };