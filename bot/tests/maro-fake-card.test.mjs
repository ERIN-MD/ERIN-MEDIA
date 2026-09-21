import assert from "node:assert/strict";
import { fakeCardImage } from "../src/lib/maro-fake-card.js";

const card = (await fakeCardImage({ title: "FREE FIRE", name: "<مالك>" })).toString("utf8");
assert.match(card, /FREE FIRE/);
assert.match(card, /&lt;مالك&gt;/);
assert.doesNotMatch(card, /<مالك>/);
const pixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVR4nGNgYGAAAAAEAAH2FzhVAAAAAElFTkSuQmCC", "base64");
const withAvatar = (await fakeCardImage({ title: "DEVELOPER", name: "Tarboo Bot", avatarBuffer: pixel })).toString("utf8");
assert.match(withAvatar, /data:image\/png;base64,/);
console.log("local fake card tests: passed");
