import { getContentType } from "maro";

const SHORT_OUTPUT_LIMIT = 3500;
const REDACTED = "[REDACTED]";
const SENSITIVE_KEY = /(?:^|_|-)(?:authorization|auth|token|secret|password|cookie|api[_-]?key|private[_-]?key)(?:$|_|-)/i;

const pluginConfig = {
  name: "كود",
  alias: ["code", "json", "raw", "استخراج_كود"],
  category: "owner",
  description: "استخراج البنية الخام لرسالة واتساب وإرسالها بصيغة JSON",
  usage: ".كود بالرد على أي رسالة",
  example: ".كود (رداً على رسالة تفاعلية)",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

function normalizeForJson(value, seen = new WeakSet()) {
  if (typeof value === "bigint") return value.toString();
  if (Buffer.isBuffer(value)) return `[Buffer ${value.length} bytes]`;
  if (value instanceof Uint8Array) return `[Uint8Array ${value.length} bytes]`;
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (Array.isArray(value)) return value.map((item) => normalizeForJson(item, seen));

  const normalized = {};
  for (const [key, item] of Object.entries(value)) {
    normalized[key] = SENSITIVE_KEY.test(key)
      ? REDACTED
      : normalizeForJson(item, seen);
  }
  return normalized;
}

function buildPayload(m) {
  const rawMessage = m.quoted?.message || m.message;
  if (!rawMessage) return null;

  return {
    extractedAt: new Date().toISOString(),
    source: m.quoted ? "quoted_message" : "current_message",
    messageType: getContentType(rawMessage) || "unknown",
    message: normalizeForJson(rawMessage),
  };
}

async function handler(m, { sock }) {
  const payload = buildPayload(m);
  if (!payload) {
    return m.reply(
      "⚠️ لم أجد رسالة لاستخراجها. رد على أي رسالة ثم أرسل الأمر *.كود*.",
    );
  }

  const json = JSON.stringify(payload, null, 2);
  const fileName = `marobot-raw-${payload.messageType}-${Date.now()}.json`;

  if (json.length > SHORT_OUTPUT_LIMIT) {
    return sock.sendMessage(
      m.chat,
      {
        document: Buffer.from(json, "utf8"),
        mimetype: "application/json",
        fileName,
        caption: `📄 البنية الخام للرسالة: *${payload.messageType}*\n> Tarboo Bot`,
      },
      { quoted: m },
    );
  }

  return sock.sendCodeBlock(
    m.chat,
    json,
    m,
    {
      language: "json",
      title: `🔍 JSON الخام — ${payload.messageType}`,
      footer: "Tarboo Bot",
    },
  );
}

export { pluginConfig as config, handler, normalizeForJson, buildPayload };