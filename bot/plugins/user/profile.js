import config from "../../config.js";
import { getDatabase } from "../../src/lib/maro-database.js";
import { getRole } from "./مستوى.js";
import fs from "fs";
import { getDevice } from "maro";
import { isLid, isLidConverted, getCachedJid, resolveAnyLidToJid } from "../../src/lib/maro-lid.js";

const pluginConfig = {
  name: "بروفايل",
  alias: ["me", "profil", "myprofile", "my", "stats", "status", "حسابي"],
  category: "user",
  description: "عرض الملف الشخصي مع إحصائيات RPG",
  usage: ".بروفايل [@user]",
  example: ".بروفايل",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

const EXP_PER_LEVEL = 10000;

function formatNumber(num) {
  return num?.toLocaleString("ar-EG") || "0";
}

function getLevelBar(current, target) {
  const totalBars = 10;
  const filledBars = Math.min(Math.floor((current / target) * totalBars), totalBars);
  const emptyBars = totalBars - filledBars;
  return "▰".repeat(filledBars) + "▱".repeat(emptyBars);
}

function generateMetaCard(data) {
  const {
    phone, userName, regName, regAge, regGender,
    isRegistered, isOwnerUser, isPremiumUser, isBanned,
    registeredAt, clanId, spouse, role, level, totalExp,
    health, maxHealth, mana, maxMana, stamina, maxStamina,
    levelBar, expProgress, koin, bank, energi, energiStatus,
    exists, canonicalJid, lid, isGroup, isLidTarget, isBot,
    deviceId, avatarStatus, bio, bioDate, isBiz,
    bizDescription, bizWebsite, bizEmail, bizAddress,
    bizCategories, bizVerified, products, collectionsCount,
    botJid, botPlatform, runtime, inventoryItems, unlockedFeatures
  } = data;

  let card = `╭───────────────────────╮\n`;
  card += `│     📱 الملف الشخصي     │\n`;
  card += `╰───────────────────────╯\n\n`;

  card += `╭─── 👤 المعلومات الشخصية ───╮\n`;
  card += `│ 📛 الاسم : ${userName || "مستخدم"}\n`;
  if (isRegistered) {
    card += `│ 📝 الاسم المسجل : ${regName}\n`;
    card += `│ 🎂 العمر : ${regAge} سنة\n`;
    card += `│ ⚧ الجنس : ${regGender}\n`;
  }
  card += `│ 🏷 المعرف : @${phone}\n`;
  card += `│ 👑 نوع الحساب : ${isOwnerUser ? "👑 مالك" : isPremiumUser ? "💎 مميز" : "🆓 مجاني"}\n`;
  if (isBanned) card += `│ 🚫 الحظر : نعم\n`;
  if (registeredAt) card += `│ 📅 تاريخ التسجيل : ${new Date(registeredAt).toLocaleDateString("ar-EG")}\n`;
  if (clanId) card += `│ 🏰 العشيرة : ${clanId}\n`;
  if (spouse) card += `│ 💍 الزوج : @${spouse.split("@")[0]}\n`;
  card += `╰──────────────────────────╯\n\n`;

  card += `╭─── ⚔️ إحصائيات RPG ───╮\n`;
  card += `│ 🎖 الرتبة : ${role}\n`;
  card += `│ 📊 المستوى : ${level}\n`;
  card += `│ ✨ إجمالي الخبرة : ${formatNumber(totalExp)} XP\n`;
  card += `│ ❤️ الصحة : ${health} / ${maxHealth}\n`;
  card += `│ 💧 المانا : ${mana} / ${maxMana}\n`;
  card += `│ ⚡ الطاقة : ${stamina} / ${maxStamina}\n`;
  card += `│ 📈 التقدم للمستوى ${level + 1} :\n`;
  card += `│ ${levelBar}\n`;
  card += `│ ${expProgress}\n`;
  card += `╰──────────────────────────╯\n\n`;

  card += `╭─── 💰 الأصول والمالية ───╮\n`;
  card += `│ 🪙 العملات : ${koin} ريال\n`;
  card += `│ 🏦 البنك : ${bank} ريال\n`;
  card += `│ ⚡ الطاقة : ${energiStatus}\n`;
  card += `╰──────────────────────────╯\n\n`;

  card += `╭─── 📱 معلومات واتساب ───╮\n`;
  card += `│ 📞 الرقم : +${phone}\n`;
  card += `│ ✅ الوجود : ${exists ? 'نعم' : 'لا'}\n`;
  card += `│ 🆔 JID : ${canonicalJid}\n`;
  card += `│ 🔗 LID حقيقي : ${lid || '-'}\n`;
  card += `│ 📂 النوع : ${isGroup ? 'مجموعة' : (isLidTarget ? 'LID' : 'واتساب عادي')}\n`;
  card += `│ 🤖 بوت واتساب : ${isBot ? 'نعم' : 'لا'}\n`;
  card += `│ 📱 معرف الجهاز : ${deviceId || '-'}\n`;
  card += `╰──────────────────────────╯\n\n`;

  card += `╭─── ℹ️ السيرة الذاتية ───╮\n`;
  card += `│ 🖼 الصورة : ${avatarStatus}\n`;
  card += `│ 📝 الحالة : ${bio || '-'}\n`;
  card += `│ 🕐 تاريخ الحالة : ${bioDate || '-'}\n`;
  card += `╰──────────────────────────╯\n\n`;

  card += `╭─── 🏢 معلومات الأعمال ───╮\n`;
  card += `│ 💼 نوع الحساب : ${isBiz ? 'واتساب أعمال' : 'واتساب عادي'}\n`;
  if (isBiz) {
    card += `│ 📄 الوصف : ${bizDescription || '-'}\n`;
    card += `│ 🌐 الموقع : ${bizWebsite || '-'}\n`;
    card += `│ 📧 البريد : ${bizEmail || '-'}\n`;
    card += `│ 📍 العنوان : ${bizAddress || '-'}\n`;
    card += `│ 🏷 الفئات : ${bizCategories || '-'}\n`;
    card += `│ ✓ موثق : ${bizVerified ? 'نعم' : 'لا'}\n`;
    if (products > 0 || collectionsCount > 0) {
      card += `│\n│ 🛍️ المتجر :\n`;
      card += `│ 📦 المنتجات : ${products}\n`;
      card += `│ 📚 المجموعات : ${collectionsCount}\n`;
    }
  }
  card += `╰──────────────────────────╯\n\n`;

  card += `╭─── 🤖 معلومات البوت ───╮\n`;
  card += `│ 🆔 معرف البوت : ${botJid || '-'}\n`;
  card += `│ 💻 المنصة : ${botPlatform || '-'}\n`;
  card += `│ ⚙️ Node : ${runtime}\n`;
  card += `╰──────────────────────────╯\n`;

  if (inventoryItems && inventoryItems.length > 0) {
    card += `\n╭─── 🎒 المخزون ───╮\n`;
    inventoryItems.forEach(([item, qty]) => {
      card += `│ • ${item.charAt(0).toUpperCase() + item.slice(1)} : ${qty} قطعة\n`;
    });
    card += `╰──────────────────────────╯\n`;
  }

  if (unlockedFeatures && unlockedFeatures.length > 0) {
    card += `\n╭─── 🔓 الميزات المفتوحة ───╮\n`;
    unlockedFeatures.forEach(fitur => {
      card += `│ • ${fitur}\n`;
    });
    card += `╰──────────────────────────╯\n`;
  }

  card += `\n╭───────────────────────╮\n`;
  card += `│   ✨ معلومات كاملة   │\n`;
  card += `╰───────────────────────╯`;

  return card;
}

async function handler(m, { sock }) {
  const db = getDatabase();
  const target = m.mentionedJid?.[0] || m.quoted?.sender || m.sender;

  const user = db.getUser(target) || db.setUser(target);

  const isLidTarget = target.endsWith('@lid');
  const isGroup = target.endsWith('@g.us');

  const resolvedJid = isLidTarget && sock.getJid ? sock.getJid(target) : target;
  const phone = resolvedJid.split('@')[0].split(':')[0];
  const deviceId = m.quoted?.key?.id?.split('/')[0] || m.key?.id?.split('/')[0] || (resolvedJid.match(/:(\d+)@/) || [])[1] || null;

  const safe = async (fn) => {
    try { return await fn(); } catch { return null; }
  };

  const [
    onWa,
    ppUrl,
    statusRes,
    bizProfile,
    catalogRes,
    collections,
    lidFromJid,
    contactQuery,
    deviceInfo,
  ] = await Promise.all([
    safe(() => sock.onWhatsApp(phone)),
    safe(() => sock.profilePictureUrl(resolvedJid, 'image')),
    safe(() => sock.fetchStatus(resolvedJid)),
    safe(() => sock.getBusinessProfile(resolvedJid)),
    safe(() => sock.getCatalog({ jid: resolvedJid, limit: 5 })),
    safe(() => sock.getCollections(resolvedJid, 5)),
    safe(() => sock.getLidFromJid(resolvedJid)),
    safe(() => sock.getContact(resolvedJid)),
    safe(() => getDevice(resolvedJid, sock)),
  ]);

  const exists = onWa?.[0]?.exists ?? false;
  const canonicalJid = onWa?.[0]?.jid || resolvedJid;

  // ✅ LID حقيقي من 3 مصادر
  let realLid = null;
  if (m.key?.participant && m.key.participant.endsWith('@lid')) {
    realLid = m.key.participant;
  }
  if (!realLid && lidFromJid) {
    realLid = lidFromJid;
  }
  if (!realLid && onWa?.[0]?.lid) {
    realLid = onWa[0].lid;
  }
  // لو مفيش LID حقيقي، نشوف الكاش
  if (!realLid) {
    const cached = getCachedJid(target);
    if (cached && cached.endsWith('@lid')) realLid = cached;
  }

  const isBot = deviceInfo?.isBot || contactQuery?.isBot || false;
  const statusObj = Array.isArray(statusRes) ? statusRes[0] : statusRes;
  const status = statusObj?.status?.status || statusObj?.status || null;
  const statusTs = statusObj?.status?.setAt || statusObj?.setAt || null;

  const isBiz = !!bizProfile && Object.keys(bizProfile).length > 0;
  const products = catalogRes?.products?.length || 0;
  const collectionsCount = collections?.collections?.length || 0;

  const fmtDate = (ts) => {
    if (!ts) return null;
    const d = ts instanceof Date ? ts : new Date(Number(ts) * (String(ts).length <= 10 ? 1000 : 1));
    return isNaN(d) ? null : d.toLocaleString('ar-EG');
  };

  if (!user.rpg) user.rpg = {};
  const userExp = user.exp || 0;
  const userLevel = Math.floor(userExp / EXP_PER_LEVEL) + 1;
  user.rpg.level = userLevel;
  user.rpg.health = user.rpg.health || 100;
  user.rpg.maxHealth = 100 + (userLevel - 1) * 10;
  user.rpg.mana = user.rpg.mana || 100;
  user.rpg.maxMana = 100 + (userLevel - 1) * 5;
  user.rpg.stamina = user.rpg.stamina || 100;
  user.rpg.maxStamina = 100 + (userLevel - 1) * 5;

  const currentLevelExp = (userLevel - 1) * EXP_PER_LEVEL;
  const levelUpExp = userLevel * EXP_PER_LEVEL;
  const expInLevel = userExp - currentLevelExp;
  const expNeeded = levelUpExp - currentLevelExp;
  const role = getRole(userLevel);
  const isOwnerUser = config.isOwner(target);
  const isPremiumUser = config.isPremium(target);

  let ppMedia = null;
  try {
    const profilePicUrl = await sock.profilePictureUrl(target, "image");
    if (profilePicUrl) ppMedia = { url: profilePicUrl };
    else throw new Error("لا توجد صورة");
  } catch {
    const fallbackUrl = config.assets["pp-kosong"];
    ppMedia = fallbackUrl ? { url: fallbackUrl } : { url: "https://i.imgur.com/TuItj4L.png" };
  }

  const inventoryItems = user.inventory
    ? Object.entries(user.inventory).filter(([_, qty]) => qty > 0)
    : [];

  const unlockedFeatures = user.unlockedFeatures || [];

  const cardData = {
    phone,
    userName: user.name || m.pushName || "مستخدم",
    regName: user.regName,
    regAge: user.regAge,
    regGender: user.regGender,
    isRegistered: user.isRegistered,
    isOwnerUser,
    isPremiumUser,
    isBanned: user.isBanned,
    registeredAt: user.registeredAt,
    clanId: user.clanId,
    spouse: user.rpg?.spouse,
    role,
    level: user.rpg.level,
    totalExp: userExp,
    health: user.rpg.health,
    maxHealth: user.rpg.maxHealth,
    mana: user.rpg.mana,
    maxMana: user.rpg.maxMana,
    stamina: user.rpg.stamina,
    maxStamina: user.rpg.maxStamina,
    levelBar: getLevelBar(expInLevel, expNeeded),
    expProgress: `${formatNumber(expInLevel)} / ${formatNumber(expNeeded)} XP`,
    koin: user.koin?.toLocaleString("ar-EG") || "0",
    bank: user.rpg?.bank?.toLocaleString("ar-EG") || "0",
    energi: user.energi,
    energiStatus: isOwnerUser || isPremiumUser ? "∞ غير محدود" : user.energi,
    exists,
    canonicalJid,
    lid: realLid || '-',
    isGroup,
    isLidTarget,
    isBot,
    deviceId,
    avatarStatus: ppUrl ? 'موجودة' : 'غير موجودة',
    bio: status,
    bioDate: fmtDate(statusTs),
    isBiz,
    bizDescription: bizProfile?.description,
    bizWebsite: (bizProfile?.website || []).join(', '),
    bizEmail: bizProfile?.email,
    bizAddress: bizProfile?.address,
    bizCategories: (bizProfile?.categories || []).map(c => c.name || c).join(', '),
    bizVerified: bizProfile?.isProfileLinked,
    products,
    collectionsCount,
    botJid: sock.user?.id,
    botPlatform: sock.authState?.creds?.platform || process.platform,
    runtime: process.version,
    inventoryItems,
    unlockedFeatures
  };

  const caption = generateMetaCard(cardData);
  const mentions = [target];
  if (user.rpg?.spouse) mentions.push(user.rpg.spouse);

  const msgOptions = { caption, mentions, quoted: m };
  if (ppMedia) msgOptions.image = ppMedia;

  await sock.sendMessage(m.chat, msgOptions);
}

export { pluginConfig as config, handler };