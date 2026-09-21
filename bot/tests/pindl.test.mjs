import assert from "node:assert/strict";
import { mediaFromHtml } from "../src/scraper/pindl.js";

const videoHtml = '<script>window.pin={"url":"https:\\/\\/video.example.test\\/clips\\/pin.mp4?x=1\\u0026y=2"}</script>';
const video = mediaFromHtml(videoHtml);
assert.equal(video.length, 1);
assert.equal(video[0].type, "video");
assert.equal(video[0].url, "https://video.example.test/clips/pin.mp4?x=1&y=2");

const imageHtml = '<meta property="og:image" content="https://i.pinimg.com/originals/a/b/c/pin.jpg">';
const image = mediaFromHtml(imageHtml);
assert.equal(image.length, 1);
assert.equal(image[0].type, "image");
assert.equal(image[0].extension, "JPG");

console.log("pinterest extractor tests: passed");
