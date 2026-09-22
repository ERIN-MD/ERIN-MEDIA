import * as timeHelper from "../../src/lib/maro-time.js";
import { getDatabase } from "../../src/lib/maro-database.js";
import config from "../../config.js";
import {
  getTodaySchedule,
  extractPrayerTimes,
  searchKota,
} from "../../src/lib/maro-sholat-api.js";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "تذكير_الصلاة",
  alias: ["autosholat"],
  category: "owner",
  description: "تبديل التذكير التلقائي بأوقات الصلاة مع صوت الأذان وإغلاق المجموعة",
  usage: ".تذكير_الصلاة on/off/status/kota <الاسم>",
  example: ".تذكير_الصلاة on",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

const AUDIO_ADZAN = "https://media.vocaroo.com/mp3/1ofLT2YUJAjQ";

async function handler(m, { sock, db }) {
  const args = m.args[0]?.toLowerCase();
  const database = getDatabase();
  
  if (!args || args === "status") {
    const status = database.setting("autoSholat") ? "مفعل ✅" : "معطل ❌";
    const closeGroup = database.setting("autoSholatCloseGroup") ? "نعم ✅" : "لا ❌";
    const duration = database.setting("autoSholatDuration") || 5;
    const kotaSetting = database.setting("autoSholatKota") || { id: "1301", nama: "جاكرتا" };
    
    let jadwalText = "";
    try {
      const jadwalData = await getTodaySchedule(kotaSetting.id);
      const times = extractPrayerTimes(jadwalData);
      for (const [nama, waktu] of Object.entries(times)) {
        jadwalText += `- **${nama.charAt(0).toUpperCase() + nama.slice(1)}**: ${waktu}\n`;
      }
    } catch {
      jadwalText = "- فشل في تحميل الجدول من MyQuran\n";
    }

    return m.reply(
      `🕌 **تذكير الصلاة - نظام التذكير بأوقات العبادة**\n\n` +
      `تم إعداد النظام لمساعدتك وأعضاء المجموعة على تذكر أوقات العبادة تلقائياً.\n\n` +
      `- **حالة التذكير**: ${status}\n` +
      `- **إغلاق المجموعة تلقائياً**: ${closeGroup}\n` +
      `- **مدة الإغلاق**: ${duration} دقيقة\n` +
      `- **الموقع الحالي**: ${kotaSetting.nama}\n\n` +
      `**جدول الصلاة اليوم:**\n` +
      jadwalText + `\n` +
      `**دليل استخدام الميزة:**\n` +
      `- اكتب \`${m.prefix}تذكير_الصلاة on\` لتفعيل نظام التذكير.\n` +
      `- اكتب \`${m.prefix}تذكير_الصلاة off\` لإيقاف نظام التذكير.\n` +
      `- اكتب \`${m.prefix}تذكير_الصلاة close on\` أو \`off\` لتشغيل/إيقاف الإغلاق التلقائي.\n` +
      `- اكتب \`${m.prefix}تذكير_الصلاة duration <رقم>\` لتحديد مدة الإغلاق (بالدقائق).\n` +
      `- اكتب \`${m.prefix}تذكير_الصلاة kota <اسم المدينة>\` لمزامنة أوقات الصلاة مع منطقتك.\n\n` +
      `_جميع الجداول مأخوذة بدقة من مصدر بيانات MyQuran API._`
    );
  }

  if (args === "on") {
    database.setting("autoSholat", true);
    await m.react("✅");
    const kota = database.setting("autoSholatKota") || { nama: "جاكرتا" };
    return m.reply(
      `✅ **تم تفعيل نظام تذكير الصلاة!**\n\n` +
      `من الآن فصاعداً، سأرسل إشعاراً مع تسجيل صوتي للأذان عند دخول وقت الصلاة. جميع المعلومات متزامنة مع توقيت **${kota.nama}**.`
    );
  }

  if (args === "off") {
    database.setting("autoSholat", false);
    await m.react("❌");
    return m.reply(
      `❌ **تم تعطيل نظام تذكير الصلاة.**\n\n` +
      `حسناً، لن أقوم بإرسال إشعارات الصلاة وتشغيل الأذان تلقائياً بعد الآن.`
    );
  }

  if (args === "close") {
    const subArg = m.args[1]?.toLowerCase();
    if (subArg === "on") {
      database.setting("autoSholatCloseGroup", true);
      await m.react("🔒");
      return m.reply(
        `🔒 **تم تفعيل الإغلاق التلقائي للمجموعة!**\n\n` +
        `عند دخول وقت الصلاة، سأغلق المجموعة تلقائياً ليتمكن الجميع من التركيز في العبادة.`
      );
    }
    if (subArg === "off") {
      database.setting("autoSholatCloseGroup", false);
      await m.react("🔓");
      return m.reply(
        `🔓 **تم تعطيل الإغلاق التلقائي للمجموعة.**\n\n` +
        `الآن لن يتم إغلاق المجموعة عند الأذان، وستستمر المحادثة بشكل طبيعي.`
      );
    }
    return m.reply(`الصيغة غير صحيحة. استخدم \`${m.prefix}تذكير_الصلاة close on\` أو \`${m.prefix}تذكير_الصلاة close off\`.`);
  }

  if (args === "duration") {
    const duration = parseInt(m.args[1]);
    if (isNaN(duration) || duration < 1 || duration > 60) {
      return m.reply(`يرجى إدخال رقم بين 1 و 60 لمدة الإغلاق (بالدقائق).`);
    }
    database.setting("autoSholatDuration", duration);
    await m.react("⏱️");
    return m.reply(
      `⏱️ **تم تحديث مدة الإغلاق!**\n\n` +
      `سيتم إغلاق المجموعة لمدة **${duration} دقيقة** عند كل وقت صلاة قبل إعادة فتحها تلقائياً.`
    );
  }

  if (args === "kota") {
    const kotaName = m.args.slice(1).join(" ").trim();
    if (!kotaName) {
      return m.reply(`يرجى ذكر اسم المدينة! مثال: \`${m.prefix}تذكير_الصلاة kota مكة\`.`);
    }
    await m.react("🔍");
    try {
      const result = await searchKota(kotaName);
      if (!result) {
        return m.reply(`عذراً، لم أتمكن من العثور على **${kotaName}** في قاعدة بيانات MyQuran. جرب اسم مدينة أخرى؟`);
      }
      database.setting("autoSholatKota", {
        id: result.id,
        nama: result.lokasi,
      });
      await m.react("📍");
      return m.reply(
        `📍 **تم تحديث موقع التذكير!**\n\n` +
        `تمت معايرة جميع جداول الصلاة لتتوافق مع توقيت **${result.lokasi}**.`
      );
    } catch (e) {
      await m.reply(te(m.prefix, m.command, m.pushName));
    }
  }

  return m.reply(`الأمر غير صحيح. يمكنك استخدام: \`on\`, \`off\`, \`status\`, \`close\`, \`duration\`, أو \`kota\`.`);
}

async function runAutoSholat(sock) {
  const db = getDatabase();
  if (!db.setting("autoSholat")) return;
  
  const kotaSetting = db.setting("autoSholatKota") || {
    id: "1301",
    nama: "جاكرتا",
  };
  
  let times;
  try {
    const jadwalData = await getTodaySchedule(kotaSetting.id);
    times = extractPrayerTimes(jadwalData);
  } catch {
    return;
  }
  
  const JADWAL = {
    subuh: times.subuh,
    dzuhur: times.dzuhur,
    ashar: times.ashar,
    maghrib: times.maghrib,
    isya: times.isya,
  };
  
  const timeNow = timeHelper.getCurrentTimeString();
  if (!global.autoSholatLock) global.autoSholatLock = {};
  
  for (const [sholat, waktu] of Object.entries(JADWAL)) {
    if (waktu === "-") continue;
    
    if (timeNow === waktu && !global.autoSholatLock[sholat]) {
      global.autoSholatLock[sholat] = true;
      try {
        global.isFetchingGroups = true;
        const groupsObj = await sock.groupFetchAllParticipating();
        global.isFetchingGroups = false;
        
        const groupList = Object.keys(groupsObj);
        const closeGroup = db.setting("autoSholatCloseGroup") || false;
        const duration = db.setting("autoSholatDuration") || 5;

        for (const jid of groupList) {
          const groupData = db.data?.groups?.[jid] || {};
          if (groupData.notifSholat === false) continue;
          
          try {
            const caption =
              `🕌 **إشعار دخول وقت صلاة ${sholat.toUpperCase()}** 🕌\n\n` +
              `حان وقت التوقف قليلاً عن أمور الدنيا! وقت صلاة **${sholat}** قد حان لمنطقة **${kotaSetting.nama}** وما حولها (بالضبط عند الساعة **${waktu}**).\n\n` +
              `هيا جدد نشاطك، توضأ، ولبِّ نداءه المقدس. تقبل الله منا ومنكم الصلاة! 🤲\n\n` +
              (closeGroup ? `_احتراماً للوقت، سيتم إغلاق المجموعة مؤقتاً (لمدة ${duration} دقيقة)._` : "");
            
            const msgTeks = await sock.sendMessage(jid, {
              text: caption,
            });

            await sock.sendMessage(jid, {
              audio: { url: AUDIO_ADZAN },
              mimetype: "audio/mpeg",
              ptt: false,
            }, { quoted: msgTeks });

            if (closeGroup) {
              await sock.groupSettingUpdate(jid, "announcement");
            }
            await new Promise((res) => setTimeout(res, 500));
          } catch (e) {
            console.log(`فشل في إرسال إشعار الصلاة إلى ${jid}:`, e.message);
          }
        }
        
        if (closeGroup) {
          setTimeout(async () => {
            for (const jid of groupList) {
              try {
                await sock.groupSettingUpdate(jid, "not_announcement");
                await sock.sendMessage(jid, {
                  text: `✅ **انتهى وقت الإغلاق**\n\nانتهت صلاة **${sholat}**. تم فتح المجموعة تلقائياً. واصل نشاطك!`,
                });
                await new Promise((res) => setTimeout(res, 600));
              } catch (e) {
                console.log(`فشل في فتح المجموعة ${jid}:`, e.message);
              }
            }
          }, duration * 60 * 1000);
        }
      } catch (error) {
        global.isFetchingGroups = false;
        console.error("خطأ في نظام تذكير الصلاة:", error.message);
      }
      
      setTimeout(() => {
        delete global.autoSholatLock[sholat];
      }, 2 * 60 * 1000);
    }
  }
}

export { pluginConfig as config, handler, runAutoSholat, AUDIO_ADZAN };