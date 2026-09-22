import assert from "node:assert/strict";
import { SpotifyDL } from "../src/scraper/spotify.js";

const provider = new SpotifyDL({ token: "" });
assert.equal(provider.valid("https://open.spotify.com/track/1XabvPK1VQEH4YqzDovs46"), true);
assert.equal(provider.valid("https://example.com/track/123"), false);
await assert.rejects(
  provider.download({ url: "https://open.spotify.com/track/1XabvPK1VQEH4YqzDovs46" }),
  /SPOTIFY_DL_API_TOKEN/,
);

const directProvider = new SpotifyDL({ token: "test-token" });
directProvider.client = {
  get: async () => ({ data: { name: "Track", artists: [{ name: "Artist" }], album: { name: "Album", images: [] } } }),
  post: async () => ({ data: { download_url: "https://cdn.example.test/track.mp3" } }),
};
const direct = await directProvider.download({ url: "https://open.spotify.com/track/1XabvPK1VQEH4YqzDovs46" });
assert.equal(direct.title, "Track");
assert.equal(direct.artist, "Artist");
assert.equal(direct.download, "https://cdn.example.test/track.mp3");

let taskChecks = 0;
const taskProvider = new SpotifyDL({ token: "test-token", pollInterval: 0, maxPolls: 2 });
taskProvider.client = {
  post: async () => ({ data: { task_id: "task-1" } }),
  get: async () => {
    taskChecks += 1;
    return { data: { status: "completed", result: { download_url: "https://cdn.example.test/task.mp3" } } };
  },
};
assert.equal(await taskProvider.convert("https://open.spotify.com/track/1XabvPK1VQEH4YqzDovs46"), "https://cdn.example.test/task.mp3");
assert.equal(taskChecks, 1);
console.log("spotify provider tests: passed");
