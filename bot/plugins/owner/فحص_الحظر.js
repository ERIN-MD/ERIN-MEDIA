import config from "../../config.js";
import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "فحص_الحظر",
  alias: ["checkban"],
  category: "owner",
  description: "فحص حالة الحظر الفعلية",
  usage: ".فحص_الحظر",
  isOwner: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const target = "628979985621@s.whatsapp.net";

  const cleanNumber = target
    .split(":")[0]
    .split("@")[0]
    .replace(/[^0-9]/g, "");
  let bannedList = config.bannedUsers || [];
  const savedBanned = db.setting("bannedUsers") || [];

  const combined = [...new Set([...bannedList, ...savedBanned])];

  const isBannedDirect = combined.some((banned) => {
    const cleanBanned = banned
      .split(":")[0]
      .split("@")[0]
      .replace(/[^0-9]/g, "");
    return (
      cleanNumber === cleanBanned ||
      cleanNumber.endsWith(cleanBanned) ||
      cleanBanned.endsWith(cleanNumber)
    );
  });

  const finalResult = config.isBanned(target);

  let dbStatus = db.setting("bannedUsers");

  await m.reply(`فحص الحظر (${target})
الرقم النظيف: ${cleanNumber}
قائمة الحظر (config): ${JSON.stringify(bannedList)}
قائمة الحظر (db): ${JSON.stringify(savedBanned)}
محظور مباشر: ${isBannedDirect}
config.isBanned(): ${finalResult}
isOwner(): ${config.isOwner(target)}`);
}

export { pluginConfig as config, handler };