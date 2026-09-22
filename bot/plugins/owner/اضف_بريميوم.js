import config from "../../config.js";
import { getDatabase } from "../../src/lib/maro-database.js";
import {
  addJadibotPremium,
  removeJadibotPremium,
  getJadibotPremiums,
} from "../../src/lib/maro-jadibot-database.js";

const pluginConfig = {
  name: "اضف_بريميوم",
  alias: ["addprem"],
  category: "owner",
  description: "إدارة مستخدمي البريميوم",
  usage:
    ".اضف_بريميوم <رقم/@منشن> [يوم]\n.حذف_بريميوم <رقم/@منشن>\n.قائمة_البريميوم\n.فحص_بريميوم <رقم/@منشن>",
  example: ".اضف_بريميوم 6281234567890 30",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

function formatDate(ts) {
  return new Date(ts).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function extractTarget(m) {
  if (m.quoted) return m.quoted.sender?.replace(/[^0-9]/g, "") || "";
  if (m.mentionedJid?.length)
    return m.mentionedJid[0]?.replace(/[^0-9]/g, "") || "";
  if (m.args?.length) return m.args[0].replace(/[^0-9]/g, "");
  return "";
}

function toMentionJid(value) {
  const number = String(value || "").replace(/[^0-9]/g, "");
  return number ? `${number}@s.whatsapp.net` : null;
}

async function handler(m, { sock, jadibotId, isJadibot }) {
  const db = getDatabase();
  const cmd = m.command.toLowerCase();

  const isAdd = ["اضف_بريميوم", "addprem", "addpremium", "setprem"].includes(cmd);
  const isDel = ["delprem", "delpremium"].includes(cmd);
  const isList = ["listprem", "premlist"].includes(cmd);

  if (!db.data.premium) db.data.premium = [];

  if (isList) {
    if (isJadibot && jadibotId) {
      const jbPremiums = getJadibotPremiums(jadibotId);
      if (jbPremiums.length === 0) {
        return m.reply(
          `💎 لا يوجد بريميوم في هذا البوت الفرعي\nاستخدم \`${m.prefix}اضف_بريميوم\` للإضافة`,
        );
      }
      let txt = `💎 *قائمة بريميوم البوت الفرعي* — ${jadibotId}\n\n`;
      const mentions = jbPremiums
        .map((p) => (typeof p === "string" ? p : p.jid))
        .map(toMentionJid)
        .filter(Boolean);
      jbPremiums.forEach((p, i) => {
        const num = typeof p === "string" ? p : p.jid;
        const number = String(num || "").replace(/[^0-9]/g, "");
        txt += `${i + 1}. @${number}\n`;
      });
      txt += `\nالمجموع: *${jbPremiums.length}* بريميوم`;
      return m.reply(txt, { mentions });
    }

    if (db.data.premium.length === 0) {
      return m.reply(`💎 لا يوجد بريميوم مسجل بعد`);
    }
    let txt = `💎 *قائمة البريميوم*\n\n`;
    const now = Date.now();
    const mentions = db.data.premium
      .map((p) => (typeof p === "string" ? p : p.id))
      .map(toMentionJid)
      .filter(Boolean);
    db.data.premium.forEach((p, i) => {
      const num = typeof p === "string" ? p : p.id;
      const remaining =
        typeof p === "object" && p.expired
          ? Math.ceil((p.expired - now) / (1000 * 60 * 60 * 24))
          : null;
      const status =
        remaining === null
          ? "دائم"
          : remaining > 0
            ? remaining + " يوم"
            : "منتهي";
      const number = String(num || "").replace(/[^0-9]/g, "");
      txt += `${i + 1}. @${number} — ${status}\n`;
    });
    txt += `\nالمجموع: *${db.data.premium.length}* بريميوم`;
    return m.reply(txt, { mentions });
  }

  let targetNumber = await extractTarget(m);

  if (!targetNumber) {
    return m.reply(
      `💎 *${isAdd ? "إضافة" : "حذف"} بريميوم*\n\nأدخل رقم أو منشن المستخدم\n\`مثال: ${m.prefix}اضف_بريميوم 6281234567890\``,
    );
  }

  if (targetNumber.startsWith("0")) {
    targetNumber = "62" + targetNumber.slice(1);
  }

  if (targetNumber.length < 10 || targetNumber.length > 15) {
    return m.reply(`❌ صيغة الرقم غير صالحة`);
  }

  if (isJadibot && jadibotId) {
    if (isAdd) {
      if (addJadibotPremium(jadibotId, targetNumber)) {
        await m.react("💎");
        return m.reply(
          `✅ تمت إضافة *${targetNumber}* كبريميوم للبوت الفرعي بنجاح`,
        );
      } else {
        return m.reply(`❌ \`${targetNumber}\` بريميوم في هذا البوت الفرعي بالفعل`);
      }
    } else if (isDel) {
      if (removeJadibotPremium(jadibotId, targetNumber)) {
        await m.react("✅");
        return m.reply(
          `✅ تم حذف *${targetNumber}* من بريميوم البوت الفرعي بنجاح`,
        );
      } else {
        return m.reply(`❌ \`${targetNumber}\` ليس بريميوم في هذا البوت الفرعي`);
      }
    }
    return;
  }

  if (isAdd) {
    const existingIndex = db.data.premium.findIndex((p) =>
      typeof p === "string" ? p === targetNumber : p.id === targetNumber,
    );

    const days =
      parseInt(m.args?.find((a) => /^\d+$/.test(a) && a.length <= 4)) || 30;
    const pushName = m.quoted?.pushName || m.pushName || "غير معروف";
    const now = Date.now();

    let newExpired;

    if (existingIndex !== -1) {
      const currentData = db.data.premium[existingIndex];
      const currentExpired =
        typeof currentData === "string" ? now : currentData.expired || now;
      const baseTime = currentExpired > now ? currentExpired : now;
      newExpired = baseTime + days * 24 * 60 * 60 * 1000;

      if (typeof currentData === "string") {
        db.data.premium[existingIndex] = {
          id: targetNumber,
          expired: newExpired,
          name: pushName,
          addedAt: now,
        };
      } else {
        db.data.premium[existingIndex].expired = newExpired;
        db.data.premium[existingIndex].name = pushName;
      }
    } else {
      newExpired = now + days * 24 * 60 * 60 * 1000;
      db.data.premium.push({
        id: targetNumber,
        expired: newExpired,
        name: pushName,
        addedAt: now,
      });
    }

    const jid = targetNumber + "@s.whatsapp.net";
    const user = db.getUser(jid) || db.setUser(jid);

    if (user.energi !== -1) {
      user.energi = config.energi?.premium || 999999;
    }
    user.isPremium = true;

    db.setUser(jid, user);
    db.updateExp(jid, 200000);
    db.updateKoin(jid, 20000);

    db.save();

    await m.react("💎");
    return m.reply(
      `✅ ${existingIndex !== -1 ? "تم تجديد" : "تمت إضافة"} البريميوم *${targetNumber}* لمدة *${days} يوم*\nتاريخ الانتهاء: *${formatDate(newExpired)}*`,
    );
  } else if (isDel) {
    const index = db.data.premium.findIndex((p) =>
      typeof p === "string" ? p === targetNumber : p.id === targetNumber,
    );

    if (index === -1) {
      return m.reply(`❌ *${targetNumber}* ليس بريميوم`);
    }

    db.data.premium.splice(index, 1);

    const jid = targetNumber + "@s.whatsapp.net";
    const user = db.getUser(jid);
    if (user) {
      user.isPremium = false;
      db.setUser(jid, user);
    }

    db.save();
    await m.react("✅");
    return m.reply(`✅ تم حذف *${targetNumber}* من البريميوم بنجاح`);
  }
}

export { pluginConfig as config, handler };