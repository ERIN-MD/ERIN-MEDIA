import config from "../../config.js";
import path from "path";
import fs from "fs";
import fetch from "node-fetch";

const pluginConfig = {
  name: "تبرع",
  alias: ["donasi"],
  category: "main",
  description: "معلومات التبرع لدعم البوت مع QRIS",
  usage: ".تبرع",
  example: ".تبرع",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const botName = config.bot?.name || "Maro-AI";
  const ownerName = config.owner?.name || "Owner";
  const saluranId = config.saluran?.id || "120363400911374213@newsletter";
  const saluranName = config.saluran?.name || botName;

  const donasiConfig = config.donasi || {};
  const payments = donasiConfig.payment || [];
  const links = donasiConfig.links || [];
  const qrisUrl = donasiConfig.qris || "";
  const benefits = donasiConfig.benefits || [
    "دعم التطوير",
    "سيرفر أكثر استقراراً",
    "ميزات جديدة أسرع",
    "دعم ذو أولوية",
  ];

  let text = `تبرع لمالك ${botName} 🙏\n\n`;

  if (payments.length > 0 || links.length > 0) {
    text += `💳 *طرق الدفع*\n`;
    for (const pay of payments) {
      text += `🏦 *${pay.name
        ?.toLowerCase()
        .split("")
        .map((c, i) => (i === 0 ? c.toUpperCase() : c))
        .join("")}*\n`;
      text += `◦ ${pay.number} (a/n ${pay.holder})\n`;
    }

    for (const link of links) {
      const icons = {
        saweria: "☕",
        trakteer: "🍵",
        paypal: "💰",
        default: "🔗",
      };
      const icon = icons[link.name?.toLowerCase()] || icons.default;
      text += `${icon} *${link.name}*\n`;
      text += `${link.url}\n`;
    }
  } else {
    text += `╭┈┈⬡「 💳 *طرق الدفع* 」\n`;
    text += `┃\n`;
    text += `┃ > لم يتم التكوين بعد\n`;
    text += `┃ > عدل config.donasi\n`;
    text += `┃\n`;
    text += `╰┈┈┈┈┈┈┈┈⬡\n\n`;
  }

  text += `🎁 *المزايا*\n`;
  for (const benefit of benefits) {
    text += `◦ ${benefit}\n`;
  }
  text += `\n`;

  text += `_أي تبرع مهما كان صغيراً فهو ذو قيمة_\n`;
  text += `تواصل: @${config.owner?.number?.[0] || "owner"}`;

  const copyButtons = payments.map((pay) => ({
    name: "cta_copy",
    buttonParamsJson: JSON.stringify({
      display_text: `📋 نسخ رقم ${pay.name}`,
      copy_code: pay.number,
    }),
  }));

  const contextInfo = {
    mentionedJid: config.owner?.number?.[0]
      ? [`${config.owner.number[0]}@s.whatsapp.net`]
      : [],
    forwardingScore: 9999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: saluranId,
      newsletterName: saluranName,
      serverMessageId: 127,
    },
  };

  if (qrisUrl) {
    try {
      const response = await fetch(qrisUrl);
      const qrisBuffer = Buffer.from(await response.arrayBuffer());

      await sock.sendButton(m.chat, qrisBuffer, text, m, {
        buttons: copyButtons,
      });
    } catch (e) {
      await sock.sendButton(m.chat, null, text, m, {
        buttons: copyButtons,
      });
    }
  } else {
    await sock.sendMessage(
      m.chat,
      {
        text: text,
        footer: botName,
        contextInfo: contextInfo,
        interactiveButtons: copyButtons,
      },
      { quoted: m },
    );
  }
}

export { pluginConfig as config, handler };