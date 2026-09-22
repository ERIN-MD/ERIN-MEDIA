import assert from "node:assert/strict";
import { withFooter, sendAiCard, sendAiDocument, sendAiMedia, sendAiText } from "../src/lib/maro-ai-output.js";

const replies = [];
const sent = [];
const message = { chat: "test@s.whatsapp.net", reply: async (text, options) => replies.push({ text, options }) };
const sock = { sendMessage: async (chat, payload, options) => sent.push({ chat, payload, options }) };

assert.match(withFooter("نص"), /> Tarboo Bot$/);
assert.equal((withFooter("> Tarboo Bot").match(/Tarboo Bot/g) || []).length, 1);
await sendAiText(message, "رسالة");
await sendAiCard(message, { title: "بطاقة", body: "تفاصيل", hint: "متابعة" });
await sendAiMedia(sock, message, { image: Buffer.from("x") }, "صورة");
await sendAiDocument(sock, message, Buffer.from("x"), { fileName: "report.txt", caption: "تقرير" });

assert.equal(replies.length, 2);
assert.match(replies[1].text, /بطاقة/);
assert.equal(sent.length, 2);
assert.equal(sent[1].payload.fileName, "report.txt");
assert.match(sent[1].payload.caption, /Tarboo Bot/);
console.log("maro ai output tests: passed");
