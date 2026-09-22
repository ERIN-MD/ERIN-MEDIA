import config, { getOwnerName } from "../../config.js";
import { getDatabase } from "../../src/lib/maro-database.js";
import {
  addJadibotOwner,
  removeJadibotOwner,
  getJadibotOwners,
} from "../../src/lib/maro-jadibot-database.js";
import fs from "fs";
import path from "path";
import {
  isLid,
  lidToJid,
  resolveAnyLidToJid,
  isLidConverted,
} from "../../src/lib/maro-lid.js";
import { getGroupMode } from "../group/وضع_البوت.js";

const pluginConfig = {
  name: "اضف_مالك",
  alias: ["addowner"],
  category: "owner",
  description: "إدارة مالك البوت (حسب الوضع)",
  usage: ".اضف_مالك <رقم/@منشن/رد>",
  example: ".اضف_مالك 6281234567890",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

function cleanJid(jid) {
  if (!jid) return null;
  if (isLid(jid)) jid = lidToJid(jid);
  return jid.includes("@") ? jid : jid + "@s.whatsapp.net";
}

function extractNumber(m) {
  let targetNumber = "";

  if (m.quoted) {
    let sender = m.quoted.sender || "";
    if (isLid(sender) || isLidConverted(sender)) {
      sender = resolveAnyLidToJid(sender, m.groupMembers || []);
    }
    targetNumber = sender?.replace(/[^0-9]/g, "") || "";
  } else if (m.mentionedJid?.length) {
    let jid = cleanJid(m.mentionedJid[0]);
    if (isLid(jid) || isLidConverted(jid)) {
      jid = resolveAnyLidToJid(jid, m.groupMembers || []);
    }
    targetNumber = jid?.replace(/[^0-9]/g, "") || "";
  } else if (m.args[0]) {
    targetNumber = m.args[0].replace(/[^0-9]/g, "");
    if (targetNumber.startsWith("08")) {
      targetNumber = "62" + targetNumber.slice(1);
    }
  }

  if (targetNumber.startsWith("0")) {
    targetNumber = "62" + targetNumber.slice(1);
  }

  if (targetNumber.length > 15) {
    return "";
  }

  return targetNumber;
}

function savePanelConfig() {
  try {
    const configPath = path.join(process.cwd(), "config.js");
    let content = fs.readFileSync(configPath, "utf8");

    const ownerPanelsStr = JSON.stringify(config.pterodactyl.ownerPanels || []);
    content = content.replace(
      /ownerPanels:\s*\[.*?\]/s,
      `ownerPanels: ${ownerPanelsStr}`,
    );

    const sellersStr = JSON.stringify(config.pterodactyl.sellers || []);
    content = content.replace(/sellers:\s*\[.*?\]/s, `sellers: ${sellersStr}`);

    fs.writeFileSync(configPath, content, "utf8");
    return true;
  } catch (e) {
    console.error("[اضف_مالك] فشل في حفظ إعدادات اللوحة:", e.message);
    return false;
  }
}

function removeFromSellers(targetNumber) {
  if (!config.pterodactyl.sellers) return false;
  const idx = config.pterodactyl.sellers.findIndex(
    (s) => String(s).trim() === String(targetNumber).trim(),
  );
  if (idx !== -1) {
    config.pterodactyl.sellers.splice(idx, 1);
    return true;
  }
  return false;
}

function removeFromOwnerPanels(targetNumber) {
  if (!config.pterodactyl.ownerPanels) return false;
  const idx = config.pterodactyl.ownerPanels.findIndex(
    (s) => String(s).trim() === String(targetNumber).trim(),
  );
  if (idx !== -1) {
    config.pterodactyl.ownerPanels.splice(idx, 1);
    return true;
  }
  return false;
}

function toMentionJid(value) {
  const number = String(value || "").replace(/[^0-9]/g, "");
  return number ? `${number}@s.whatsapp.net` : null;
}

async function handler(m, { sock, jadibotId, isJadibot }) {
  const db = getDatabase();
  const cmd = m.command.toLowerCase();
  const groupMode = m.isGroup ? getGroupMode(m.chat, db) : "private";
  const isCpanelMode = m.isGroup && groupMode === "cpanel";

  const isAdd = ["اضف_مالك", "addowner"].includes(cmd);
  const isDel = ["delowner", "dedown"].includes(cmd);
  const isList = ["ownerlist", "listowner"].includes(cmd);

  if (!config.pterodactyl) config.pterodactyl = {};
  if (!config.pterodactyl.ownerPanels) config.pterodactyl.ownerPanels = [];
  if (!config.pterodactyl.sellers) config.pterodactyl.sellers = [];
  if (!db.data.owner) db.data.owner = [];

  if (isList) {
    if (isJadibot && jadibotId) {
      const jbOwners = getJadibotOwners(jadibotId);
      if (jbOwners.length === 0) {
        return m.reply(
          `📋 *قائمة مالك البوت الفرعي*\n\n> لا يوجد مالك مسجل بعد.\n> استخدم \`${m.prefix}اضف_مالك\` للإضافة.`,
        );
      }
      let txt = `📋 *قائمة مالك البوت الفرعي* — ${jadibotId}\n\n`;
      const mentions = jbOwners.map(toMentionJid).filter(Boolean);
      jbOwners.forEach((s, i) => {
        const number = String(s || "").replace(/[^0-9]/g, "");
        const name = getOwnerName(number);
        txt += `${i + 1}. 👑 @${number}${name !== "Owner" ? ` — *${name}*` : ""}\n`;
      });
      txt += `\nالمجموع: *${jbOwners.length}* مالك`;
      return m.reply(txt, { mentions });
    } else if (isCpanelMode) {
      const panelOwners = config.pterodactyl.ownerPanels || [];
      const fullOwners = db.data.owner || [];
      const allOwners = [...new Set([...panelOwners, ...fullOwners])];

      if (allOwners.length === 0) {
        return m.reply(
          `📋 *قائمة مالك اللوحة*\n\n> لا يوجد مالك لوحة مسجل بعد.`,
        );
      }
      let txt = `📋 *قائمة مالك اللوحة*\n\n`;
      const mentions = allOwners.map(toMentionJid).filter(Boolean);
      allOwners.forEach((s, i) => {
        const label =
          panelOwners.includes(s) && fullOwners.includes(s)
            ? "👑🖥️"
            : fullOwners.includes(s)
              ? "👑"
              : "🖥️";
        const number = String(s || "").replace(/[^0-9]/g, "");
        const name = getOwnerName(number);
        txt += `${i + 1}. ${label} @${number}${name !== "Owner" ? ` — *${name}*` : ""}\n`;
      });
      txt += `\nالمجموع: *${allOwners.length}* مالك | 👑 كامل, 🖥️ لوحة`;
      return m.reply(txt, { mentions });
    } else {
      const configOwners = (config.owner?.number || []).map(String);
      const dbOwners = db.data.owner || [];
      const allOwners = [...new Set([...configOwners, ...dbOwners])];

      if (allOwners.length === 0) {
        return m.reply(`📋 *قائمة المالك*\n\n> لا يوجد مالك مسجل بعد.`);
      }
      let txt = `📋 *قائمة المالك*\n\n`;
      const mentions = allOwners.map(toMentionJid).filter(Boolean);
      allOwners.forEach((s, i) => {
        const number = String(s || "").replace(/[^0-9]/g, "");
        const isMain = configOwners.some(
          (o) => o.replace(/[^0-9]/g, "") === number,
        );
        const isDb = dbOwners.some(
          (o) => String(o).replace(/[^0-9]/g, "") === number,
        );
        const label = isMain && isDb ? "👑⭐" : isMain ? "⭐" : "👑";
        const name = getOwnerName(number);
        txt += `${i + 1}. ${label} @${number}${name !== "Owner" ? ` — *${name}*` : ""}\n`;
      });
      txt += `\nالمجموع: *${allOwners.length}* مالك | ⭐ رئيسي, 👑 مضاف`;
      return m.reply(txt, { mentions });
    }
  }

  const targetNumber = await extractNumber(m);
  const numberFromArgs = !m.quoted && !m.mentionedJid?.length && m.args[0];
  const customName = isAdd
    ? (numberFromArgs ? m.args.slice(1) : m.args).join(" ").trim()
    : "";

  if (!targetNumber) {
    return m.reply(
      `👑 *${isAdd ? "إضافة" : "حذف"} مالك*\n\n` +
        `رد/منشن/اكتب رقم المستخدم\n` +
        `\`مثال: ${m.prefix}اضف_مالك 6281234567890\`\n` +
        `\`مع اسم: ${m.prefix}اضف_مالك 6281234567890 اسم_المالك\``,
    );
  }

  if (targetNumber.length < 10 || targetNumber.length > 15) {
    return m.reply(`❌ *فشل*\n\n> صيغة الرقم غير صالحة`);
  }

  if (isJadibot && jadibotId) {
    if (isAdd) {
      if (addJadibotOwner(jadibotId, targetNumber)) {
        await m.react("👑");
        return m.reply(
          `✅ تمت إضافة *${targetNumber}* كمالك للبوت الفرعي بنجاح`,
        );
      } else {
        return m.reply(
          `❌ \`${targetNumber}\` مالك لهذا البوت الفرعي بالفعل.`,
        );
      }
    } else if (isDel) {
      if (removeJadibotOwner(jadibotId, targetNumber)) {
        await m.react("✅");
        return m.reply(
          `✅ تم حذف *${targetNumber}* من مالك البوت الفرعي بنجاح`,
        );
      } else {
        return m.reply(`❌ \`${targetNumber}\` ليس مالكاً لهذا البوت الفرعي.`);
      }
    }
    return;
  }

  if (isCpanelMode) {
    if (isAdd) {
      if (config.pterodactyl.ownerPanels.includes(targetNumber)) {
        return m.reply(`❌ \`${targetNumber}\` مالك لوحة بالفعل.`);
      }

      let roleChanged = "";
      if (removeFromSellers(targetNumber)) {
        roleChanged = `\n> ⚡ ترقية تلقائية من بائع إلى مالك لوحة`;
      }

      config.pterodactyl.ownerPanels.push(targetNumber);
      if (savePanelConfig()) {
        await m.react("👑");
        return m.reply(
          `✅ تمت إضافة *${targetNumber}* كمالك لوحة بنجاح${roleChanged}`,
        );
      } else {
        config.pterodactyl.ownerPanels = config.pterodactyl.ownerPanels.filter(
          (s) => s !== targetNumber,
        );
        return m.reply(`❌ فشل في الحفظ إلى config.js`);
      }
    } else if (isDel) {
      const ownerList = config.pterodactyl.ownerPanels || [];
      const found = ownerList.find(
        (o) => String(o).trim() === String(targetNumber).trim(),
      );
      if (!found) {
        return m.reply(
          `❌ \`${targetNumber}\` ليس مالك لوحة.\n\n> القائمة الحالية: ${ownerList.join(", ") || "فارغة"}`,
        );
      }
      config.pterodactyl.ownerPanels = ownerList.filter(
        (s) => String(s).trim() !== String(targetNumber).trim(),
      );
      if (savePanelConfig()) {
        await m.react("✅");
        return m.reply(
          `✅ تم حذف *${targetNumber}* من مالك اللوحة بنجاح`,
        );
      } else {
        return m.reply(`❌ فشل في الحفظ إلى config.js`);
      }
    }
  } else {
    if (isAdd) {
      if (db.data.owner.includes(targetNumber)) {
        return m.reply(`❌ \`${targetNumber}\` مالك كامل بالفعل.`);
      }

      let roleChanged = "";
      if (removeFromSellers(targetNumber)) {
        roleChanged = `\n> ⚡ ترقية تلقائية من بائع`;
        savePanelConfig();
      }
      if (removeFromOwnerPanels(targetNumber)) {
        roleChanged = `\n> ⚡ ترقية تلقائية من مالك لوحة`;
        savePanelConfig();
      }

      db.data.owner.push(targetNumber);
      if (customName) {
        const nameMap = db.setting("ownerNames") || {};
        nameMap[targetNumber] = customName;
        db.setting("ownerNames", nameMap);
      }
      db.save();

      const displayName = customName || getOwnerName(targetNumber);
      await m.react("👑");
      return m.reply(
        `✅ تمت إضافة *${targetNumber}* كمالك كامل بنجاح${customName ? ` (${customName})` : ""}${roleChanged}`,
      );
    } else if (isDel) {
      const index = db.data.owner.indexOf(targetNumber);
      if (index === -1) {
        return m.reply(`❌ \`${targetNumber}\` ليس مالكاً كاملاً.`);
      }

      db.data.owner.splice(index, 1);
      const nameMap = db.setting("ownerNames") || {};
      delete nameMap[targetNumber];
      db.setting("ownerNames", nameMap);
      db.save();

      await m.react("✅");
      return m.reply(`✅ تم حذف *${targetNumber}* من المالك الكامل بنجاح`);
    }
  }
}

export {
  pluginConfig as config,
  handler,
  removeFromSellers,
  removeFromOwnerPanels,
};