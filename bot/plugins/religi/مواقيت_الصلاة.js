// مواقيت_الصلاة - أمر لعرض مواقيت الصلاة لحظياً من myquran.com

import axios from "axios";
import moment from "moment-timezone";
import config from "../../config.js";
import {
  searchKota,
  getTodaySchedule,
  extractPrayerTimes,
} from "../../src/lib/maro-sholat-api.js";
import te from "../../src/lib/maro-error.js";
import { saluranCtx } from "../../src/lib/maro-context.js";

const pluginConfig = {
  name: "مواقيت_الصلاة",
  alias: ["jadwalsholat"],
  category: "religi",
  description: "عرض مواقيت الصلاة لحظياً من myquran.com",
  usage: ".مواقيت_الصلاة <المدينة>",
  example: ".مواقيت_الصلاة القاهرة",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const city = m.args.join(" ").trim() || "القاهرة";
  m.react("🕌");

  try {
    const kota = await searchKota(city);
    if (!kota) {
      m.react("❌");
      return m.reply(
        `❌ *فشل*\n\n> المدينة "${city}" غير موجودة\n> جرب اسماً آخر للمدينة`,
      );
    }

    const jadwalData = await getTodaySchedule(kota.id);
    const times = extractPrayerTimes(jadwalData);
    const lokasi = jadwalData.lokasi || kota.lokasi;
    const daerah = jadwalData.daerah || "";
    const today = moment.tz("Asia/Jakarta").format("dddd, DD MMMM YYYY");

    const saluranId = config.saluran?.id || "120363400911374213@newsletter";
    const saluranName = config.saluran?.name || config.bot?.name || "Maro-AI";

    // ترجمة أيام الأسبوع
    const dayNames = {
      'Monday': 'الاثنين',
      'Tuesday': 'الثلاثاء',
      'Wednesday': 'الأربعاء',
      'Thursday': 'الخميس',
      'Friday': 'الجمعة',
      'Saturday': 'السبت',
      'Sunday': 'الأحد'
    };
    
    const monthNames = {
      'January': 'يناير',
      'February': 'فبراير',
      'March': 'مارس',
      'April': 'أبريل',
      'May': 'مايو',
      'June': 'يونيو',
      'July': 'يوليو',
      'August': 'أغسطس',
      'September': 'سبتمبر',
      'October': 'أكتوبر',
      'November': 'نوفمبر',
      'December': 'ديسمبر'
    };

    let formattedDate = today;
    for (const [en, ar] of Object.entries(dayNames)) {
      formattedDate = formattedDate.replace(en, ar);
    }
    for (const [en, ar] of Object.entries(monthNames)) {
      formattedDate = formattedDate.replace(en, ar);
    }

    const caption = `🕌 *مواقيت الصلاة*
╭┈┈⬡「 📍 *${lokasi}* 」
┃ 📅 ${formattedDate}
┃ 🗺️ ${daerah}
╰┈┈⬡
╭┈┈⬡「 ⏰ *أوقات الصلاة* 」
┃ 🌙 الإمساك: \`${times.imsak}\`
┃ 🌅 الفجر: \`${times.subuh}\`
┃ ☀️ الشروق: \`${times.terbit}\`
┃ 🌤️ الضحى: \`${times.dhuha}\`
┃ 🌞 الظهر: \`${times.dzuhur}\`
┃ 🌇 العصر: \`${times.ashar}\`
┃ 🌆 المغرب: \`${times.maghrib}\`
┃ 🌃 العشاء: \`${times.isya}\`
╰┈┈⬡
> _المصدر: myquran.com | لا تنسَ الصلاة!_ 🤲`;

    const adzanUrl = "https://files.catbox.moe/z2bj5s.mp3";
    let adzanBuffer;
    try {
      const res = await axios.get(adzanUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
      });
      adzanBuffer = Buffer.from(res.data);
    } catch {
      adzanBuffer = null;
    }

    const contextInfo = saluranCtx();

    if (adzanBuffer) {
      await sock.sendMessage(
        m.chat,
        {
          audio: adzanBuffer,
          mimetype: "audio/mpeg",
          ptt: false,
          contextInfo,
        },
        { quoted: m },
      );
      await sock.sendMessage(m.chat, { text: caption }, { quoted: m });
    } else {
      await sock.sendMessage(
        m.chat,
        { text: caption, contextInfo },
        { quoted: m },
      );
    }

    m.react("✅");
  } catch (error) {
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };