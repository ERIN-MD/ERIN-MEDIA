import axios from "axios";
import config from "../../config.js";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "لقطة_شاشة",
  alias: ["ssweb"],
  category: "tools",
  description: "لقطة شاشة لموقع ويب",
  usage: ".لقطة_شاشة <رابط>",
  example: ".لقطة_شاشة https://google.com",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 15,
  energi: 1,
  isEnabled: true,
};

async function ssweb(url, mode = "desktop") {
  const width = mode === "mobile" ? 720 : 1920;
  const apiUrl = `https://image.thum.io/get/width/${width}/crop/1080/noanimate/${url}`;
  const res = await axios.get(apiUrl, {
    responseType: "arraybuffer",
    timeout: 30000,
  });
  return Buffer.from(res.data);
}

async function handler(m, { sock }) {
  let text = m.text?.trim();

  if (!text) {
    return m.reply(
      `📸 *لقطة شاشة الويب*\n\n` +
        `> لقطة شاشة لصفحة موقع ويب\n\n` +
        `> *مثال:*\n` +
        `> ${m.prefix}لقطة_شاشة https://google.com\n` +
        `> ${m.prefix}ssweb https://github.com --جوال`,
    );
  }

  let mode = "desktop";
  if (text.includes("--جوال") || text.includes("--mobile") || text.includes("--hp")) {
    mode = "mobile";
    text = text.replace(/--جوال|--mobile|--hp/g, "").trim();
  }

  if (!text.startsWith("http")) {
    text = "https://" + text;
  }

  await m.react("🕕");

  try {
    const imageBuffer = await ssweb(text, mode);

    await sock.sendMedia(m.chat, imageBuffer, null, m, {
      type: "image",
    });

    await m.react("✅");
  } catch (error) {
    await m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler, ssweb };