import assert from "node:assert/strict";

const { default: sharp } = await import("sharp");
const pixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVR4nGNgYGAAAAAEAAH2FzhVAAAAAElFTkSuQmCC", "base64");
const output = await sharp(pixel).resize(16, 16).png().toBuffer();
const metadata = await sharp(output).metadata();

assert.equal(metadata.width, 16);
assert.equal(metadata.height, 16);
console.log("local image enhancement dependency: passed");
