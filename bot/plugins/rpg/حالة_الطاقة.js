// حالة_الطاقة - أمر لعرض واستعادة الطاقة

import { getDatabase } from "../../src/lib/maro-database.js";
import { sendRpgPreview } from "../../src/lib/maro-context.js";

const pluginConfig = {
  name: "حالة_الطاقة",
  alias: ["stamina"],
  category: "rpg",
  description: "عرض واستعادة الطاقة",
  usage: ".حالة_الطاقة / .حالة_الطاقة تعبئة",
  example: ".حالة_الطاقة",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

function createStaminaBar(current, max) {
  const filled = Math.round((current / max) * 10);
  const empty = 10 - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);
  const args = m.args || [];

  if (!user.rpg) user.rpg = {};
  user.rpg.stamina = user.rpg.stamina ?? 100;
  user.rpg.maxStamina = user.rpg.maxStamina || 100;

  const subCmd = args[0]?.toLowerCase();

  if (subCmd === "isi" || subCmd === "تعبئة" || subCmd === "restore" || subCmd === "heal") {
    const potionCost = 5000;

    if (user.rpg.stamina >= user.rpg.maxStamina) {
      return m.reply(`⚡ *الطاقة ممتلئة*\n\n> طاقتك ممتلئة بالفعل!`);
    }

    if ((user.koin || 0) < potionCost) {
      return m.reply(`❌ *الرصيد غير كافٍ*\n\n` + `> التكلفة: ${potionCost.toLocaleString("ar-EG")} عملة\n` + `> رصيدك: ${(user.koin || 0).toLocaleString("ar-EG")} عملة`);
    }

    user.koin -= potionCost;
    const restored = user.rpg.maxStamina - user.rpg.stamina;
    user.rpg.stamina = user.rpg.maxStamina;

    db.save();

    await m.react("⚡");
    return sendRpgPreview(
      sock,
      m.chat,
      `⚡ *تم تعبئة الطاقة*\n\n` +
        `*💊 تم الاستعادة:*\n` +
        `> ⚡ الطاقة: *+${restored}*\n` +
        `> 💵 التكلفة: *-${potionCost.toLocaleString("ar-EG")}* عملة\n` +
        `> 📊 الآن: *${user.rpg.stamina}/${user.rpg.maxStamina}*\n`,
      "⚡ طاقة",
      "تعبئة",
      { quoted: m },
    );
  }

  const staminaBar = createStaminaBar(user.rpg.stamina, user.rpg.maxStamina);

  let txt = `⚡ *حالة الطاقة*\n\n`;
  txt += `*📊 المعلومات:*\n`;
  txt += `> ⚡ الطاقة: *${user.rpg.stamina}/${user.rpg.maxStamina}*\n`;
  txt += `> 📊 [${staminaBar}]\n\n`;
  txt += `> تعبئة الطاقة: \`${m.prefix}حالة_الطاقة تعبئة\` (5000 عملة)\n`;
  txt += `> تتجدد الطاقة تلقائياً كل ساعة`;

  await sendRpgPreview(sock, m.chat, txt, "⚡ طاقة", "الحالة", {
    quoted: m,
  });
}

export { pluginConfig as config, handler };