import axios from "axios";
import config from "../../config.js";
import { f } from "../../src/lib/maro-http.js";
import { saluranCtx } from "../../src/lib/maro-context.js";

// ═══════════════════════════════════════════════
// 🎭 قائمة المستخدمين
// ═══════════════════════════════════════════════
const usernames = [
  "natajadeh", "aletaanovianda", "faisafch", "0rbby", "cindyanastt",
  "awaa.an", "nadineabgail", "ciloqciliq", "carluskiey", "wuxiaturuxia",
  "joomblo", "hxszys", "indomeysleramu", "anindthrc", "m1cel",
  "chrislin.chrislin", "brocolee__", "dxzdaa", "toodlesprunky", "wasawho",
  "paphricia", "queenzlyjlita", "apol1yon", "eliceannabella", "aintyrbaby",
  "christychriselle", "natalienovita", "glennvmi", "_rgtaaa", "felicialrnz",
  "zahraazzhri", "mdy.li", "jeyiiiii_", "bbytiffs", "irenefennn",
  "mellyllyyy", "xsta_xstar", "n0_0ella", "kutubuku6690", "cesiann",
  "gaby.rosse", "charrvm_", "bilacml04", "whosyoraa", "ishaangelica",
  "heresthekei", "gemoy.douyin", "nathasyaest", "jasmine.mat", "akuallyaa",
  "meycoco22", "baby_sya66", "knzymyln__", "rin.channn", "audicamy",
  "franzeskaedelyn", "shiraishi.ito", "itsceceh", "senpai_cj7",
];

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "تيك_عشوائي",
  alias: ["ttasupan"],
  category: "asupan",
  description: "فيديو تيكتوك عشوائي",
  usage: ".تيك_عشوائي [username]",
  example: ".تيك_عشوائي natajadeh",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 15, energi: 2, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎬 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const query = m.text?.trim() || usernames[Math.floor(Math.random() * usernames.length)];

  m.react("⏳");

  try {
    const { data } = await f(`https://api.neoxr.eu/api/asupan?username=${query}&apikey=${config.APIkey.neoxr}`);

    if (!data) {
      m.react("❌");
      return m.reply(`🚩 المستخدم غير موجود\n\n> ${query}`);
    }

    const video = data;
    m.react("✅");

    await sock.sendMedia(m.chat, video.video.url, video.caption || "", m, {
      type: "video",
      contextInfo: saluranCtx(),
    });
  } catch (error) {
    m.react("❌");
    m.reply(`🚩 المستخدم غير موجود\n\n> ${query}`);
  }
}

export { pluginConfig as config, handler };