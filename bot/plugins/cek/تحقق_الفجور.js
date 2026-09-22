const pluginConfig = {
  name: "تحقق_الفجور",
  alias: ["cekmesum"],
  category: "cek",
  description: "تحقق من مدى فجورك",
  usage: ".تحقق_الفجور <اسم>",
  example: ".تحقق_الفجور أحمد",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

async function handler(m) {
  const percent = Math.floor(Math.random() * 101);
  const mentioned = m.mentionedJid[0] || m.sender;

  let desc = "";
  if (percent >= 90) {
    desc = "فجور حاد! تب يا رجل! 😳🔞";
  } else if (percent >= 70) {
    desc = "فاجر جداً! 👀";
  } else if (percent >= 50) {
    desc = "لا بأس به من الفجور 😏";
  } else if (percent >= 30) {
    desc = "قليل من الفجور 🙈";
  } else {
    desc = "بريء وطاهر! 😇";
  }

  let txt =
    mentioned === m.sender
      ? `مرحباً @${mentioned.split("@")[0]}
    
مستوى فجورك *${percent}%*
\`\`\`${desc}\`\`\``
      : `تريد التحقق من مستوى الفجور لدى @${mentioned.split("@")[0]}؟
    
مستوى فجوره *${percent}%*
\`\`\`${desc}\`\`\``;

  await m.reply(txt, { mentions: [mentioned] });
}

export { pluginConfig as config, handler };