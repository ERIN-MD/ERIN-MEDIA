import te from "../../src/lib/maro-error.js";
import mediafire from "../../src/scraper/mediafire.js";

const pluginConfig = {
  name: "ميديا_فاير",
  alias: ["mediafire"],
  category: "downloader",
  description: "تحميل ملف من ميديا فاير",
  usage: ".ميديا_فاير <رابط>",
  example: ".ميديا_فاير https://www.mediafire.com/file/xxx",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 15,
  energi: 1,
  isEnabled: true,
};

function getFileName(result) {
  const directName = result?.meta?.title?.trim();
  const urlName = decodeURIComponent(
    result?.download?.link_download?.split("/").pop()?.split("?")[0] || "",
  );
  const extension = urlName.includes(".") ? `.${urlName.split(".").pop()}` : "";
  if (directName && extension && !directName.includes("."))
    return `${directName}${extension}`;
  return directName || urlName || `mediafire_${Date.now()}${extension}`;
}

async function handler(m, { sock }) {
  const url = m.text?.trim();

  if (!url) {
    return m.reply(
      `⚠️ *طريقة الاستخدام*\n\n` +
        `> \`${m.prefix}ميديا_فاير <رابط>\`\n\n` +
        `> مثال:\n` +
        `> \`${m.prefix}ميديا_فاير https://www.mediafire.com/file/xxx\``,
    );
  }

  if (!url.match(/mediafire\.com/i)) {
    return m.reply(`❌ *رابط غير صالح. استخدم رابط ميديا فاير.*`);
  }
  await m.react("🕕");

  try {
    const result = await mediafire(url);
    await sock.sendMessage(
      m.chat,
      {
        document: { url: result.download.link_download },
        fileName: getFileName(result),
        mimetype: result.download.mimetype,
        contextInfo: {
          forwardingScore: 99,
          isForwarded: true,
        },
      },
      { quoted: m },
    );
  } catch (err) {
    return m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };