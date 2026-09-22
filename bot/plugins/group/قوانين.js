import config from "../../config.js";
import { getDatabase } from "../../src/lib/maro-database.js";
import fs from "fs";
import path from "path";
const pluginConfig = {
  name: "قوانين",
  alias: ["rulesgrup"],
  category: "group",
  description: "عرض قوانين المجموعة",
  usage: ".قوانين",
  example: ".قوانين",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
};

const DEFAULT_GROUP_RULES = `📜 *قوانين المجموعة*

┃ 1️⃣ يمنع السبام/الإغراق
┃ 2️⃣ يمنع الترويج بدون إذن
┃ 3️⃣ يمنع محتوى مسيء/إباحي
┃ 4️⃣ احترم بقية الأعضاء
┃ 5️⃣ استخدم لغة مهذبة
┃ 6️⃣ يمنع نشر الروابط بدون إذن
┃ 7️⃣ التزم بتعليمات المشرفين
┃ 8️⃣ ممنوع التنمر والكلام البذيء

_من يخالف يتم طرده!_`;

async function handler(m, { sock, config: botConfig }) {
  const db = getDatabase();
  const groupData = db.getGroup(m.chat) || {};
  const customRules = groupData.groupRules;
  const rulesText = customRules || DEFAULT_GROUP_RULES;

  const imagePath = path.join(process.cwd(), "assets", "images", "maro-rules.jpg");
  let imageBuffer = fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null;

  if (imageBuffer) {
    await sock.sendMedia(m.chat, imageBuffer, rulesText, m, { type: "image" });
  } else {
    await m.reply(rulesText);
  }
}

export { pluginConfig as config, handler, DEFAULT_GROUP_RULES };