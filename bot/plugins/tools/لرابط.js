import FormData from "form-data";
import fetch from "node-fetch";
import mime from "mime-types";
import { fileTypeFromBuffer } from "file-type";
import { downloadMediaMessage, getContentType } from "maro";
import te from "../../src/lib/maro-error.js";
import uploadImage from "../../src/scraper/imgdrop.js";

const pluginConfig = {
  name: "لرابط",
  alias: ["tourl"],
  category: "tools",
  description: "رفع الملفات إلى عدة سيرفرات والحصول على رابط",
  usage: ".لرابط (رد/إرسال ملف)",
  example: ".لرابط",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

const termaiKey = "AIzaBj7z2z3xBjsk";
const termaiDomain = "https://c.termai.cc";

async function detectExt(buffer, fallback = "bin") {
  try {
    const type = await fileTypeFromBuffer(buffer);
    return type?.ext || fallback;
  } catch {
    return fallback;
  }
}

// ═══════════════════════════════════
// 🏷️ جميع السيرفرات
// ═══════════════════════════════════

async function uploadToCatbox(buffer, filename) {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("fileToUpload", buffer, { filename, contentType: mime.lookup(filename) || "application/octet-stream" });
  const res = await fetch("https://catbox.moe/user/api.php", { method: "POST", body: form, headers: form.getHeaders(), timeout: 30000 });
  if (!res.ok) throw new Error("Catbox فشل");
  const url = await res.text();
  if (!url.startsWith("http")) throw new Error("استجابة غير صالحة");
  return { host: "Catbox", url, expires: "دائم" };
}

async function uploadToLitterbox(buffer, filename) {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("time", "72h");
  form.append("fileToUpload", buffer, { filename, contentType: mime.lookup(filename) || "application/octet-stream" });
  const res = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", { method: "POST", body: form, headers: form.getHeaders(), timeout: 30000 });
  if (!res.ok) throw new Error("Litterbox فشل");
  const url = await res.text();
  if (!url.startsWith("http")) throw new Error("استجابة غير صالحة");
  return { host: "Litterbox", url, expires: "72 ساعة" };
}

async function uploadToImgDrop(buffer, filename) {
  const data = await uploadImage(buffer, filename);
  if (!data.status || !data.url) throw new Error("ImgDrop فشل");
  return { host: "ImgDrop", url: data.url, expires: "غير معروف" };
}

async function uploadToQuax(buffer, filename) {
  const form = new FormData();
  form.append("file", buffer, { filename, contentType: mime.lookup(filename) || "application/octet-stream" });
  const res = await fetch("https://qu.ax/upload.php", { method: "POST", body: form, headers: form.getHeaders(), timeout: 60000 });
  if (!res.ok) throw new Error("Qu.ax فشل");
  const data = await res.json();
  if (!data?.success || !Array.isArray(data.files) || !data.files[0]?.url) throw new Error("استجابة غير صالحة");
  return { host: "Qu.ax", url: data.files[0].url, expires: "دائم" };
}

async function uploadToTermai(buffer) {
  const ext = await detectExt(buffer, "bin");
  const form = new FormData();
  form.append("file", buffer, { filename: `file.${ext}` });
  const res = await fetch(`${termaiDomain}/api/upload?key=${termaiKey}`, { method: "POST", body: form, headers: form.getHeaders(), timeout: 120000 });
  if (!res.ok) throw new Error("Termai فشل");
  const data = await res.json();
  if (!data?.status || !data?.path) throw new Error("استجابة غير صالحة");
  return { host: "Termai", url: data.path, expires: "غير معروف" };
}

async function uploadToPone(buffer, filename) {
  const form = new FormData();
  form.append("files[]", buffer, { filename, contentType: mime.lookup(filename) || "application/octet-stream" });
  const res = await fetch("https://pone.rs/upload.php", { method: "POST", body: form, headers: { ...form.getHeaders(), "user-agent": "Mozilla/5.0", "accept": "*/*", "origin": "https://pone.rs", "referer": "https://pone.rs/" }, timeout: 60000 });
  if (!res.ok) throw new Error("Pone فشل");
  const data = await res.json();
  const url = data?.files?.[0]?.url?.replaceAll("\\/", "/") || null;
  if (!data?.success || !url) throw new Error("استجابة غير صالحة");
  return { host: "Pone", url, expires: "دائم" };
}

async function uploadToKappa(buffer, filename) {
  const form = new FormData();
  form.append("file", buffer, { filename, contentType: mime.lookup(filename) || "application/octet-stream" });
  const res = await fetch("https://kappa.lol/api/upload", { method: "POST", body: form, headers: { ...form.getHeaders(), "User-Agent": "Mozilla/5.0", "Accept": "*/*", "Origin": "https://kappa.lol", "Referer": "https://kappa.lol/" }, timeout: 60000 });
  if (!res.ok) throw new Error("Kappa فشل");
  const raw = await res.text();
  const data = JSON.parse(raw);
  if (!data?.link) throw new Error("استجابة غير صالحة");
  return { host: "Kappa", url: data.link, expires: "دائم" };
}

async function uploadToUploadEe(buffer, filename) {
  const ext = (filename.match(/\.([^.]+)$/) || [])[1] || "bin";
  const imageExts = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg", "avif"];
  const isImage = imageExts.includes(ext.toLowerCase());
  const category = isImage ? "cat_picture" : "cat_file";
  const initRes = await fetch("https://www.upload.ee/?", { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 30000 });
  const rnd = Date.now();
  const idRes = await fetch(`https://www.upload.ee/ubr_link_upload.php?rnd_id=${rnd}`, { headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://www.upload.ee/?" }, timeout: 30000 });
  const idBody = await idRes.text();
  const idMatch = idBody.match(/startUpload\("([^"]+)"/);
  if (!idMatch) throw new Error("معرف الرفع غير موجود");
  const uploadId = idMatch[1];
  const form = new FormData();
  form.append("upfile_0", buffer, { filename, contentType: mime.lookup(filename) || "application/octet-stream" });
  form.append("link", ""); form.append("email", ""); form.append("category", category);
  form.append("big_resize", "none"); form.append("small_resize", "120x90");
  const uploadUrl = `https://www.upload.ee/cgi-bin/ubr_upload.pl?X-Progress-ID=${uploadId}&upload_id=${uploadId}`;
  await fetch(uploadUrl, { method: "POST", body: form, headers: { ...form.getHeaders(), "User-Agent": "Mozilla/5.0", "Origin": "https://www.upload.ee", "Referer": "https://www.upload.ee/?" }, timeout: 120000 });
  const finishedRes = await fetch(`https://www.upload.ee/?page=finished&upload_id=${uploadId}`, { headers: { "User-Agent": "Mozilla/5.0", "Referer": uploadUrl }, timeout: 30000 });
  const html = await finishedRes.text();
  const srcMatch = html.match(/id=["']file_src["'][^>]*value=["']([^"']+)["']/i);
  const viewMatch = html.match(/View file:\s*<br\s*\/?>\s*<a href=["']?([^"'>\s]+)["']?/i);
  const rawUrl = srcMatch?.[1] || viewMatch?.[1] || null;
  if (!rawUrl) throw new Error("Upload.ee فشل");
  let resultUrl = rawUrl.replaceAll("&amp;", "&").replaceAll("&quot;", '"');
  if (isImage) resultUrl = resultUrl.replace("/files/", "/image/").replace(/\.html$/, "");
  return { host: "Upload.ee", url: resultUrl, expires: "دائم" };
}

async function uploadToLeopard(buffer, filename) {
  const uploadPage = "https://leopard.hosting.pecon.us/upload.php";
  await fetch(uploadPage, { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 30000 });
  const form = new FormData();
  form.append("uploadContent", buffer, { filename, contentType: mime.lookup(filename) || "application/octet-stream" });
  form.append("password", ""); form.append("showname", "yes");
  const res = await fetch(uploadPage, { method: "POST", body: form, headers: { ...form.getHeaders(), "User-Agent": "Mozilla/5.0", "Origin": "https://leopard.hosting.pecon.us", "Referer": uploadPage }, timeout: 120000 });
  const html = await res.text();
  const match = html.match(/Download link:\s*<a href=([^>\s]+)>/i);
  if (!match?.[1]) throw new Error("Leopard فشل");
  return { host: "Leopard", url: match[1], expires: "دائم" };
}

async function uploadToUguu(buffer, filename) {
  const form = new FormData();
  form.append("files[]", buffer, { filename, contentType: mime.lookup(filename) || "application/octet-stream" });
  const res = await fetch("https://uguu.se/upload.php", { method: "POST", body: form, headers: { ...form.getHeaders(), "accept": "*/*", "origin": "https://uguu.se", "referer": "https://uguu.se/", "user-agent": "Mozilla/5.0" }, timeout: 120000 });
  if (!res.ok) throw new Error("Uguu فشل");
  const data = await res.json();
  if (!data?.success || !data?.files?.[0]?.url) throw new Error("استجابة غير صالحة");
  return { host: "Uguu", url: data.files[0].url, expires: "48 ساعة" };
}

async function uploadTo8upload(buffer, filename) {
  const form = new FormData();
  form.append("images[]", buffer, { filename, contentType: mime.lookup(filename) || "application/octet-stream" });
  const res = await fetch("https://8upload.com/upload/mt/", { method: "POST", body: form, headers: { ...form.getHeaders(), "accept": "application/json", "origin": "https://8upload.com", "referer": "https://8upload.com/", "x-requested-with": "XMLHttpRequest", "user-agent": "Mozilla/5.0" }, timeout: 120000 });
  let html = await res.text();
  const uploadPath = (typeof html === "string" && html.trim().startsWith("/uploads/")) ? html.trim() : (html.match(/\/uploads\/[a-zA-Z0-9]+/) || [])[0] || null;
  if (uploadPath) { const previewRes = await fetch(`https://8upload.com${uploadPath}`, { headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://8upload.com/" }, timeout: 30000 }); html = await previewRes.text(); }
  const urlMatch = (html || "").match(/https:\/\/i\.8upload\.com\/image\/[^'"<>\s]+/);
  if (!urlMatch?.[0]) throw new Error("8upload فشل");
  return { host: "8upload", url: urlMatch[0], expires: "دائم" };
}

// ═══════════════════════════════════
// 🆕 Top4top
// ═══════════════════════════════════
async function uploadToTop4top(buffer, filename) {
  const form = new FormData();
  form.append("file_0_", buffer, { filename, contentType: mime.lookup(filename) || "application/octet-stream" });
  form.append("submitr", "[ رفع الملفات ]");
  const res = await fetch("https://top4top.io/index.php", { method: "POST", body: form, headers: { ...form.getHeaders(), "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Referer": "https://top4top.io/", "Origin": "https://top4top.io" }, timeout: 30000 });
  const html = await res.text();
  const links = [...new Set((html.match(/https?:\/\/top4top\.io\/[^"\s]+/g) || []))].filter(l => l.includes('/p_'));
  if (!links.length) throw new Error("Top4top فشل");
  return { host: "Top4top", url: links[0], expires: "دائم" };
}

// ═══════════════════════════════════
// 🆕 TmpFiles
// ═══════════════════════════════════
async function uploadToTmpFiles(buffer, filename) {
  const form = new FormData();
  form.append("file", buffer, { filename, contentType: mime.lookup(filename) || "application/octet-stream" });
  const res = await fetch("https://tmpfiles.org/api/v1/upload", { method: "POST", body: form, headers: form.getHeaders(), timeout: 30000 });
  if (!res.ok) throw new Error("TmpFiles فشل");
  const data = await res.json();
  if (!data?.data?.url) throw new Error("استجابة غير صالحة");
  const direct = data.data.url.replace("https://tmpfiles.org/", "https://tmpfiles.org/dl/");
  return { host: "TmpFiles", url: direct, expires: "ساعة" };
}

async function uploadTo0x0(buffer, filename) {
  const form = new FormData();
  form.append("file", buffer, { filename, contentType: mime.lookup(filename) || "application/octet-stream" });
  const res = await fetch("https://0x0.st", { method: "POST", body: form, headers: form.getHeaders(), timeout: 30000 });
  if (!res.ok) throw new Error("0x0 فشل");
  const data = await res.json();
  if (!data?.files?.[0]?.url) throw new Error("استجابة غير صالحة");
  return { host: "0x0", url: data.files[0].url, expires: "60 دقيقة" };
}

// ═══════════════════════════════════
// 📋 قائمة الرفع (14 سيرفر)
// ═══════════════════════════════════
const ALL_UPLOADERS = [
  { name: "Catbox", fn: uploadToCatbox },
  { name: "Litterbox", fn: uploadToLitterbox },
  { name: "ImgDrop", fn: uploadToImgDrop },
  { name: "Qu.ax", fn: uploadToQuax },
  { name: "Pone", fn: uploadToPone },
  { name: "Kappa", fn: uploadToKappa },
  { name: "Uguu", fn: uploadToUguu },
  { name: "Top4top", fn: uploadToTop4top },
  { name: "TmpFiles", fn: uploadToTmpFiles },
  { name: "8upload", fn: uploadTo8upload },
  { name: "Leopard", fn: uploadToLeopard },
  { name: "Upload.ee", fn: uploadToUploadEe },
  { name: "Termai", fn: uploadToTermai },
  { name: "0x0", fn: uploadTo0x0 },
];

function getFileExtension(mimetype) {
  const mimeMap = {
    "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp",
    "video/mp4": "mp4", "video/3gpp": "3gp", "video/quicktime": "mov",
    "audio/mpeg": "mp3", "audio/ogg": "ogg", "audio/wav": "wav", "audio/mp4": "m4a",
    "application/pdf": "pdf", "application/zip": "zip",
  };
  return mimeMap[mimetype] || "bin";
}

async function handler(m, { sock }) {
  let media = null;
  let mimetype = null;
  let filename = "file";

  if (m.quoted?.message) {
    const type = getContentType(m.quoted.message);
    if (!type || type === "conversation" || type === "extendedTextMessage") {
      return m.reply("⚠️ من فضلك رد على ملف!");
    }
    try {
      media = await downloadMediaMessage({ key: m.quoted.key, message: m.quoted.message }, "buffer", {});
      const content = m.quoted.message[type];
      mimetype = content?.mimetype || "application/octet-stream";
      filename = content?.fileName || `file.${getFileExtension(mimetype)}`;
    } catch (e) {
      return m.reply(te(m.prefix, m.command, m.pushName));
    }
  } else if (m.message) {
    const type = getContentType(m.message);
    if (!type || type === "conversation" || type === "extendedTextMessage") {
      return m.reply(`📤 *رافع الملفات*\n\n${m.prefix}لرابط مع ملف أو رد على ملف`);
    }
    try {
      media = await downloadMediaMessage({ key: m.key, message: m.message }, "buffer", {});
      const content = m.message[type];
      mimetype = content?.mimetype || "application/octet-stream";
      filename = content?.fileName || `file.${getFileExtension(mimetype)}`;
    } catch (e) {
      return m.reply(te(m.prefix, m.command, m.pushName));
    }
  }

  if (!media || media.length === 0) {
    return m.reply("❌ لم أتمكن من قراءة الملف");
  }

  await m.react("🕕");

  const results = [];
  const failed = [];

  for (const uploader of ALL_UPLOADERS) {
    try {
      const result = await uploader.fn(media, filename);
      results.push(result);
    } catch (e) {
      failed.push(uploader.name);
    }
  }

  if (results.length === 0) {
    await m.react("❌");
    return m.reply(`❌ جميع السيرفرات فشلت!`);
  }

  let text = `🚀 *تم الرفع بنجاح!*\n\n`;
  results.forEach((r, i) => {
    text += `${i + 1}. ☁️ *${r.host}* (${r.expires})\n🔗 ${r.url}\n\n`;
  });

  if (failed.length > 0) {
    text += `⚠️ _فشل: ${failed.join(", ")}_`;
  }

  await m.reply(text);
  await m.react("✅");
}

export { pluginConfig as config, handler };