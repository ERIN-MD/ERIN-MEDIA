import fs from "node:fs";

const targets = [
  { id: "waifu-slap", source: "plugins/fun/صفع.js", url: "https://api.waifu.pics/sfw/slap", expect: "json" },
  { id: "maro-api", source: "plugins/canvas + plugins/sticker", url: "https://api.maro.my.id/", expect: "any" },
  { id: "zenzxz-api", source: "plugins/canvas/avatarjpg.js", url: "https://api.zenzxz.my.id/", expect: "any" },
  { id: "snowping-api", source: "plugins/ai/سنوai.js + plugins/tools", url: "https://apis.snowping.eu.cc/", expect: "any" },
  { id: "ilovepin", source: "src/scraper/pindl.js", url: "https://ilovepin.net/id", expect: "html" },
  { id: "redvid", source: "src/scraper/reddit.js", url: "https://redvid.io/", expect: "html" },
  { id: "brat-quoted", source: "plugins/sticker/qc.js", url: "https://brat.siputzx.my.id/", expect: "any" },
  { id: "gimita-cdn", source: "plugins/group/ترحيب.js + plugins/group/وداع.js", url: "https://cdn.gimita.id/", expect: "any" },
  { id: "denay-qr", source: "plugins/tools/qr.js", url: "https://api.denayrestapi.xyz/", expect: "any" },
];

async function probe(target) {
  const startedAt = Date.now();
  try {
    const response = await fetch(target.url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
      headers: {
        Accept: target.expect === "json" ? "application/json" : "text/html,application/json;q=0.9,*/*;q=0.1",
        "User-Agent": "Tarboo Bot-API-Audit/1.0 (safe endpoint probe)",
      },
    });
    const contentType = response.headers.get("content-type") || "";
    const excerpt = (await response.text()).slice(0, 2048).trim();
    let shape = "غير مقروء/غير JSON";
    if (contentType.includes("application/json")) {
      try {
        const json = JSON.parse(excerpt);
        shape = Array.isArray(json) ? `مصفوفة (${json.length})` : `مفاتيح: ${Object.keys(json || {}).slice(0, 12).join(", ") || "لا يوجد"}`;
      } catch {
        shape = "JSON غير مكتمل ضمن حد القراءة";
      }
    } else if (contentType.startsWith("text/")) {
      shape = `نص مختصر: ${excerpt.replace(/\s+/g, " ").slice(0, 140) || "فارغ"}`;
    }
    return { ...target, status: response.status, contentType, shape, elapsed: Date.now() - startedAt, error: "" };
  } catch (error) {
    return { ...target, status: "غير متاح", contentType: "", shape: "", elapsed: Date.now() - startedAt, error: error.cause?.code || error.name || error.message };
  }
}

const results = await Promise.all(targets.map(probe));
const markdown = [
  "# فحص محدود لنقاط النهاية ذات الأولوية",
  "",
  "> أُرسلت طلبات GET عامة فقط بلا مفاتيح أو معرّفات مستخدم أو تنزيل ملفات أو استدعاءات تحويل. يُقرأ أول 2KB كحد أقصى لأغراض التحقق من البنية.",
  "",
  "| المصدر | الملف/الملفات | HTTP | نوع المحتوى | زمن (ms) | بنية مختصرة أو خطأ |",
  "|---|---|---:|---|---:|---|",
  ...results.map((result) => `| ${result.id} | \`${result.source}\` | ${result.status} | ${result.contentType || "—"} | ${result.elapsed} | ${(result.error || result.shape || "—").replace(/\|/g, "\\|")} |`),
  "",
  "## الاستنتاج",
  "",
  "المصادر التي لا تستجيب تقنياً أو لا تعطي البنية المتوقعة تُعامل كمصادر تحتاج استبدالاً أو fallback؛ أما الاستجابة الناجحة هنا فلا تثبت نجاح تدفقات التحويل أو التنزيل الفعلية.",
  "",
];

fs.writeFileSync("EXTERNAL_ENDPOINT_PROBE.md", markdown.join("\n"));
console.table(results.map(({ id, status, contentType, elapsed, error }) => ({ id, status, contentType, elapsed, error })));
