// ==============================================
// 🎯 أمر: تحويل الفيديو إلى نص (Transcript)
// ==============================================
// 📌 الوصف: يستخدم AssemblyAI + Cobalt API
// 📌 الاستخدام: .transcribe <رابط الفيديو>
// 📌 مثال: .transcribe https://youtube.com/watch?v=...
// ==============================================

import axios from "axios";
import config from "../../config.js";

// ==============================================
// 🔑 مفتاح AssemblyAI (من الإعدادات)
// ==============================================
const ASSEMBLYAI_KEY = config.assemblyai?.apiKey || process.env.ASSEMBLYAI_KEY || "b6d6101e7ded44a6921bc5a8146765a1";

// ==============================================
// 📋 إعدادات الأمر (pluginConfig)
// ==============================================
const pluginConfig = {
  name: "transcribe",
  alias: ["نص_فيديو", "تحويل_صوت", "ترجمة_فيديو"],
  category: "tools",
  description: "تحويل الفيديو إلى نص مكتوب",
  usage: ".transcribe <رابط الفيديو>",
  example: ".transcribe https://youtube.com/watch?v=VIDEO_ID",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 15,
  isEnabled: true,
};

// ==============================================
// 🧠 الدالة الرئيسية (handler)
// ==============================================
async function handler(m, { sock, text, pushName, db }) {
  // 1️⃣ التأكد من وجود رابط
  if (!text) {
    return m.reply(
      `🎯 *تحويل الفيديو إلى نص*\n━━━━━━━━━━━━━━━━━━\n❓ أدخل رابط الفيديو.\n\n📌 مثال:\n.transcribe https://youtube.com/watch?v=VIDEO_ID\n━━━━━━━━━━━━━━━━━━`
    );
  }

  // استخراج الرابط من النص
  const url = text.match(/(https?:\/\/[^\s]+)/)?.[0];
  if (!url) {
    return m.reply(`❌ *رابط غير صالح*\n\n📌 تأكد من إدخال رابط صحيح.`);
  }

  // 2️⃣ إرسال رسالة انتظار
  const waitMsg = await m.reply(`⏳ *جاري تحميل الفيديو وتحويله إلى نص...*\n\n🔄 قد يستغرق هذا بضع دقائق.`);

  try {
    // 3️⃣ تحميل الصوت عبر Cobalt API
    const cobaltRes = await axios.post(
      "https://cobalt-api-production-cd7d.up.railway.app/",
      { url },
      {
        headers: { Accept: "application/json" },
        timeout: 30000,
      }
    );

    const audioUrl = cobaltRes.data?.url;
    if (!audioUrl) {
      throw new Error("فشل تحميل الصوت من الفيديو.");
    }

    // 4️⃣ إرسال الصوت إلى AssemblyAI
    const transcriptRes = await axios.post(
      "https://api.assemblyai.com/v2/transcript",
      {
        audio_url: audioUrl,
        speaker_labels: true,
        language_code: "ar", // يفضل العربية، لكنه يتعرف تلقائياً
      },
      {
        headers: {
          Authorization: ASSEMBLYAI_KEY,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const taskId = transcriptRes.data?.id;
    if (!taskId) {
      throw new Error("فشل إرسال الطلب إلى خدمة التحويل.");
    }

    // 5️⃣ الانتظار حتى اكتمال التحويل (Polling)
    let result = null;
    let attempts = 0;
    const maxAttempts = 45; // 45 × 3 ثواني = 135 ثانية (2.25 دقيقة)

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      attempts++;

      const pollRes = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${taskId}`,
        {
          headers: { Authorization: ASSEMBLYAI_KEY },
          timeout: 10000,
        }
      );

      result = pollRes.data;

      if (result.status === "completed") {
        break;
      }
      if (result.status === "error") {
        throw new Error(result.error || "حدث خطأ أثناء التحويل.");
      }
    }

    if (!result || result.status !== "completed") {
      throw new Error("انتهت المهلة. الفيديو طويل جداً أو الخدمة بطيئة.");
    }

    // 6️⃣ تنسيق النتيجة
    const transcriptText = result.text || "لا يوجد نص مستخرج.";
    const duration = Math.round(result.audio_duration || 0);
    const language = result.language_code || "غير معروف";
    const wordCount = result.words?.length || 0;

    // قص النص إذا كان طويلاً جداً
    let displayText = transcriptText;
    if (displayText.length > 4000) {
      displayText = displayText.substring(0, 3997) + "...";
    }

    const replyText =
      `📝 *نص الفيديو*\n━━━━━━━━━━━━━━━━━━\n${displayText}\n━━━━━━━━━━━━━━━━━━\n` +
      `📊 *المدة:* ${duration} ثانية\n` +
      `🌐 *اللغة:* ${language}\n` +
      `📝 *عدد الكلمات:* ${wordCount}\n` +
      `🔗 *الرابط:* ${url}`;

    // 7️⃣ إرسال النتيجة
    await sock.sendMessage(m.chat, {
      text: replyText,
      edit: waitMsg.key,
    });

    // 8️⃣ حفظ النص في قاعدة البيانات (اختياري)
    if (db && m.sender) {
      if (!db.users[m.sender]) db.users[m.sender] = {};
      if (!db.users[m.sender].transcripts) db.users[m.sender].transcripts = [];
      db.users[m.sender].transcripts.push({
        url: url,
        text: transcriptText,
        duration: duration,
        language: language,
        date: new Date().toISOString(),
      });
      await db.save();
    }
  } catch (error) {
    console.error("[TRANSCRIBE ERROR]", error.message);

    // رسالة خطأ مفصلة
    let errorMsg = `❌ *فشل التحويل*\n\n📌 *السبب:* ${error.message}\n\n🔄 تأكد من:\n• الرابط صحيح\n• الفيديو ليس طويلاً جداً\n• الخدمة متاحة`;

    if (error.response) {
      errorMsg += `\n📡 *رمز الخطأ:* ${error.response.status}`;
    }

    await sock.sendMessage(m.chat, {
      text: errorMsg,
      edit: waitMsg.key,
    }).catch(() => {
      m.reply(errorMsg);
    });
  }
}

// ==============================================
// 📤 تصدير الأمر
// ==============================================
export { pluginConfig as config, handler };