import assert from "node:assert/strict";
import axios from "axios";
import { RedditDL } from "../src/scraper/reddit.js";

const invalid = await RedditDL("https://example.com/post/abc");
assert.equal(invalid.status, false);

const originalGet = axios.get;
axios.get = async () => ({
  data: [{
    data: {
      children: [{
        data: {
          title: "اختبار Reddit",
          thumbnail: "https://preview.example.test/image.jpg",
          media: { reddit_video: { fallback_url: "https://video.example.test/video.mp4" } },
          gallery_data: { items: [{ media_id: "media-1" }] },
          media_metadata: { "media-1": { s: { u: "https://image.example.test/photo.jpg?x=1&amp;y=2" } } },
        },
      }],
    },
  }],
});

try {
  const result = await RedditDL("https://www.reddit.com/r/test/comments/abc123/example/", { limit: 2 });
  assert.equal(result.status, true);
  assert.equal(result.title, "اختبار Reddit");
  assert.equal(result.count, 2);
  assert.equal(result.results[0].type, "فيديو");
  assert.equal(result.results[1].download_url, "https://image.example.test/photo.jpg?x=1&y=2");
} finally {
  axios.get = originalGet;
}

console.log("reddit extractor tests: passed");
