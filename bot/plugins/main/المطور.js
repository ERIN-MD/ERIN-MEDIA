// ═══════════════════════════════════════════════
// 📁 plugins/main/owner.js
// 👑 عرض معلومات المطور - Tarboo Bot
// ═══════════════════════════════════════════════

import crypto from "crypto";
import config, { getOwnerName } from "../../config.js";
import { getDatabase } from "../../src/lib/maro-database.js";
import {
  proto,
  generateWAMessageFromContent,
  prepareWAMessageMedia,
} from "maro";
import { AIRich } from "../../src/lib/maro-builder.js";
import axios from "axios";
import sharp from "sharp";

const pluginConfig = {
  name: "owner",
  alias: ["creator", "dev", "developer", "مطور", "المطور", "صاحب"],
  category: "main",
  description: "عرض معلومات مطور البوت",
  usage: ".مطور",
  example: ".مطور",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock, config: botConfig }) {
  const db = getDatabase();
  const ownerType = db.setting("ownerType") || 1;
  const configOwners = botConfig.owner?.number || [];
  const dbOwners = db.data.owner || [];
  const ownerNumbers = [...new Set([...configOwners, ...dbOwners])];
  const botName = botConfig.bot?.name || "Tarboo Bot";

  if (ownerType === 2) {
    const contacts = [];

    for (const number of ownerNumbers) {
      const cleanNumber = number.replace(/[^0-9]/g, "");
      const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${getOwnerName(number)}\nTEL;type=CELL;type=VOICE;waid=${cleanNumber}:+${cleanNumber}\nEND:VCARD`;
      contacts.push({ vcard });
    }

    const sent = await sock.sendMessage(
      m.chat,
      {
        contacts: {
          displayName: `👑 مطور البوت`,
          contacts,
        },
      },
      { quoted: m.raw },
    );

    await sock.sendMessage(m.chat, {
      text: "💬 لو عندك أي سؤال، ماتترددش في التواصل مع المطور، هو شخص محترم وبيحب يساعد"
    }, { quoted: sent });

  } else {
    const ownerText = `👑 *معلومات المطور*\n\n╭┈┈⬡「 📋 *التفاصيل* 」\n┃ 👤 الاسم: *${ownerNumbers.map((n) => getOwnerName(n)).join(", ")}*\n┃ 🤖 البوت: *${botName}*\n┃ 📊 الحالة: *🟢 متصل*\n╰┈┈⬡\n\n> _لو عندك سؤال أو مشكلة،_\n> _تواصل مع المطور من خلال جهة الاتصال أدناه_\n> _📞 بطاقة الاتصال في الأسفل._`;

    await m.reply(ownerText);

    for (const number of ownerNumbers) {
      const cleanNumber = number.replace(/[^0-9]/g, "");
      const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${getOwnerName(number)} (مطور ${botName})\nTEL;type=CELL;type=VOICE;waid=${cleanNumber}:+${cleanNumber}\nEND:VCARD`;

      await sock.sendMessage(
        m.chat,
        {
          contacts: {
            displayName: getOwnerName(number),
            contacts: [{ vcard }],
          },
        },
        { quoted: m.raw },
      );
    }
  }
}

export { pluginConfig as config, handler };