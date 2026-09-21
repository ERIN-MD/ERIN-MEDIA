// ستريمر - أمر للبث المباشر للألعاب (قد يتم حظر الحساب!)

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "ستريمر",
  alias: ["streamer"],
  category: "rpg",
  description: "البث المباشر للألعاب (قد يتم حظر الحساب!)",
  usage: ".ستريمر",
  example: ".ستريمر",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 180,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock, plugin }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};
  
  const staminaCost = 20;
  user.rpg.stamina = user.rpg.stamina ?? 100;

  if (user.rpg.stamina < staminaCost) {
    return m.reply(`عيناك متعبتان من النظر إلى الشاشة! 😵\n\nالبث يحتاج *${staminaCost}* طاقة، طاقتك المتبقية *${user.rpg.stamina}*. نم قليلاً! 🛏️`);
  }

  user.rpg.stamina -= staminaCost;
  await m.react("🎥");
  await m.reply(`مرحباً أيها المشاهدون! أهلاً بكم في البث المباشر! 🎮\nدعونا نعرض مهاراتنا في لعبة الديدان... 😎`);
  await new Promise(r => setTimeout(r, 3500));

  const gacha = Math.random();

  if (gacha < 0.15) {
    const extraCooldown = 300;
    db.db.data.users[m.sender.split("@")[0]].lastStreamer = Date.now() + (extraCooldown * 1000);
    
    await m.react("🚫");
    return m.reply(`تم حظر حساب البث الخاص بك! 🚫😱\n\nقام بعض المشاهدين بالإبلاغ عنك بسبب التوقف الطويل!\nلم تحصل على أي تبرعات و**تم فرض عقوبة منع البث لمدة 5 دقائق إضافية**!\n\n⚡ الطاقة المستهلكة: -${staminaCost}\n\nاصبر، حاول تقديم استئناف... 😔`);
  }

  const earning = Math.floor(Math.random() * 30000) + 10000;
  let saweranPaus = 0;

  if (gacha > 0.85) {
    saweranPaus = Math.floor(Math.random() * 100000) + 50000;
  }

  const totalEarning = earning + saweranPaus;
  user.koin = (user.koin || 0) + totalEarning;
  const expGain = Math.floor(totalEarning / 30);
  await addExpWithLevelCheck(sock, m, db, user, expGain);

  await m.react("✅");
  let txt = `انتهى البث المباشر! 🎥✨\n\n💵 أرباح الإعلانات: *+${earning.toLocaleString("ar-EG")}* عملة\n`;
  if (saweranPaus > 0) txt += `🐳 تبرع من ثري: *+${saweranPaus.toLocaleString("ar-EG")}* عملة\nهناك مشاهد غني تبرع بسخاء! 🐋🔥\n`;
  txt += `📈 الخبرة: *+${expGain}*\n⚡ الطاقة المستهلكة: -${staminaCost}\n\nشكراً للمتبرعين! أحبكم! 💖`;
  
  m.reply(txt);
}

export { pluginConfig as config, handler };