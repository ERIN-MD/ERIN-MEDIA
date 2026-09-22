import config from "../../config.js";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "مصارحة",
  alias: ["confess"],
  category: "fun",
  description: "أرسل رسالة مجهولة لشخص ما",
  usage: ".مصارحة رقم|رسالة",
  example: ".مصارحة 6281234567890|مرحباً، أنا معجب بك!",
  isOwner: false,
  isPremium: true,
  isGroup: false,
  isPrivate: false,
  cooldown: 60,
  energi: 1,
  isEnabled: true,
};

if (!global.confessData) global.confessData = new Map();

async function handler(m, { sock }) {
  const input = m.fullArgs?.trim() || m.text?.trim();

  if (!input || !input.includes("|")) {
    let txt = `💌 *خدمة المصارحة المجهولة* 💌\n\n`;
    txt += `تريد مصارحة شخص معجب به أو صديق دون أن تنكشف؟ يمكنك ذلك!\n\n`;
    txt += `*طريقة الاستخدام:*\n`;
    txt += `👉 \`${m.prefix}مصارحة رقم|رسالة\`\n\n`;
    txt += `*مثال:*\n`;
    txt += `> \`${m.prefix}مصارحة 6281234567890|مرحباً، أحب رؤية ابتسامتك!\`\n\n`;
    txt += `> 🤫 _لا تقلق، هويتك آمنة 100% وسرية تماماً!_`;
    return m.reply(txt);
  }

  const [rawNumber, ...messageParts] = input.split("|");
  const message = messageParts.join("|").trim();

  if (!rawNumber || !message) {
    return m.reply(`عفواً، الصيغة خاطئة! 😅\n\nجرب الكتابة هكذا: \`${m.prefix}مصارحة رقم|رسالة\``);
  }

  let targetNumber = rawNumber.trim().replace(/[^0-9]/g, "");

  if (targetNumber.startsWith("0")) {
    targetNumber = "62" + targetNumber.slice(1);
  }

  if (targetNumber.length < 10 || targetNumber.length > 15) {
    return m.reply(`همم، الرقم الذي أدخلته يبدو غير صالح! 🤔`);
  }

  const targetJid = targetNumber + "@s.whatsapp.net";
  const senderNumber = m.sender.split("@")[0];

  if (targetNumber === senderNumber) {
    return m.reply(`أتصارح نفسك؟ صارح شخصاً آخر! 😂`);
  }

  try {
    const [onWa] = await sock.onWhatsApp(targetNumber);
    if (!onWa?.exists) {
      return m.reply(`للأسف، الرقم \`${targetNumber}\` غير مسجل في واتساب! 😔`);
    }
  } catch (e) {}

  if (message.length < 5) {
    return m.reply(`الرسالة قصيرة جداً! 5 أحرف على الأقل لتكون ذات معنى. 📝`);
  }

  if (message.length > 1000) {
    return m.reply(`الرسالة طويلة جداً! الحد الأقصى 1000 حرف. 📜`);
  }

  const confessText = `💌 *هناك مصارحة سرية لك!* 💌\n\n` +
    `ششش.. هناك شخص صارحك سراً:\n\n` +
    `💬 *محتوى المصارحة:*\n` +
    `\`\`\`${message}\`\`\`\n\n` +
    `> 🔒 _هذه المصارحة أُرسلت بشكل مجهول (هوية المرسل مخفية)._\n` +
    `> ✉️ _يمكنك الرد على هذه المصارحة! فقط قم بـ *الرد* عليها!_`;

  try {
    const sentMsg = await sock.sendMessage(targetJid, {
      text: confessText,
      contextInfo: {
        forwardingScore: 99,
        isForwarded: true,
      },
    });

    global.confessData.set(sentMsg.key.id, {
      senderJid: m.sender,
      senderChat: m.chat,
      targetJid: targetJid,
      createdAt: Date.now(),
    });

    setTimeout(() => {
      global.confessData.delete(sentMsg.key.id);
    }, 24 * 60 * 60 * 1000);

    let successTxt = `✅ *تم إرسال المصارحة بنجاح!* ✅\n\n`;
    successTxt += `> 📱 أُرسل إلى: \`${targetNumber}\`\n`;
    successTxt += `> 🔒 هويتك آمنة تماماً!\n\n`;
    successTxt += `> _عندما يرد على مصارحتك، سأقوم بإرسال رده إليك هنا! لا تقلق_ 😉`;
    await m.reply(successTxt);
  } catch (error) {
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

async function replyHandler(m, { sock }) {
  if (!m.quoted) return false;

  const quotedId = m.quoted?.id || m.quoted?.key?.id;
  if (!quotedId) return false;

  const confessInfo = global.confessData.get(quotedId);
  if (!confessInfo) return false;

  if (m.sender !== confessInfo.targetJid) return false;

  const replyMessage = m.body?.trim();
  if (!replyMessage) return false;

  const saluranId = config.saluran?.id || "120363400911374213@newsletter";
  const saluranName = config.saluran?.name || config.bot?.name || "Maro-AI";

  const replyText = `💌 *هناك رد على مصارحتك!* 💌\n\n` +
    `الشخص الذي صارحته رد عليك:\n\n` +
    `💬 *محتوى الرد:*\n` +
    `\`\`\`${replyMessage}\`\`\`\n\n` +
    `> 🔒 _لا تقلق، هويتك لا تزال آمنة!_`;

  try {
    await sock.sendMessage(confessInfo.senderChat, {
      text: replyText,
      contextInfo: {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: saluranId,
          newsletterName: saluranName,
          serverMessageId: 127,
        },
      },
    });

    await sock.sendMessage(m.chat, {
      text: `✅ تم! تم إرسال ردك إلى صاحب المصارحة السري.`,
    });

    global.confessData.delete(quotedId);
    return true;
  } catch (error) {
    return false;
  }
}

export { pluginConfig as config, handler, replyHandler };