// ═══════════════════════════════════════════════
// 📁 src/scraper/dafont.js
// 🔤 DaFont Scraper - بحث عن الخطوط
// ═══════════════════════════════════════════════

import axios from "axios";
import * as cheerio from "cheerio";

async function DaFont(query, options = {}) {
  try {
    const url = "https://www.dafont.com/search.php?q=" + encodeURIComponent(query);
    const res = await axios.get(url, {
      timeout: options.timeout || 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36",
      },
    });

    const $ = cheerio.load(res.data);
    const results = [];

    $(".lv1left.dfbg").each((i, el) => {
      const base = $(el);
      const lv2 = base.nextAll(".lv2right").first();
      const dlbox = base.nextAll(".dlbox").first();
      const previewBox = base.nextAll(".preview").first();

      const raw = base.text().replace(/\s+/g, " ").trim();
      const author = base.find("a").first().text().trim();
      const name = raw.replace(/\s*by\s*.+$/i, "").trim();

      const info = lv2.find(".light").text().trim();
      const downloads = info.match(/[\d,]+ downloads/)?.[0] || null;
      const yesterday = info.match(/\((.*?)\)/)?.[1] || null;
      const license = lv2.find("a.help").first().text().trim();

      const dl = dlbox.find("a.dl").attr("href");
      const download = dl ? "https:" + dl : null;

      const style = previewBox.attr("style");
      const preview = style
        ? "https://www.dafont.com" + (style.match(/url\((.*?)\)/)?.[1] || "")
        : null;

      results.push({
        name,
        author,
        downloads,
        yesterday,
        license,
        download,
        preview
      });
    });

    if (results.length === 0) {
      return {
        status: false,
        error: "لم يتم العثور على خطوط",
        query
      };
    }

    // ترتيب حسب التحميلات
    if (options.sortByDownloads) {
      results.sort((a, b) => {
        const aNum = parseInt(a.downloads?.replace(/[^0-9]/g, "") || "0");
        const bNum = parseInt(b.downloads?.replace(/[^0-9]/g, "") || "0");
        return bNum - aNum;
      });
    }

    // تحديد عدد النتائج
    const finalResults = options.limit ? results.slice(0, options.limit) : results;

    return {
      status: true,
      query,
      count: finalResults.length,
      total: results.length,
      results: finalResults,
    };
  } catch (e) {
    return {
      status: false,
      error: e.message,
      query
    };
  }
}

export { DaFont };