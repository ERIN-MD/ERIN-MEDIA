// صور أنمي - أمر للحصول على صور أنمي عشوائية / ردود فعل (مصدر Nexray)

import axios from "axios";
import te from "../../src/lib/maro-error.js";
import { saluranCtx } from "../../src/lib/maro-context.js";
import { prepareWAMessageMedia, generateWAMessageFromContent } from "maro";

const nexrayTypes = [
  "waifu", "neko", "shinobu", "megumin", "bully", "cuddle", "cry", "hug",
  "awoo", "kiss", "lick", "pat", "smug", "bonk", "yeet", "blush", "smile",
  "wave", "highfive", "handhold", "nom", "bite", "glomp", "slap", "kill",
  "happy", "wink", "poke", "dance", "cringe"
];

const pluginConfig = {
  name: ["لولي", ...nexrayTypes],
  alias: [],
  category: "random",
  description: "صور أنمي عشوائية / ردود فعل (مصدر Nexray)",
  usage: ".<الاسم> (انظر القائمة أدناه)",
  example: ".waifu",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  try {
    const cmd = m.command.toLowerCase();

    // أمر لولي بالعربية
    if (cmd === "لولي") {
      return await sock.sendMessage(
        m.chat,
        {
          image: { url: "https://api.nexray.web.id/random/loli" },
          caption: `👧 *لولي عشوائي*`,
        },
        { quoted: m },
      );
    }

    if (nexrayTypes.includes(cmd)) {
      m.react("🖼️");
      const res = await axios.get(`https://api.nexray.eu.cc/random/anime?type=${cmd}`, {
        responseType: "arraybuffer"
      });
      const buffer = Buffer.from(res.data);
      const isGif = buffer.length > 3 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46; // "GIF"
      
      // ترجمة اسم الأمر للعرض
      const cmdNames = {
        waifu: "وايفو",
        neko: "نيكو",
        shinobu: "شينوبو",
        megumin: "ميغومين",
        bully: "تنمر",
        cuddle: "عناق",
        cry: "بكاء",
        hug: "احتضان",
        awoo: "أووو",
        kiss: "قبلة",
        lick: "لعق",
        pat: "تربيت",
        smug: "غرور",
        bonk: "ضربة",
        yeet: "رمي",
        blush: "احمرار",
        smile: "ابتسامة",
        wave: "تلويح",
        highfive: "كف عالي",
        handhold: "مسك اليد",
        nom: "أكل",
        bite: "عض",
        glomp: "انقضاض",
        slap: "صفعة",
        kill: "قتل",
        happy: "سعيد",
        wink: "غمزة",
        poke: "نكزة",
        dance: "رقص",
        cringe: "حرج"
      };
      
      const displayName = cmdNames[cmd] || cmd.toUpperCase();
      
      const media = await prepareWAMessageMedia(
        isGif ? { video: buffer, gifPlayback: true } : { image: buffer },
        { upload: sock.waUploadToServer }
      );
      
      const msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2,
            },
            interactiveMessage: {
              body: { text: `✨ *${displayName} عشوائي*` },
              footer: { text: "اضغط على الزر أدناه للحصول على صورة أخرى" },
              header: {
                hasMediaAttachment: true,
                ...(isGif ? { videoMessage: media.videoMessage } : { imageMessage: media.imageMessage })
              },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                      display_text: "🔄 صور أخرى؟",
                      id: `${m.prefix}${cmd}`
                    })
                  }
                ]
              }
            }
          }
        }
      }, { quoted: m });
      
      return await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    }

    // عرض قائمة الأوامر المتاحة
    const cmdList = ["لولي", ...nexrayTypes].map(c => `• \`${c}\``).join("\n");
    return m.reply(
      `🎨 *صور أنمي عشوائية*\n\n` +
      `الأوامر المتاحة:\n${cmdList}\n\n` +
      `مثال: \`${m.prefix}waifu\``
    );

  } catch (err) {
    m.react("☢");
    return m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };