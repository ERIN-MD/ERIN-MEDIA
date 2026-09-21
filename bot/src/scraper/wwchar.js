// ═══════════════════════════════════════════════
// 📁 src/scraper/wuthering-waves.js
// 🎮 Wuthering Waves Scraper - معلومات الشخصيات
// ═══════════════════════════════════════════════

import * as cheerio from 'cheerio';

async function scrapeWutheringWavesCharacter(name, options = {}) {
    if (!name || !name.trim()) {
        return {
            status: false,
            error: "اسم الشخصية مطلوب",
        };
    }

    // دعم البحث بالعربية والإنجليزية
    const slug = name.trim().replace(/\s+/g, "_");
    const lang = options.lang || detectLanguage(name);

    // لو عربي، نحاول نحول للاسم الإنجليزي
    let searchSlug = slug;
    if (lang === 'ar' && options.arabicNames && options.arabicNames[slug]) {
        searchSlug = options.arabicNames[slug];
    }

    const url = `https://wutheringwaves.fandom.com/wiki/${encodeURIComponent(searchSlug)}`;

    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept-Language": lang === 'ar' ? "ar-EG,ar;q=0.9" : "en-US,en;q=0.9",
            },
            signal: options.signal || undefined,
        });

        if (!res.ok) {
            // محاولة البحث بالاسم العربي مباشرة
            if (lang === 'ar') {
                const searchUrl = `https://wutheringwaves.fandom.com/wiki/${encodeURIComponent(slug)}`;
                const searchRes = await fetch(searchUrl, {
                    headers: { "User-Agent": "Mozilla/5.0" },
                });
                if (searchRes.ok) {
                    return await parseCharacterPage(searchRes, slug, url);
                }
            }
            return {
                status: false,
                error: "الشخصية غير موجودة",
                url,
            };
        }

        return await parseCharacterPage(res, searchSlug, url);
    } catch (e) {
        return {
            status: false,
            error: e.message,
            url,
        };
    }
}

function detectLanguage(text) {
    // لو فيه حروف عربية
    if (/[\u0600-\u06FF]/.test(text)) return 'ar';
    return 'en';
}

async function parseCharacterPage(res, slug, url) {
    const html = await res.text();
    const $ = cheerio.load(html);

    const clean = (v) => v?.replace(/\s+/g, " ").trim() || null;

    const title = clean($("#firstHeading").text());
    if (!title || title.toLowerCase().includes("not found")) {
        return {
            status: false,
            error: "الصفحة غير صالحة",
            url,
        };
    }

    // السيرة الذاتية
    const bio = clean($(".mw-parser-output > p").first().text());

    // المعلومات الشخصية
    const profile = {};
    $(".pi-item.pi-data").each((_, el) => {
        const label = clean($(el).find(".pi-data-label").text());
        const value = clean($(el).find(".pi-data-value").text());
        if (!label || !value) return;

        const key = label
            .toLowerCase()
            .replace(/[^a-z0-9\u0600-\u06FF]/g, "_")
            .replace(/^_+|_+$/g, "");

        profile[key] = value;
    });

    // الصور
    const pageSlug = slug.toLowerCase();
    const imageSet = new Set();

    $("img, noscript img").each((_, img) => {
        let src =
            $(img).attr("data-src") ||
            $(img).attr("src");

        const srcset =
            $(img).attr("data-srcset") ||
            $(img).attr("srcset");

        if (!src && srcset) {
            src = srcset.split(",")[0].split(" ")[0];
        }

        if (!src) return;
        if (!src.includes("static.wikia.nocookie.net")) return;
        if (!src.toLowerCase().includes(pageSlug)) return;

        imageSet.add(
            src.split("/revision/")[0] + "/revision/latest"
        );
    });

    // استخراج معلومات إضافية
    const rarity = profile.rarity || profile.rarity_等級 || null;
    const element = profile.element || profile.attribute || profile.元素 || null;
    const weapon = profile.weapon || profile.武器 || null;
    const gender = profile.gender || profile.性別 || null;

    if (imageSet.size === 0) {
        // محاولة أوسع للصور
        $("img").each((_, img) => {
            const src = $(img).attr("src") || $(img).attr("data-src");
            if (src && src.includes("static.wikia.nocookie.net")) {
                imageSet.add(src.split("/revision/")[0] + "/revision/latest");
            }
        });
    }

    return {
        status: true,
        title,
        slug,
        url,
        bio,
        profile,
        rarity,
        element,
        weapon,
        gender,
        images: [...imageSet],
        imageCount: imageSet.size,
    };
}

export default scrapeWutheringWavesCharacter;
export { scrapeWutheringWavesCharacter };