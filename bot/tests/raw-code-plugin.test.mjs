import assert from "node:assert/strict";
import { handler } from "../plugins/owner/كود.js";

const codeBlocks = [];
await handler(
  {
    chat: "123@g.us",
    quoted: {
      message: {
        interactiveResponseMessage: {
          nativeFlowResponseMessage: { paramsJson: '{"id":"menu_test"}' },
          apiKey: "must-not-appear",
        },
      },
    },
    key: { id: "short-raw-code-test" },
  },
  {
    sock: {
      async sendCodeBlock(chat, code, quoted, options) {
        codeBlocks.push({ chat, code, quoted, options });
      },
    },
  },
);
assert.equal(codeBlocks.length, 1);
assert.equal(codeBlocks[0].chat, "123@g.us");
assert.match(codeBlocks[0].code, /interactiveResponseMessage/);
assert.match(codeBlocks[0].code, /\[REDACTED\]/);
assert.equal(codeBlocks[0].options.language, "json");
assert.match(codeBlocks[0].options.title, /interactiveResponseMessage/);
assert.equal(codeBlocks[0].options.footer, "Tarboo Bot");

const documents = [];
await handler(
  {
    chat: "123@g.us",
    quoted: { message: { extendedTextMessage: { text: "a".repeat(5000) } } },
    async reply() {
      throw new Error("لا يجب استخدام الرد النصي للمخرج الطويل");
    },
  },
  {
    sock: {
      async sendMessage(chat, content) {
        documents.push({ chat, content });
      },
    },
  },
);
assert.equal(documents.length, 1);
assert.equal(documents[0].content.mimetype, "application/json");
assert.match(documents[0].content.fileName, /\.json$/);

console.log("raw code plugin tests: passed");
