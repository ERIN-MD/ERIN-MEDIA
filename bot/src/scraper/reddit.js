import axios from "axios";

function decodeUrl(url) {
  return String(url || "").replaceAll("&amp;", "&");
}

function getPostId(redditUrl) {
  try {
    const parsed = new URL(redditUrl);
    const shortMatch = parsed.hostname.toLowerCase().endsWith("redd.it") && parsed.pathname.match(/^\/([a-z0-9]+)\/?$/i);
    const commentMatch = parsed.pathname.match(/\/comments\/([a-z0-9]+)/i);
    return shortMatch?.[1] || commentMatch?.[1] || null;
  } catch {
    return null;
  }
}

function collectMedia(post, limit) {
  const results = [];
  const add = (type, downloadUrl, thumbnail = null) => {
    if (!downloadUrl || (limit && results.length >= limit)) return;
    results.push({ item: results.length + 1, type, thumbnail: decodeUrl(thumbnail) || null, download_url: decodeUrl(downloadUrl) });
  };

  const video = post?.media?.reddit_video || post?.secure_media?.reddit_video;
  if (video?.fallback_url) {
    add("فيديو", video.fallback_url, post?.thumbnail);
  }

  const galleryItems = post?.gallery_data?.items || [];
  for (const galleryItem of galleryItems) {
    const media = post?.media_metadata?.[galleryItem.media_id];
    add("صورة", media?.s?.u || media?.s?.gif || media?.s?.mp4, media?.p?.at(-1)?.u || media?.s?.u);
  }

  if (results.length === 0) {
    const direct = post?.url_overridden_by_dest || post?.url;
    if (/\.(?:jpe?g|png|webp|gif)(?:\?|$)/i.test(direct || "")) add("صورة", direct, post?.thumbnail);
  }

  return results;
}

async function RedditDL(redditUrl, options = {}) {
  const postId = getPostId(redditUrl);
  if (!postId) {
    return { status: false, error: "رابط Reddit غير صالح أو لا يحتوي على معرف منشور.", url: redditUrl };
  }

  try {
    const { data } = await axios.get(`https://www.reddit.com/comments/${postId}.json`, {
      params: { raw_json: 1 },
      timeout: options.timeout || 30000,
      headers: {
        Accept: "application/json",
        "User-Agent": "Tarboo Bot/1.0 (public Reddit media reader)",
      },
    });
    const post = Array.isArray(data) ? data[0]?.data?.children?.[0]?.data : data?.data?.children?.[0]?.data;
    if (!post) return { status: false, error: "لم يعُد Reddit ببيانات المنشور.", url: redditUrl };

    const results = collectMedia(post, options.limit);
    if (results.length === 0) return { status: false, error: "لم يتم العثور على وسائط قابلة للإرسال.", url: redditUrl };

    return {
      status: true,
      title: post.title || "ريديت",
      count: results.length,
      results,
      url: redditUrl,
    };
  } catch (error) {
    return { status: false, error: error.response?.status ? `تعذر الوصول إلى Reddit (HTTP ${error.response.status}).` : error.message, url: redditUrl };
  }
}

export { RedditDL };
