import axios from "axios";
import { withProviderHealth } from "../lib/maro-provider-health.js";

const DEFAULT_ENDPOINTS = {
  meta: "https://spotify.dlapi.app/api/Gettrack",
  convert: "https://master.dlapi.app/api/v1/convert",
  task: "https://master.dlapi.app/api/v1/tasks",
};

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

class SpotifyDL {
  constructor(options = {}) {
    this.token = options.token || process.env.SPOTIFY_DL_API_TOKEN || "";
    this.api = {
      meta: options.metaUrl || process.env.SPOTIFY_DL_META_URL || DEFAULT_ENDPOINTS.meta,
      convert: options.convertUrl || process.env.SPOTIFY_DL_CONVERT_URL || DEFAULT_ENDPOINTS.convert,
      task: options.taskUrl || process.env.SPOTIFY_DL_TASK_URL || DEFAULT_ENDPOINTS.task,
    };
    this.timeout = Number(options.timeout || process.env.SPOTIFY_DL_TIMEOUT_MS || 30000);
    this.pollInterval = Number(options.pollInterval || process.env.SPOTIFY_DL_POLL_MS || 3000);
    this.maxPolls = Number(options.maxPolls || process.env.SPOTIFY_DL_MAX_POLLS || 60);
    this.client = axios.create({
      timeout: this.timeout,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Tarboo Bot/SpotifyDL",
      },
    });
  }

  valid(url) {
    return /^(https?:\/\/)?(open\.)?spotify\.com\/(track|album|playlist|artist)\/[a-zA-Z0-9]+/i.test(String(url || ""));
  }

  ensureToken() {
    if (!this.token) {
      throw new Error("مزود Spotify يحتاج متغير البيئة SPOTIFY_DL_API_TOKEN.");
    }
  }

  authHeaders() {
    return { Authorization: `Bearer ${this.token}` };
  }

  async meta(url) {
    this.ensureToken();
    const { data } = await withProviderHealth("spotify-meta", () => this.client.get(this.api.meta, {
      params: { spotify_url: url },
      headers: this.authHeaders(),
    }));
    if (!data) throw new Error("لم يعُد مزود Spotify ببيانات المسار.");
    return data;
  }

  async convert(url, format = "mp3") {
    this.ensureToken();
    const { data: initial } = await withProviderHealth("spotify-convert", () => this.client.post(
      this.api.convert,
      { url, format },
      { headers: this.authHeaders() },
    ));
    if (initial?.download_url) return initial.download_url;

    const taskId = initial?.task_id || initial?.id;
    if (!taskId) throw new Error("لم يُرجع مزود Spotify رابط تحميل أو معرّف مهمة.");

    for (let attempt = 0; attempt < this.maxPolls; attempt += 1) {
      await sleep(this.pollInterval);
      const { data: task } = await this.client.get(`${this.api.task}/${encodeURIComponent(taskId)}`, {
        headers: this.authHeaders(),
      });
      if (task?.status === "finished" || task?.status === "completed") {
        const downloadUrl = task?.result?.download_url || task?.download_url;
        if (downloadUrl) return downloadUrl;
        throw new Error("اكتملت مهمة Spotify لكن رابط التحميل غير موجود.");
      }
      if (task?.status === "failed" || task?.status === "error") {
        throw new Error(task?.message || "فشلت مهمة تحويل Spotify لدى المصدر.");
      }
    }
    throw new Error("انتهت مهلة انتظار مهمة تحويل Spotify.");
  }

  async download({ url, format = "mp3" } = {}) {
    if (!this.valid(url)) throw new Error("رابط Spotify غير صالح.");
    const data = await this.meta(url);
    const targetUrl = data?.external_urls?.spotify || data?.url || url;
    const downloadUrl = await this.convert(targetUrl, format);
    return {
      title: data?.name || "Spotify",
      artist: Array.isArray(data?.artists) ? data.artists.map((artist) => artist?.name).filter(Boolean).join(", ") : "",
      album: data?.album?.name || "",
      duration: data?.duration_ms || 0,
      cover: data?.album?.images?.[0]?.url || null,
      download: downloadUrl,
    };
  }
}

async function downloadSpotify(spotifyUrl, options = {}) {
  const client = new SpotifyDL(options);
  return client.download({ url: spotifyUrl, format: options.format || "mp3" });
}

export { SpotifyDL, downloadSpotify };
export default downloadSpotify;
