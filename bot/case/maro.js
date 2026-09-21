// ═══════════════════════════════════════════════
// 📁 case/maro.js
// 🖤 Tarboo Bot Case System - نظام الأوامر السريعة
// ═══════════════════════════════════════════════

import { performance } from "perf_hooks";
import { getDatabase } from "../src/lib/maro-database.js";
import {
  getAllPlugins,
  getCommandsByCategory,
  getCategories,
  pluginStore,
} from "../src/lib/maro-plugins.js";
import config from "../config.js";

function toSmallCaps(text) {
  const smallCapsMap = {
    a: "ᴀ",
    b: "ʙ",
    c: "ᴄ",
    d: "ᴅ",
    e: "ᴇ",
    f: "ꜰ",
    g: "ɢ",
    h: "ʜ",
    i: "ɪ",
    j: "ᴊ",
    k: "ᴋ",
    l: "ʟ",
    m: "ᴍ",
    n: "ɴ",
    o: "ᴏ",
    p: "ᴘ",
    q: "ǫ",
    r: "ʀ",
    s: "s",
    t: "ᴛ",
    u: "ᴜ",
    v: "ᴠ",
    w: "ᴡ",
    x: "x",
    y: "ʏ",
    z: "ᴢ",
  };
  return text
    .toLowerCase()
    .split("")
    .map((c) => smallCapsMap[c] || c)
    .join("");
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const CATEGORY_EMOJIS = {
  owner: "👑",
  main: "🏠",
  utility: "🔧",
  fun: "🎮",
  group: "👥",
  download: "📥",
  search: "🔍",
  tools: "🛠️",
  sticker: "🖼️",
  ai: "🤖",
  game: "🎯",
  media: "🎬",
  info: "ℹ️",
  religi: "☪️",
  panel: "🖥️",
  user: "📊",
  linode: "☁️",
  random: "🎲",
  canvas: "🎨",
  vps: "🌊",
  store: "🏪",
  premium: "💎",
  convert: "🔄",
  economy: "💰",
};

async function handleCommand(m, sock) {
  try {
    if (!m.isCommand) return { handled: false };

    const command = m.command?.toLowerCase();
    if (!command) return { handled: false };

    const db = getDatabase();

    switch (command) {
      // ═══════════════════════════════════════════
      // 🏠 الفئة: معلومات
      // ═══════════════════════════════════════════
      case "cping":
      case "سرعة":
      case "بينج":
      case "cspeed":
      case "clatency": {
        try {
          if (config.features?.autoTyping) {
            await sock.sendPresenceUpdate("composing", m.chat);
          }

          const start = performance.now();
          await m.react("🕕");

          const msgTimestamp = m.messageTimestamp
            ? m.messageTimestamp * 1000
            : Date.now();
          const latency = Math.max(1, Date.now() - msgTimestamp);

          const processTime = (performance.now() - start).toFixed(2);

          let pingStatus = "🟢 ممتاز";
          if (latency > 100 && latency <= 300) pingStatus = "🟡 جيد";
          else if (latency > 300) pingStatus = "🔴 سيء";

          const text =
            `⚡ *سرعة النظام*\n\n` +
            `╭┈┈⬡「 📊 *الحالة* 」\n` +
            `┃ ◦ السرعة: *${latency}ms*\n` +
            `┃ ◦ المعالجة: *${processTime}ms*\n` +
            `┃ ◦ التقييم: ${pingStatus}\n` +
            `╰┈┈⬡`;

          await m.reply(text);
          await m.react("✅");

          if (config.features?.autoTyping) {
            await sock.sendPresenceUpdate("paused", m.chat);
          }
        } catch (error) {
          console.error("[CPing] Error:", error);
          await m.react("❌");
          await m.reply(`❌ *فشل*\n\n> ${error.message}`);
        }
        return { handled: true };
      }

      case "lcase":
      case "caselist":
      case "allcase":
      case "listallcase":
      case "الكايسات":
      case "الحالات": {
        try {
          if (config.features?.autoTyping) {
            await sock.sendPresenceUpdate("composing", m.chat);
          }

          await m.react("🔍");

          const casesByCategory = {
            info: ["cping", "listallcase", "listallplugin"],
          };

          const caseAliases = {
            cping: ["سرعة", "بينج", "cspeed", "clatency"],
            listallcase: ["الكايسات", "الحالات", "lcase", "caselist", "allcase"],
            listallplugin: ["البلوجنات", "الاضافات", "lplugin", "pluginlist", "allplugin"],
          };

          let totalCases = 0;
          for (const cat in casesByCategory) {
            totalCases += casesByCategory[cat].length;
          }

          let text = `╔══════════════════╗\n`;
          text += `   📦 *${toSmallCaps("قائمة الكايسات")}*\n`;
          text += `╚══════════════════╝\n\n`;
          text += `╭┈┈⬡「 📊 *معلومات* 」\n`;
          text += `┃ ◦ المجموع: *${totalCases}* كايس\n`;
          text += `┃ ◦ الفئات: *${Object.keys(casesByCategory).length}*\n`;
          text += `╰┈┈⬡\n\n`;

          for (const category in casesByCategory) {
            const commands = casesByCategory[category];
            const emoji = CATEGORY_EMOJIS[category] || "📌";
            const categoryName = toSmallCaps(category);

            text += `╭┈┈⬡「 ${emoji} *${categoryName}* 」\n`;
            commands.forEach((cmd, i) => {
              const prefix = m.prefix || ".";
              const aliases = caseAliases[cmd]
                ? ` (${caseAliases[cmd].slice(0, 2).join(", ")})`
                : "";
              text += `┃ ${i + 1}. ${prefix}${cmd}${aliases}\n`;
            });
            text += `╰┈┈⬡\n\n`;
          }

          text += `*━━━━━━━━━━━━━━━*\n`;
          text += `💡 *نصيحة:* استخدم \`.listallplugin\` لعرض البلوجنات`;

          await sock.sendMessage(
            m.chat,
            {
              text,
              contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                  newsletterJid: config.saluran?.id,
                  newsletterName: config.saluran?.name || config.bot?.name || "Tarboo Bot",
                  serverMessageId: 127,
                },
              },
            },
            { quoted: m },
          );

          await m.react("✅");

          if (config.features?.autoTyping) {
            await sock.sendPresenceUpdate("paused", m.chat);
          }
        } catch (error) {
          console.error("[ListAllCase] Error:", error);
          await m.react("❌");
          await m.reply(`❌ *فشل*\n\n> ${error.message}`);
        }
        return { handled: true };
      }

      case "lplugin":
      case "pluginlist":
      case "allplugin":
      case "listallplugin":
      case "البلوجنات":
      case "الاضافات": {
        try {
          if (config.features?.autoTyping) {
            await sock.sendPresenceUpdate("composing", m.chat);
          }

          await m.react("🔍");

          const categories = getCategories();
          const commandsByCategory = getCommandsByCategory();

          let totalPlugins = 0;
          for (const category of categories) {
            totalPlugins += (commandsByCategory[category] || []).length;
          }

          if (totalPlugins === 0) {
            await m.reply("⚠️ *لا توجد بلوجنات محملة*");
            return { handled: true };
          }

          let text = `╔══════════════════╗\n`;
          text += `   🔌 *${toSmallCaps("قائمة البلوجنات")}*\n`;
          text += `╚══════════════════╝\n\n`;
          text += `╭┈┈⬡「 📊 *معلومات* 」\n`;
          text += `┃ ◦ المجموع: *${totalPlugins}* بلوجن\n`;
          text += `┃ ◦ الفئات: *${categories.length}*\n`;
          text += `╰┈┈⬡\n\n`;

          for (const category of categories.sort()) {
            const commands = commandsByCategory[category] || [];
            if (commands.length === 0) continue;

            const emoji = CATEGORY_EMOJIS[category] || "📌";
            const categoryName = toSmallCaps(category);

            text += `╭┈┈⬡「 ${emoji} *${categoryName}* 」\n`;

            commands.sort().forEach((cmd, i) => {
              const plugin = pluginStore.commands.get(cmd);
              if (plugin && plugin.config) {
                const prefix = m.prefix || ".";
                const aliases = plugin.config.alias
                  ? ` (${plugin.config.alias.slice(0, 2).join(", ")})`
                  : "";
                text += `┃ ${i + 1}. ${prefix}${cmd}${aliases}\n`;
              }
            });

            text += `╰┈┈⬡\n\n`;
          }

          text += `*━━━━━━━━━━━━━━━*\n`;
          text += `💡 *نصيحة:* استخدم \`.listallcase\` لعرض الكايسات`;

          await sock.sendMessage(
            m.chat,
            {
              text,
              contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                  newsletterJid: config.saluran?.id,
                  newsletterName: config.saluran?.name || config.bot?.name || "Tarboo Bot",
                  serverMessageId: 127,
                },
              },
            },
            { quoted: m },
          );

          await m.react("✅");

          if (config.features?.autoTyping) {
            await sock.sendPresenceUpdate("paused", m.chat);
          }
        } catch (error) {
          console.error("[ListAllPlugin] Error:", error);
          await m.react("❌");
          await m.reply(`❌ *فشل*\n\n> ${error.message}`);
        }
        return { handled: true };
      }

      default:
        return { handled: false };
    }
  } catch (error) {
    console.error("[CaseHandler] Error:", error);
    try {
      await m.reply(`❌ *خطأ*\n\n> ${error.message}`);
    } catch {}
    return { handled: true, error: error.message };
  }
}

function getCaseCommands() {
  return {
    info: ["cping", "listallcase", "listallplugin"],
  };
}

function getCaseCount() {
  const cases = getCaseCommands();
  let total = 0;
  for (const category in cases) {
    total += cases[category].length;
  }
  return total;
}

function getCaseCategories() {
  return Object.keys(getCaseCommands());
}

function getCasesByCategory() {
  return getCaseCommands();
}

export {
  handleCommand,
  getCaseCommands,
  getCaseCount,
  getCaseCategories,
  getCasesByCategory,
};
