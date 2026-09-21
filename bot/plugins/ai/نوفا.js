// ==============================================
// 🤖 NOVA AI - الأمر المدمج (نسخة مستقرة)
// يدعم: نوفا، نوڤا، nova، nova-ai، novaai
// النطاق: my.izuka-api.xyz
// ==============================================

import axios from "axios";

// ==============================================
// 📋 إعدادات الأمر (pluginConfig)
// ==============================================
const pluginConfig = {
    name: "نوفا",
    alias: ["نوڤا", "nova", "nova-ai", "novaai"],
    category: "ai",
    description: "اسأل Nova AI أي شيء",
    usage: ".نوفا <سؤالك>",
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 5,
    isEnabled: true
};

// ==============================================
// 🧠 الدالة الرئيسية (handler)
// ==============================================
async function handler(m, { sock, text, pushName }) {
    // 1️⃣ التأكد من وجود نص
    if (!text) {
        return m.reply(
            `🤖 *Nova AI*\n━━━━━━━━━━━━━━━━━━\n❓ Masukkan pertanyaanmu.\n\n📌 Contoh:\n.nova Halo, siapa kamu?\n━━━━━━━━━━━━━━━━━━`
        );
    }

    // 2️⃣ إرسال رسالة انتظار
    const waitMsg = await m.reply(`⏳ *Nova AI* sedang berpikir...`);

    try {
        // 3️⃣ الاتصال بـ API (النطاق الجديد)
        const { data } = await axios.get(
            "https://my.izuka-api.xyz/api/ai/novaai",
            {
                params: { text: text },
                timeout: 30000, // زيادة المهلة إلى 30 ثانية
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            }
        );

        // 4️⃣ التحقق من الاستجابة
        if (data.status === true && data.result) {
            // قص النص إذا كان طويلاً جداً (واتساب يسمح بـ 65536 حرف كحد أقصى)
            let resultText = data.result;
            if (resultText.length > 5000) {
                resultText = resultText.substring(0, 4997) + "...";
            }

            const replyText =
`🤖 *Nova AI*
━━━━━━━━━━━━━━━━━━
${resultText}
━━━━━━━━━━━━━━━━━━
📌 *Pertanyaan:* ${text.substring(0, 100)}${text.length > 100 ? "..." : ""}
🕒 *Waktu:* ${new Date().toLocaleTimeString("id-ID")}`;

            // ✅ استخدام sock.sendMessage مباشرة بدلاً من تحرير الرسالة
            await sock.sendMessage(m.chat || m.key.remoteJid, {
                text: replyText
            }, { quoted: m });

            // حذف رسالة الانتظار (اختياري)
            await sock.sendMessage(m.chat || m.key.remoteJid, {
                delete: waitMsg.key
            }).catch(() => {});

        } else {
            await sock.sendMessage(m.chat || m.key.remoteJid, {
                text: `❌ *Nova AI* gagal merespons.\n\n📌 Struktur response:\n${JSON.stringify(data, null, 2)}`
            }, { quoted: m });
        }

    } catch (error) {
        console.error("[NOVA AI ERROR]", error.message);
        await sock.sendMessage(m.chat || m.key.remoteJid, {
            text: `❌ *Terjadi kesalahan*\n\n📌 *Pesan:* ${error.message}\n🔄 Coba lagi nanti.`
        }, { quoted: m });
    }
}

// ==============================================
// 📤 تصدير الأمر
// ==============================================
export { pluginConfig as config, handler };