import axios from "axios";

const BASE_URL = "https://api-mobi.soundcloud.com/search";
const SOUNDCLOUD_CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID || "";

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

async function searchSoundCloud(query) {
  if (!SOUNDCLOUD_CLIENT_ID) {
    return { success: false, query, status: 503, message: "SOUNDCLOUD_CLIENT_ID غير مضبوط" };
  }
  try {
    const res = await axios.get(BASE_URL, {
      params: {
        q: query,
        client_id: SOUNDCLOUD_CLIENT_ID,
        stage: "",
      },
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.1",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
      },
    });

    const items = res.data?.collection || [];

    const results = items.map((track) => ({
      id: track.id,
      title: track.title,
      artist: track.user?.username || null,
      duration_ms: track.duration,
      duration: formatDuration(track.duration),
      url: track.permalink_url,
      artwork: track.artwork_url,
      genre: track.genre || null,
      plays: track.playback_count || 0,
      likes: track.likes_count || 0,
    }));

    return {
      success: true,
      query,
      total: results.length,
      results,
    };
  } catch (err) {
    return {
      success: false,
      query,
      status: err.response?.status || 500,
      message: err.message,
    };
  }
}

export default searchSoundCloud;
