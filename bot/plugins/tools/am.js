import axios from "axios";
import crypto from "node:crypto";
import { CookieJar } from "tough-cookie";
import te from "../../src/lib/maro-error.js";
import cfg from "../../config.js";

const config = {
  name: "الايت_موشن",
  alias: ["am", "alight", "موشن"],
  category: "tools",
  description: "تفعيل بريميوم Alight Motion",
  usage: ".الايت_موشن <ايميل> | .الايت_موشن تفعيل <ايميل> <رابط>",
  example: ".الايت_موشن user@gmail.com",
  cooldown: 30,
  energi: 1,
  isEnabled: true,
};

const BASE_URL = "https://www.alightpro.my.id";
const SECRET_KEY = "amprem-super-secret-key-2026-v2";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const REFERER = "https://www.alightpro.my.id/";
const ORIGIN = "https://www.alightpro.my.id";

function createClient() {
  const jar = new CookieJar();

  const client = axios.create({
    timeout: 60000,
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent": UA,
      Referer: REFERER,
      Origin: ORIGIN,
    },
  });

  client.interceptors.request.use(async (req) => {
    const cookieHeader = await jar.getCookieString(req.url);
    if (cookieHeader) {
      req.headers.Cookie = cookieHeader;
    }
    return req;
  });

  client.interceptors.response.use(async (res) => {
    const setCookies = res.headers["set-cookie"];
    if (setCookies) {
      for (const cookie of setCookies) {
        await jar.setCookie(cookie, res.config.url);
      }
    }
    return res;
  });

  return client;
}

function generatePow(email, action, nonce, timestamp, sessionId) {
  const inputStr = `${email.toLowerCase()}:${action}:${nonce}:${timestamp}:${sessionId}:${SECRET_KEY}`;
  return crypto.createHash("sha256").update(inputStr).digest("hex");
}

async function getSession(client) {
  await client.get(`${BASE_URL}/`);

  const res = await client.get(`${BASE_URL}/api/session`);
  const data = res.data;

  if (!data.status || !data.token || !data.nonce) {
    throw new Error(data.msg || `فشل جلب الجلسة: ${JSON.stringify(data)}`);
  }

  return {
    token: data.token,
    nonce: data.nonce,
    sessionId: data.sessionId,
    timestamp: data.timestamp,
  };
}

async function sendMagicLink(email) {
  const client = createClient();
  const session = await getSession(client);
  const pow = generatePow(email, "send", session.nonce, session.timestamp, session.sessionId);

  const res = await client.post(
    `${BASE_URL}/api/alight-motion`,
    { action: "send", email },
    {
      headers: {
        "X-Amprem-Token": session.token,
        "X-Amprem-Nonce": session.nonce,
        "X-Amprem-Pow": pow,
      },
    },
  );

  return {
    message: res.data.msg || "تم إرسال الرابط بنجاح",
  };
}

async function verifyMagicLink(email, rawLink) {
  const client = createClient();
  const session = await getSession(client);
  const pow = generatePow(email, "verify", session.nonce, session.timestamp, session.sessionId);

  const res = await client.post(
    `${BASE_URL}/api/alight-motion`,
    { action: "verify", email, link: rawLink },
    {
      headers: {
        "X-Amprem-Token": session.token,
        "X-Amprem-Nonce": session.nonce,
        "X-Amprem-Pow": pow,
      },
    },
  );

  return {
    message: "تم تفعيل الحساب بنجاح",
    data: res.data?.data || null,
  };
}

async function handler(m, { args }) {
  const text = args.join(" ").trim();

  if (!text) {
    return m.reply(
      `🎬 *تفعيل Alight Motion بريميوم*\n\n` +
        `*الخطوة 1:* \`${m.prefix}الايت_موشن <ايميل>\`\n` +
        `*الخطوة 2:* \`${m.prefix}الايت_موشن تفعيل <ايميل> <رابط>\`\n\n` +
        `📌 *طريقة جلب الرابط:*\n` +
        `1. افتح الايميل (تأكد من spam)\n` +
        `2. ابحث عن "Alight Motion" أو "Alight Creative"\n` +
        `3. اضغط مطولاً على "تسجيل الدخول"، اختر "نسخ الرابط"\n` +
        `4. لا تفتح الرابط مباشرة - انسخه فقط\n` +
        `5. أرسل: \`${m.prefix}الايت_موشن تفعيل ايميلك@example.com <الرابط>\``,
    );
  }

  m.react("🕕");

  try {
    if (args[0]?.toLowerCase() === "تفعيل") {
      const email = args[1];
      const rawLink = args.slice(2).join(" ");

      if (!email || !rawLink) {
        m.react("❌");
        return m.reply(
          `❌ *صيغة خاطئة*\nاستخدم: \`${m.prefix}الايت_موشن تفعيل <ايميل> <رابط>\``,
        );
      }

      const result = await verifyMagicLink(email, rawLink);

      m.react("✅");
      return m.reply(
        `✅ *تم تفعيل Alight Motion بريميوم*\n\n` +
          `📧 *الايميل:* ${email}\n` +
          `⏳ *المدة:* سنة كاملة\n` +
          `📝 *الحالة:* ${result.message}\n\n` +
          `_سجل دخولك في تطبيق Alight Motion بهذا الايميل._`,
      );
    }

    const email = args[0];
    const result = await sendMagicLink(email);

    m.react("✅");
    return m.reply(
      `📩 *تم إرسال رابط التفعيل*\n\n` +
        `📧 *الايميل:* ${email}\n` +
        `📝 *الحالة:* ${result.message}\n\n` +
        `*الخطوة التالية:*\n` +
        `1. افتح الايميل (تأكد من spam)\n` +
        `2. ابحث عن "Alight Motion" أو "Alight Creative"\n` +
        `3. اضغط مطولاً على "تسجيل الدخول"، اختر "نسخ الرابط"\n` +
        `4. لا تفتح الرابط مباشرة - انسخه فقط\n` +
        `5. أرسل: \`${m.prefix}الايت_موشن تفعيل ${email} <الرابط>\``,
    );
  } catch (e) {
    console.log("خطأ Alight Motion:", e.response?.data || e.message);
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { config, handler };