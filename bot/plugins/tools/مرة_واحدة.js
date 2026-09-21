import config from "../../config.js";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "مرة_واحدة",
  alias: ["rvo"],
  category: "tools",
  description: "قراءة رسالة مرة واحدة (view once)",
  usage: ".مرة_واحدة (رد على رسالة مرة واحدة)",
  example: ".مرة_واحدة",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const quoted = m.quoted;
  if (!quoted) {
    return m.reply(
      `قم بالرد على رسالة مرة واحدة (view once) لقراءتها.\n\n\`مثال: ${m.prefix}مرة_واحدة\` (رد على رسالة view once)`,
    );
  }

  if (!quoted.isViewOnce && !quoted.isMedia) {
    return m.reply("❌ قم بالرد على رسالة view once (مرة واحدة) لقراءتها.");
  }

  m.react("⏱️");

  try {
    let originalCaption = "";
    if (quoted.message?.[quoted.type]?.caption) {
      originalCaption = quoted.message[quoted.type].caption;
    } else if (quoted.body) {
      originalCaption = quoted.body;
    }

    const buffer = await quoted.download();
    if (!buffer) throw new Error("فشل تحميل الوسائط");

    const caption = originalCaption ? `\`الرسالة :\`\n> ${originalCaption}` : "";

    if (quoted.isImage) {
      await sock.sendMessage(
        m.chat,
        {
          image: buffer,
          caption,
        },
        { quoted: m },
      );
    } else if (quoted.isVideo) {
      await sock.sendMessage(
        m.chat,
        {
          video: buffer,
          caption,
        },
        { quoted: m },
      );
    } else if (quoted.isAudio) {
      await sock.sendMessage(
        m.chat,
        {
          audio: buffer,
          mimetype: quoted.message?.[quoted.type]?.mimetype || "audio/mpeg",
        },
        { quoted: m },
      );
    } else {
      const ext = quoted.type?.replace("Message", "") || "bin";
      await sock.sendMessage(
        m.chat,
        {
          document: buffer,
          fileName: `rvo_${Date.now()}.${ext}`,
          mimetype:
            quoted.message?.[quoted.type]?.mimetype ||
            "application/octet-stream",
          caption: caption || "📎 وسائط view once",
        },
        { quoted: m },
      );
    }

    m.react("✅");
  } catch (e) {
    m.react("☢");
    let msg = e.message;
    if (
      msg.includes("Gagal download") ||
      msg.includes("decrypt") ||
      msg.includes("download") ||
      msg.includes("Timeout") ||
      msg.includes("404") ||
      msg.includes("Gone")
    ) {
      msg =
        "انتهت صلاحية الوسائط أو تم حذفها من خادم واتساب.\n\n_رسائل view once القديمة أو التي تم فتحها كثيراً تنتهي صلاحيتها تلقائياً من نظام واتساب ولا يمكن تحميلها مرة أخرى._";
    }
    m.reply(`❌ *فشل فتح رسالة مرة واحدة*\n\n> ${msg}`);
  }
}

export { pluginConfig as config, handler };