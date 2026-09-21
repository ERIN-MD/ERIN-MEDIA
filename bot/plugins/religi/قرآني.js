// قرآني - أمر للبحث وتشغيل صوت القرآن من مختلف القراء (mp3quran)

import axios from "axios";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "قرآني",
  alias: ["audioquran"],
  category: "religi",
  description: "البحث وتشغيل صوت القرآن من مختلف القراء (mp3quran)",
  usage: ".قرآني [الوضع] [المعطيات]",
  example: ".قرآني صوت السديس 1\n.قرآني القراء\n.قرآني السور",
  cooldown: 15,
  energi: 1,
  isEnabled: true,
};

const API = "https://www.mp3quran.net/api/v3";

async function mp3quranFetch(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = qs ? `${API}${path}?${qs}` : `${API}${path}`;
  const res = await axios.get(url, {
    timeout: 20000,
    validateStatus: () => true,
    headers: {
      Accept: "application/json",
      Origin: "https://code.rifkyshre.biz.id",
      Referer: "https://code.rifkyshre.biz.id/",
    },
  });
  if (res.status !== 200) {
    throw new Error(`mp3quran HTTP ${res.status}`);
  }
  return res.data;
}

function buildAudioUrl(serverBase, surahId) {
  const padded = String(surahId).padStart(3, "0");
  const base = serverBase.endsWith("/") ? serverBase : serverBase + "/";
  return `${base}${padded}.mp3`;
}

async function mp3quran(input) {
  try {
    const mode = (input?.mode ?? "reciters").toLowerCase();
    const language = typeof input?.language === "string" ? input.language : "eng";

    // ترجمة الأوضاع للدعم العربي
    const modeMap = {
      'القراء': 'reciters',
      'السور': 'suwar',
      'الروايات': 'riwayat',
      'الراديو': 'radios',
      'صوت': 'audio'
    };
    const actualMode = modeMap[mode] || mode;

    if (actualMode === "reciters") {
      const data = await mp3quranFetch("/reciters", { language });
      const list = Array.isArray(data?.reciters) ? data.reciters : [];
      return {
        Status: true,
        Code: 200,
        Input: input,
        Result: {
          message: `🎙️ ${list.length} قارئ متاح (اللغة: ${language})`,
          count: list.length,
          reciters: list.map((r) => ({
            id: r.id,
            name: r.name,
            letter: r.letter,
            moshafCount: Array.isArray(r.moshaf) ? r.moshaf.length : 0,
            moshaf: (r.moshaf ?? []).map((m) => ({
              id: m.id,
              name: m.name,
              server: m.server,
              surahTotal: m.surah_total,
              surahList: m.surah_list,
            })),
          })),
        },
      };
    }

    if (actualMode === "suwar") {
      const data = await mp3quranFetch("/suwar", { language });
      const list = Array.isArray(data?.suwar) ? data.suwar : [];
      return {
        Status: true,
        Code: 200,
        Input: input,
        Result: {
          message: `📖 ${list.length} سورة (1-114)`,
          count: list.length,
          suwar: list.map((s) => ({
            id: s.id,
            name: s.name?.trim(),
            startPage: s.start_page,
            endPage: s.end_page,
            type: s.makkia === 1 ? "مكية" : "مدنية",
          })),
        },
      };
    }

    if (actualMode === "riwayat") {
      const data = await mp3quranFetch("/riwayat", { language });
      const list = Array.isArray(data?.riwayat) ? data.riwayat : [];
      return {
        Status: true,
        Code: 200,
        Input: input,
        Result: {
          message: `📚 ${list.length} رواية قراءة`,
          count: list.length,
          riwayat: list,
        },
      };
    }

    if (actualMode === "radios") {
      const data = await mp3quranFetch("/radios", { language });
      const list = Array.isArray(data?.radios) ? data.radios : [];
      return {
        Status: true,
        Code: 200,
        Input: input,
        Result: {
          message: `📻 ${list.length} بث مباشر للراديو`,
          count: list.length,
          radios: list,
        },
      };
    }

    if (actualMode === "audio") {
      const reciterQuery = typeof input?.reciter === "string" ? input.reciter.trim().toLowerCase() : "";
      const surahId = Number(input?.surah);
      if (!reciterQuery) {
        return {
          Status: false, Code: 400, Input: input, Result: null,
          Error: "حقل 'القارئ' مطلوب (مثال: 'السديس', 'المشاري', 'الحصري').",
        };
      }
      if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114) {
        return {
          Status: false, Code: 400, Input: input, Result: null,
          Error: "رقم السورة يجب أن يكون 1-114.",
        };
      }

      // أسماء القراء بالعربية والإنجليزية
      const ALIASES = {
        السديس: ["alsudaes", "sudaes", "abdulrahman alsudaes", "sudais"],
        المشاري: ["meshary", "mishary alafasy", "alafasy", "alafasi", "mishary"],
        الحصري: ["hosary", "alhosary", "mahmoud khalil alhosary", "husary"],
        الغامدي: ["alghamdi", "saad alghamdi", "saad al ghamdi", "ghamdi"],
        الشريم: ["alshuraim", "saud alshuraim", "shuraim"],
        الشاطري: ["shatry", "abubakr ashshatri", "abu bakr al shatri", "shatri"],
        العجمي: ["alajmi", "ahmed alajmi", "ajmi"],
        المنشاوي: ["minshawy", "mohamed siddiq elminshawi", "minshawi"],
        عفاسي: ["afasy", "alafasy", "meshary alafasy"],
        الرفاعي: ["alrefaei", "hani rifai", "rifai"],
        المعيقلي: ["maher almuaiqly", "almuaiqly", "muaiqly"],
        الجهني: ["aljohany", "abdullah aljohany", "juhany"],
        باسفر: ["albasfar", "abdullah basfar", "basfar"],
        أيوب: ["mohammad ayyoub", "ayyoub"],
        بدير: ["albudair", "salah albudair", "budair"],
        الطبلاوي: ["altablawi", "mohammed altablawi", "tablawi"],
        الثبيتي: ["althubaity", "ibrahim althubaity", "thubaity"],
      };

      function lev(a, b) {
        const m = a.length, n = b.length;
        if (m === 0) return n;
        if (n === 0) return m;
        const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        for (let i = 1; i <= m; i++) {
          for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
              dp[i - 1][j] + 1,
              dp[i][j - 1] + 1,
              dp[i - 1][j - 1] + cost,
            );
          }
        }
        return dp[m][n];
      }

      const data = await mp3quranFetch("/reciters", { language });
      const all = Array.isArray(data?.reciters) ? data.reciters : [];

      let matches = all.filter((r) =>
        (r.name ?? "").toLowerCase().includes(reciterQuery),
      );

      if (matches.length === 0) {
        const expanded = [reciterQuery, ...(ALIASES[reciterQuery] ?? [])];
        for (const word of reciterQuery.split(/\s+/)) {
          if (ALIASES[word]) expanded.push(...ALIASES[word]);
        }
        for (const variant of expanded) {
          const found = all.filter((r) =>
            (r.name ?? "").toLowerCase().includes(variant),
          );
          if (found.length > 0) {
            matches = found;
            break;
          }
        }
      }

      if (matches.length === 0) {
        const threshold = reciterQuery.length <= 4 ? 1 : 2;
        const fuzzyHits = [];
        for (const r of all) {
          const tokens = (r.name ?? "").toLowerCase().split(/[\s\-']+/).filter(Boolean);
          for (const tok of tokens) {
            const d = lev(reciterQuery, tok);
            if (d <= threshold) {
              fuzzyHits.push({ reciter: r, distance: d });
              break;
            }
          }
        }
        fuzzyHits.sort((a, b) => a.distance - b.distance);
        matches = fuzzyHits.slice(0, 10).map((h) => h.reciter);
      }

      if (matches.length === 0) {
        const ranked = all.map((r) => {
          const tokens = (r.name ?? "").toLowerCase().split(/[\s\-']+/).filter(Boolean);
          let best = Infinity;
          for (const tok of tokens) {
            const d = lev(reciterQuery, tok);
            if (d < best) best = d;
          }
          return { name: r.name, distance: best };
        }).sort((a, b) => a.distance - b.distance).slice(0, 5);
        return {
          Status: false, Code: 404, Input: input, Result: null,
          Error: `القارئ "${input.reciter}" غير موجود. اقتراحات: ${ranked.map((r) => r.name).join(", ")}. أو استخدم وضع "القراء" للقائمة الكاملة.`,
        };
      }

      const audios = [];
      for (const reciter of matches) {
        for (const moshaf of reciter.moshaf ?? []) {
          const surahList = String(moshaf.surah_list ?? "").split(",").map((n) => Number(n.trim()));
          if (!surahList.includes(surahId)) continue;
          audios.push({
            reciterId: reciter.id,
            reciterName: reciter.name,
            moshafId: moshaf.id,
            moshafName: moshaf.name,
            surahId,
            audioUrl: buildAudioUrl(moshaf.server, surahId),
          });
        }
      }

      if (audios.length === 0) {
        return {
          Status: false, Code: 404, Input: input, Result: null,
          Error: `تم العثور على القارئ (${matches.length} تطابق) لكن السورة ${surahId} غير متوفرة في المصحف.`,
        };
      }

      return {
        Status: true, Code: 200, Input: input,
        Result: {
          message: `🎵 ${audios.length} صوت للسورة ${surahId} من ${matches.length} قارئ مطابق لـ "${input.reciter}"`,
          matchCount: matches.length,
          audioCount: audios.length,
          firstAudio: audios[0].audioUrl,
          audios,
        },
      };
    }

    return {
      Status: false, Code: 400, Input: input, Result: null,
      Error: `الوضع غير معروف "${mode}". استخدم: القراء | السور | الروايات | الراديو | صوت`,
    };
  } catch (e) {
    return {
      Status: false,
      Code: e.response?.status ?? 500,
      Input: input,
      Result: null,
      Error: e.message ?? String(e),
    };
  }
}

async function handler(m, { sock, args }) {
  if (args.length === 0) {
    return m.reply(
      `🕌 *قرآني*\n\n` +
      `> الأوضاع المتاحة:\n` +
      `- \`.قرآني القراء\` (قائمة القراء)\n` +
      `- \`.قرآني السور\` (قائمة السور 1-114)\n` +
      `- \`.قرآني الراديو\` (قائمة البث المباشر)\n` +
      `- \`.قرآني الروايات\` (قائمة القراءات)\n` +
      `- \`.قرآني صوت <اسم_القارئ> <رقم_السورة>\`\n\n` +
      `*مثال:* \`.قرآني صوت السديس 1\``
    );
  }

  m.react("🕕");

  try {
    const mode = args[0].toLowerCase();
    
    // دعم الأسماء العربية للأوضاع
    const modeMap = {
      'القراء': 'reciters',
      'السور': 'suwar',
      'الروايات': 'riwayat',
      'الراديو': 'radios',
      'صوت': 'audio'
    };
    const actualMode = modeMap[mode] || mode;
    
    if (actualMode === "audio") {
      if (args.length < 3) {
        m.react("❌");
        return m.reply("❌ صيغة خاطئة! مثال: `.قرآني صوت السديس 1`");
      }
      
      const surahId = parseInt(args.pop());
      const reciterQuery = args.slice(1).join(" ");
      
      const input = { mode: "audio", reciter: reciterQuery, surah: surahId, language: "ar" };
      const res = await mp3quran(input);
      
      if (!res.Status) {
        m.react("❌");
        return m.reply(`❌ ${res.Error}`);
      }
      
      const r = res.Result;
      const audioUrl = r.firstAudio;
      const reciterName = r.audios[0].reciterName;
      const moshafName = r.audios[0].moshafName;
      
      let caption = `🕌 *قرآني*\n\n`;
      caption += `*القارئ:* ${reciterName}\n`;
      caption += `*المصحف:* ${moshafName}\n`;
      caption += `*السورة:* رقم ${surahId}\n\n`;
      caption += `> جاري إرسال الصوت...`;
      
      await m.reply(caption);
      
      await sock.sendMessage(m.chat, {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        ptt: false,
      }, { quoted: m });
      
      m.react("✅");
      return;
    }
    
    // للأوضاع الأخرى: القراء، السور، الروايات، الراديو
    const input = { mode: actualMode, language: "ar" };
    const res = await mp3quran(input);
    
    if (!res.Status) {
      m.react("❌");
      return m.reply(`❌ ${res.Error}`);
    }
    
    const r = res.Result;
    let txt = `🕌 *${r.message}*\n\n`;
    
    if (actualMode === "reciters") {
      for (const q of r.reciters.slice(0, 50)) {
        txt += `- #${q.id} *${q.name}* (${q.moshafCount} رواية)\n`;
      }
      if (r.reciters.length > 50) txt += `\n> ... +${r.reciters.length - 50} قارئ آخر.`;
    } else if (actualMode === "suwar") {
      for (const s of r.suwar) {
        txt += `- #${s.id} *${s.name}* (${s.type})\n`;
      }
    } else if (actualMode === "riwayat") {
      for (const rw of r.riwayat) {
        txt += `- #${rw.id} *${rw.name}*\n`;
      }
    } else if (actualMode === "radios") {
      for (const rd of r.radios.slice(0, 50)) {
        txt += `- #${rd.id} *${rd.name}*\n  الرابط: ${rd.url}\n`;
      }
    }
    
    m.react("✅");
    return m.reply(txt);
    
  } catch (err) {
    console.error("[AudioQuran]", err.message);
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };