import { clearRegistrationSession } from "./daftar.js";

const pluginConfig = {
  name: "الغاء_التسجيل",
  alias: ["bataldaftar"],
  category: "user",
  description: "إلغاء جلسة التسجيل النشطة",
  usage: ".الغاء_التسجيل",
  example: ".الغاء_التسجيل",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
  skipRegistration: true,
};

async function handler(m) {
  const canceled = clearRegistrationSession(m.sender);

  if (!canceled) {
    return m.reply(`❌ ليس لديك جلسة تسجيل نشطة.`);
  }

  return m.reply(
    `✅ تم إلغاء جلسة التسجيل بنجاح.\n\n` +
      `> ابدأ مرة أخرى بـ: \`${m.prefix}daftar\``,
  );
}

export { pluginConfig as config, handler };