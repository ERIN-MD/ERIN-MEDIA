import axios from "axios";
import te from "../../src/lib/maro-error.js";
import config from "../../config.js";

const pluginConfig = {
  name: "نص_ملصق",
  alias: ["ttp", "texttopicture"],
  category: "sticker",
  description: "صنع ملصق من نص",
  usage: ".نص_ملصق <نص>",
  example: ".نص_ملصق مرحبا",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const text = m.args.join(" ") || m.text?.trim();

  if (!text) {
    return m.reply(`🖼️ *نص_ملصق*\n\n📌 مثال: \`${m.prefix}نص_ملصق مرحبا\``);
  }

  await m.react("🕕");

  try {
    const apiUrl = `https://api.nexray.eu.cc/maker/ttp?text=${encodeURIComponent(text)}`;
    const res = await axios.get(apiUrl, { responseType: "arraybuffer", timeout: 30000 });
    const imageBuffer = Buffer.from(res.data);

    await sock.sendImageAsSticker(m.chat, imageBuffer, m, {
      packname: config.sticker.packname,
      author: config.sticker.author,
    });
    await m.react("✅");
  } catch (err) {
    console.error("[TTP]", err.message);
    await m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };