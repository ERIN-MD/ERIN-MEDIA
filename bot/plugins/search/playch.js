import crypto from "crypto";
import axios from "axios";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import yts from "yt-search";
import config from "../../config.js";
import te from "../../src/lib/maro-error.js";
import { saluranCtx } from "../../src/lib/maro-context.js";
import ytdl, { fallbackToMp3Buffer } from "../../src/scraper/ytdl.js";

const run = promisify(exec);

// ═══════════════════════════════════════════════
// 🛠️ دوال مساعدة
// ═══════════════════════════════════════════════
function pickVideo(search) {
  const v = search?.videos || [];
  return v.find((x) => x.seconds && x.seconds < 900) || v[0] || null;
}

function formatViews(n) {
  if (!n) return "0";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toString();
}

async function getPlayChAudioDownload(url) {
  try {
    const apiUrl = `https://api.cuki.biz.id/api/downloader/ytmp3?apikey=${config.APIkey.cuki}&url=${encodeURIComponent(url)}&quality=128`;
    const res = await axios.get(apiUrl, { timeout: 30000 });
    const data = res.data;
    if (data.success && data.data?.audio?.download?.downloadUrl) {
      return { download: data.data.audio.download.downloadUrl, title: data.data.metadata?.title || "Audio" };
    }
  } catch (err) {}

  const fallback = await ytdl(url, "mp3");
  if (fallback?.status && fallback?.dl) {
    return { download: fallback.dl, title: fallback.title, isFallback: true };
  }
  throw new Error(fallback?.mess || "فشل الحصول على الصوت");
}

async function toOggOpus(mp3Buf) {
  const tmp = path.join(process.cwd(), "temp");
  if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
  const id = crypto.randomBytes(6).toString("hex");
  const inp = path.join(tmp, `in_${id}.mp3`);
  const out = path.join(tmp, `out_${id}.ogg`);
  fs.writeFileSync(inp, mp3Buf);
  await run(`ffmpeg -y -i "${inp}" -vn -map_metadata -1 -ac 1 -ar 48000 -c:a libopus -b:a 96k -vbr on -application audio -f ogg "${out}"`);
  const buf = fs.readFileSync(out);
  try { fs.unlinkSync(inp); } catch {}
  try { fs.unlinkSync(out); } catch {}
  return buf;
}

function generateWaveform(audioBuf, samples = 64) {
  const waveform = new Uint8Array(samples);
  const chunkSize = Math.floor(audioBuf.length / samples);
  for (let i = 0; i < samples; i++) {
    const offset = i * chunkSize;
    let sum = 0;
    const len = Math.min(chunkSize, audioBuf.length - offset);
    for (let j = 0; j < len; j++) sum += Math.abs(audioBuf[offset + j] - 128);
    waveform[i] = Math.min(255, Math.floor((sum / len) * 2.5));
  }
  return waveform;
}

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "playch",
  alias: ["pch"],
  category: "search",
  description: "تشغيل موسيقى في القناة",
  usage: ".playch <بحث> أو .playch --idch <id> <بحث>",
  example: ".playch komang",
  cooldown: 15, energi: 1, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎵 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const raw = m.text?.trim() || "";
  let chId = config?.saluran?.id;
  let chName = config?.saluran?.name || config?.bot?.name || "Tarboo Bot";
  let q = raw;

  const idchMatch = raw.match(/--idch\s+(\S+)/);
  if (idchMatch) {
    chId = idchMatch[1];
    chName = chId;
    q = raw.replace(/--idch\s+\S+/, "").trim();
  }

  if (!q) return m.reply(`🎵 *Play Channel*\n\n\`${m.prefix}playch <اسم الأغنية>\``);
  if (!chId) return m.reply(`❌ القناة غير مضبوطة`);

  m.react("🔎");
  try {
    const { videos } = await yts(q);
    const video = pickVideo({ videos });
    if (!video) return m.reply(`❌ لم يتم العثور على فيديو`);

    let info = `🎵 *جاري التشغيل*\n\n`;
    info += `📌 *العنوان:* ${video.title}\n`;
    info += `👤 القناة: *${video.author?.name || "غير معروف"}*\n`;
    info += `⏱️ المدة: *${video.duration.timestamp}*\n`;
    info += `👀 المشاهدات: *${formatViews(video.views)}*\n`;
    info += `🔗 ${video.url}\n\n`;
    info += `_⏳ جاري إرسال الصوت للقناة..._`;

    await sock.sendMedia(m.chat, video.thumbnail, info, m, { type: "image" });

    const audio = await getPlayChAudioDownload(video.url);
    m.react("🎵");

    const mp3Buf = audio.isFallback
      ? await fallbackToMp3Buffer(audio.download)
      : Buffer.from((await axios.get(audio.download, { responseType: "arraybuffer", timeout: 60000 })).data);

    if (mp3Buf.length < 50000) throw new Error("الصوت صغير جداً");

    const opusBuf = await toOggOpus(mp3Buf);
    if (opusBuf.length < 10000) throw new Error("فشل تحويل opus");

    const waveform = generateWaveform(opusBuf);
    await sock.sendMessage(chId, {
      audio: opusBuf,
      mimetype: "audio/ogg; codecs=opus",
      ptt: true,
      waveform: Array.from(waveform),
    });

    m.react("✅");
    m.reply(`✅ *${video.title}* تم إرساله للقناة`);
  } catch (e) {
    console.error("[PlayCh]", e);
    m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };