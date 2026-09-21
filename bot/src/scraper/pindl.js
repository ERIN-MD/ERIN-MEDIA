import axios from "axios";
import * as cheerio from "cheerio";

const headers = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "ar,en;q=0.9",
  "User-Agent": "Mozilla/5.0 (compatible; Tarboo Bot/1.0)",
};

function normalizeUrl(value) {
  return String(value || "")
    .replaceAll("\\u002F", "/")
    .replaceAll("\\/", "/")
    .replaceAll("&amp;", "&")
    .replaceAll("\\u0026", "&")
    .replace(/["'\\]+$/, "");
}

function mediaFromHtml(html, limit = 10) {
  const escapedUrls = html.match(/https?:\\?\/\\?\/[^"'<>\s]+/g) || [];
  const plainUrls = html.match(/https?:\/\/[^"'<>\s]+/g) || [];
  const urls = [...new Set([...escapedUrls, ...plainUrls].map(normalizeUrl))];
  const videos = urls.filter((url) => /\.(?:mp4|m3u8)(?:[?&]|$)/i.test(url) || /\/videos?\//i.test(url));
  const images = urls.filter((url) => /(?:i\.pinimg\.com|pinimg\.com\/.+\.(?:jpe?g|png|webp|gif))/i.test(url));
  const selected = videos.length ? videos : images;

  return selected.slice(0, limit).map((url) => ({
    type: videos.length ? "video" : "image",
    quality: videos.length ? "Original" : "Original",
    extension: (url.match(/\.(mp4|m3u8|jpe?g|png|webp|gif)(?:[?&]|$)/i)?.[1] || (videos.length ? "mp4" : "jpg")).toUpperCase(),
    size: null,
    url,
  }));
}

async function scrapePinterest(pinUrl, options = {}) {
  try {
    const parsed = new URL(pinUrl);
    if (!/(^|\.)pinterest\.[a-z.]+$/i.test(parsed.hostname) && !/(^|\.)pin\.it$/i.test(parsed.hostname)) {
      throw new Error("رابط Pinterest غير صالح.");
    }

    const { data: html } = await axios.get(pinUrl, {
      headers,
      timeout: options.timeout || 30000,
      maxRedirects: 5,
    });
    const $ = cheerio.load(html);
    const title = $("meta[property='og:title']").attr("content") || $("title").text().trim() || "Pinterest";
    const description = $("meta[property='og:description']").attr("content") || "-";
    const cover = $("meta[property='og:image']").attr("content") || null;
    const media = mediaFromHtml(html, options.limit || 10);
    if (media.length === 0 && cover) {
      media.push({ type: "image", quality: "Original", extension: "JPG", size: null, url: normalizeUrl(cover) });
    }
    if (media.length === 0) throw new Error("لم يتم العثور على وسائط عامة في الصفحة.");

    return {
      title,
      description: description.trim() || "-",
      author: { name: null, username: null, avatar: null },
      stats: { likes: null, shares: null },
      media,
    };
  } catch (error) {
    console.error("Pinterest Error:", error.message);
    return null;
  }
}

export { mediaFromHtml };
export default scrapePinterest;
