import { getAssetBuffer } from "../../src/lib/maro-asset-manager.js";
import fs from "fs";
import config from "../../config.js";
import te from "../../src/lib/maro-error.js";
import maroApi from "../../src/lib/maro-apimanager.js";

const pluginConfig = {
  name: "برات",
  alias: ["bratmenu", "bratimg", "brattext"],
  category: "sticker",
  description: "قائمة برات وصانع ستيكرات",
  usage: ".برات | .برات_صورة <نص>",
  example: ".برات_صورة مرحبا",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

const BRAT_VARIANTS = [
  { title: "برات عادي", description: "ستيكر برات عادي", command: "bratimg" },
  { title: "برات اخضر", description: "برات اخضر", command: "bratgreen" },
  { title: "برات ابيض", description: "برات ابيض", command: "bratwhite" },
  { title: "برات انمي", description: "برات انمي", command: "bratanime" },
  { title: "برات بنت", description: "برات بنت", command: "bratcewek" },
  { title: "برات بهليل", description: "برات بهليل", command: "bratbahlil" },
  { title: "برات باتريك", description: "برات باتريك", command: "bratpatrick" },
  { title: "برات سكويد", description: "برات سكويد", command: "bratsquidward" },
  { title: "برات فيرميل", description: "برات فيرميل", command: "bratvermeil" },
  { title: "برات HD", description: "برات عالي الدقة", command: "brathd" },
  { title: "برات فيديو", description: "ستيكر برات متحرك", command: "bratvid" },
  { title: "برات فيديو 2", description: "برات فيديو v2", command: "bratvid2" },
  { title: "برات فيرميل فيديو", description: "برات فيرميل متحرك", command: "bratvermeilvid" },
  { title: "برات جوجو", description: "برات جوجو", command: "bratgojo" },
  { title: "برات جوجو فيديو", description: "برات جوجو متحرك", command: "bratgojovid" },
];

function buildVariantRows(prefix, text) {
  return BRAT_VARIANTS.map((item) => ({
    title: item.title,
    description: `${item.description} • .${item.command} <نص>`,
    id: `${prefix}${item.command} ${text}`,
  }));
}

async function sendBratMenu(m, sock, text) {
  const caption = "🌿 *اختر نوع ستيكر البرات من القائمة أدناه*";
  const buttons = [
    {
      name: "single_select",
      buttonParamsJson: JSON.stringify({
        title: "🌾 اختر نوع برات",
        sections: [{ title: "أنواع برات", rows: buildVariantRows(m.prefix, text) }],
      }),
    },
  ];

  await sock.sendButton(m.chat, getAssetBuffer("maro"), caption, m, {
    buttons,
    footer: "اختر نوع برات المفضل لديك",
  });
}

async function handler(m, { sock }) {
  const text = m.text;
  const command = String(m.command || "").toLowerCase();

  if (command === "برات") {
    await sendBratMenu(m, sock, text);
    return;
  }

  if (!text) {
    return m.reply(`🖼️ *برات*\n\n📌 مثال: \`${m.prefix}bratimg مرحبا\``);
  }

  m.react("🕕");

  try {
    const url = maroApi.yupra.url("/api/image/brat", { text });
    await sock.sendImageAsSticker(m.chat, url, m, {
      packname: config.sticker.packname,
      author: config.sticker.author,
    });
    m.react("✅");
  } catch (error) {
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };