// تحليل_الرقم_القومي - أمر لتحليل والتحقق من الرقم القومي الإندونيسي (NIK)

import te from "../../src/lib/maro-error.js";
import config from "../../config.js";

const pluginConfig = {
  name: "تحليل_الرقم_القومي",
  alias: ["nikparser"],
  category: "tools",
  description: "تحليل والتحقق من الرقم القومي الإندونيسي (NIK)",
  usage: ".تحليل_الرقم_القومي <16 رقم NIK>",
  example: ".تحليل_الرقم_القومي 3517072109020003",
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

const API = "https://api.obscuraworks.org/api/v2/tools/nik";
const KEY = config.APIkey.obscura;

// ترجمة أسماء المحافظات الإندونيسية
const PROVINSI = {
  11: "آتشيه",
  12: "شمال سومطرة",
  13: "غرب سومطرة",
  14: "رياو",
  15: "جامبي",
  16: "جنوب سومطرة",
  17: "بنجكولو",
  18: "لامبونغ",
  19: "جزر بانغكا بليتونغ",
  21: "جزر رياو",
  31: "جاكرتا",
  32: "جاوة الغربية",
  33: "جاوة الوسطى",
  34: "يوجياكارتا",
  35: "جاوة الشرقية",
  36: "بانتن",
  51: "بالي",
  52: "نوسا تنقارا الغربية",
  53: "نوسا تنقارا الشرقية",
  61: "كليمنتان الغربية",
  62: "كليمنتان الوسطى",
  63: "كليمنتان الجنوبية",
  64: "كليمنتان الشرقية",
  65: "كليمنتان الشمالية",
  71: "سولاويسي الشمالية",
  72: "سولاويسي الوسطى",
  73: "سولاويسي الجنوبية",
  74: "سولاويسي الجنوبية الشرقية",
  75: "غورونتالو",
  76: "سولاويسي الغربية",
  81: "مالوكو",
  82: "مالوكو الشمالية",
  91: "بابوا",
  92: "بابوا الغربية",
};

async function handler(m, { sock }) {
  const nik = m.text?.replace(/\D/g, "");

  if (!nik || nik.length !== 16) {
    return m.reply(
      `🪪 *تحليل الرقم القومي*\n\n` +
        `- تحليل والتحقق من الرقم القومي الإندونيسي 🇮🇩\n` +
        `- أدخل 16 رقماً من NIK\n\n` +
        `\`${m.prefix}تحليل_الرقم_القومي 3517072109020003\``,
    );
  }

  m.react("🕕");

  try {
    const r = await fetch(`${API}?nik=${nik}`, {
      headers: {
        Accept: "application/json, image/*, audio/*, video/*",
        Authorization: `Bearer ${KEY}`,
      },
    });

    const data = await r.json();

    if (!data?.valid) {
      m.react("❌");
      return m.reply(
        `🪪 *الرقم القومي غير صالح*\n\n` +
          `- الرقم القومي الذي أدخلته غير صالح\n` +
          `- تأكد من أن الرقم مكون من 16 خانة`,
      );
    }

    m.react("✅");

    const bDay = new Date(data.birthISO);
    const bFormatted = bDay.toLocaleDateString("ar-EG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const genderEmoji = data.gender === "pria" ? "♂️" : "♀️";
    const genderText = data.gender === "pria" ? "ذكر" : "أنثى";
    const provNama = PROVINSI[data.provinceId] || data.province || "-";

    m.reply(
      `🪪 *تحليل الرقم القومي*\n\n` +
        `- *الرقم القومي* → \`${data.raw}\`\n` +
        `- *الحالة* → ✅ صالح\n` +
        `- *تاريخ الميلاد* → ${bFormatted}\n` +
        `- *الجنس* → ${genderEmoji} ${genderText}\n` +
        `- *المحافظة* → ${provNama}\n` +
        `- *المدينة/المنطقة* → كود \`${data.kabupatenKotaId}\`\n` +
        `- *الحي* → كود \`${data.kecamatanId}\`\n` +
        `- *الرمز الفريد* → \`${data.uniqcode}\``,
    );
  } catch (e) {
    console.log(e);
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };