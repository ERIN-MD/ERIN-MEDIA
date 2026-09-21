import axios from "axios";
import config from "../../config.js";
import te from "../../src/lib/maro-error.js";
const pluginConfig = {
  name: "شخصية_بلو_ارشيف",
  alias: ["bachar"],
  category: "info",
  description: "عرض معلومات شخصية من لعبة Blue Archive",
  usage: ".شخصية_بلو_ارشيف <اسم>",
  example: ".شخصية_بلو_ارشيف shiroko",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

class BluArchive {
  findUrl(input, urls) {
    const clean = input.toLowerCase().replace(/\s+/g, "_");
    if (urls.includes(clean)) return clean;
    const words = clean.split("_");
    const matches = urls.filter((url) => words.every((word) => url.toLowerCase().includes(word)));
    return matches.length > 0 ? matches[0] : null;
  }

  async list() {
    const { data } = await axios.get("https://api.dotgg.gg/bluearchive/characters");
    return data.map((item) => ({
      ...item,
      imgSmall: item.imgSmall ? "https://images.dotgg.gg/bluearchive/characters/" + item.imgSmall : null,
      img: item.img ? "https://images.dotgg.gg/bluearchive/characters/" + item.img : null,
    }));
  }

  async char(name) {
    const listc = await this.list();
    const urls = listc.map((c) => c.url);
    const foundUrl = this.findUrl(name, urls);
    if (!foundUrl) {
      const suggestions = urls.filter((u) => u.includes(name.toLowerCase().split(" ")[0])).slice(0, 5);
      throw new Error(`الشخصية "${name}" غير موجودة.\n\n> ربما تقصد: ${suggestions.join(", ") || "لا يوجد"}`);
    }
    const { data } = await axios.get(`https://api.dotgg.gg/bluearchive/characters/${foundUrl}`);
    return {
      ...data,
      imgSmall: data.imgSmall ? "https://images.dotgg.gg/bluearchive/characters/" + data.imgSmall : null,
      img: data.img ? "https://images.dotgg.gg/bluearchive/characters/" + data.img : null,
    };
  }
}

async function handler(m, { sock }) {
  const name = m.text?.trim();

  if (!name) {
    return m.reply(
      `🎮 *شخصيات بلو ارشيف*\n\n` +
        `> عرض معلومات الشخصية\n\n` +
        `> *مثال:*\n` +
        `> ${m.prefix}شخصية_بلو_ارشيف shiroko\n` +
        `> ${m.prefix}bachar hoshino`,
    );
  }

  await m.react("🕕");

  try {
    const ba = new BluArchive();
    const char = await ba.char(name);

    const saluranId = config.saluran?.id || "120363400911374213@newsletter";
    const saluranName = config.saluran?.name || config.bot?.name || "Maro-AI";

    let caption = `🎮 *${char.name?.toUpperCase()}*\n\n`;
    if (char.bio) { caption += `> ${char.bio.substring(0, 200)}${char.bio.length > 200 ? "..." : ""}\n\n`; }

    caption += `╭┈┈⬡「 📋 *الملف* 」\n`;
    if (char.profile?.familyName) caption += `┃ 👤 العائلة: *${char.profile.familyName}*\n`;
    if (char.profile?.age) caption += `┃ 🎂 العمر: *${char.profile.age}*\n`;
    if (char.profile?.height) caption += `┃ 📏 الطول: *${char.profile.height}*\n`;
    if (char.profile?.school) caption += `┃ 🏫 المدرسة: *${char.profile.school}*\n`;
    if (char.profile?.club) caption += `┃ 🎯 النادي: *${char.profile.club}*\n`;
    if (char.profile?.hobby) caption += `┃ ⭐ الهواية: *${char.profile.hobby}*\n`;
    if (char.profile?.CV) caption += `┃ 🎤 المؤدي الصوتي: *${char.profile.CV}*\n`;
    caption += `╰┈┈┈┈┈┈┈┈⬡\n\n`;

    caption += `╭┈┈⬡「 ⚔️ *القتال* 」\n`;
    if (char.type) caption += `┃ 🏷️ النوع: *${char.type}*\n`;
    if (char.role) caption += `┃ 🎭 الدور: *${char.role}*\n`;
    if (char.position) caption += `┃ 📍 الموقع: *${char.position}*\n`;
    if (char.profile?.weaponType) caption += `┃ 🔫 السلاح: *${char.profile.weaponType}*\n`;
    if (char.profile?.weaponName) caption += `┃ ⚔️ اسم السلاح: *${char.profile.weaponName}*\n`;
    caption += `╰┈┈┈┈┈┈┈┈⬡\n\n`;

    if (char.skills && char.skills.length > 0) {
      caption += `╭┈┈⬡「 ✨ *المهارات* 」\n`;
      for (const skill of char.skills.slice(0, 4)) {
        caption += `┃ 🔹 *${skill.name}* (${skill.type})\n`;
      }
      caption += `╰┈┈┈┈┈┈┈┈⬡`;
    }

    if (char.img) {
      await sock.sendMessage(m.chat, {
        image: { url: char.img }, caption,
        contextInfo: { forwardingScore: 9999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: saluranId, newsletterName: saluranName, serverMessageId: 127 } },
      }, { quoted: m });
    } else {
      await m.reply(caption);
    }

    await m.react("✅");
  } catch (error) {
    await m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };