// لايت_موشن - أمر لعرض بيانات مشروع Alight Motion من رابط المشاركة

import te from "../../src/lib/maro-error.js";
import config from "../../config.js";

const pluginConfig = {
  name: "لايت_موشن",
  alias: ["am-data"],
  category: "tools",
  description: "عرض بيانات مشروع Alight Motion من رابط المشاركة",
  usage: ".لايت_موشن <الرابط>",
  example: ".لايت_موشن https://alightcreative.com/am/share/...",
  cooldown: 15,
  energi: 1,
  isEnabled: true,
};

const API = "https://api.obscuraworks.org/api/tools/amdata";
const KEY = config.APIkey.obscura;

function fmtSize(b) {
  if (!b) return "-";
  if (b < 1024) return b + " بايت";
  if (b < 1048576) return (b / 1024).toFixed(1) + " كيلوبايت";
  return (b / 1048576).toFixed(1) + " ميجابايت";
}

function fmtDate(ts) {
  if (!ts?._seconds) return "-";
  return new Date(ts._seconds * 1000).toLocaleDateString("ar-EG", {
    dateStyle: "long",
  });
}

async function handler(m, { sock }) {
  const url = m.text?.trim();
  if (!url || !url.includes("alightcreative.com")) {
    return m.reply(
      `📱 *لايت موشن*\n\n` +
        `- عرض معلومات مشروع AM من رابط المشاركة\n` +
        `- أدخل رابط مشاركة Alight Motion\n\n` +
        `\`${m.prefix}لايت_موشن <الرابط>\``,
    );
  }

  m.react("🕕");

  try {
    const r = await fetch(API, {
      method: "POST",
      headers: {
        Accept: "application/json, image/*, audio/*, video/*",
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    const res = await r.json();
    const d = res?.data;
    const info = d?.info;

    if (!res?.status || !info) {
      m.react("❌");
      return m.reply(
        `📱 *فشل قراءة البيانات*\n\n` + `- تأكد من صحة رابط المشاركة`,
      );
    }

    m.react("✅");

    const projects =
      info.projects
        ?.map((p) => `  - *${p.title}* (${p.type}, ${fmtSize(p.size)})`)
        .join("\n") || "  - لا يوجد";

    const effects = info.requiredEffects?.length
      ? info.requiredEffects.slice(0, 8).join(", ") +
        (info.requiredEffects.length > 8
          ? `, +${info.requiredEffects.length - 8} إضافية`
          : "")
      : "-";

    let msg =
      `📱 *لايت موشن*\n\n` +
      `- *العنوان* → ${info.title || "-"}\n` +
      `- *الحجم* → ${fmtSize(info.size)}\n` +
      `- *التنزيلات* → ${info.downloads ?? 0}×\n` +
      `- *الإعجابات* → ${info.likes ?? 0}\n` +
      `- *الإصدار* → \`${info.amVersionString || "-"}\`\n` +
      `- *المنصة* → ${info.amPlatform || "-"}\n` +
      `- *أقصى FF* → v${info.maxFFVer || "-"}\n` +
      `- *التاريخ* → ${fmtDate(info.shareDate)}\n\n` +
      `🎬 *المشاريع*\n${projects}\n\n` +
      `✨ *التأثيرات* → ${effects}`;

    if (info.largeThumbUrl) {
      await sock.sendMedia(m.chat, info.largeThumbUrl, null, m, {
        type: "image",
        caption: msg,
      });
    } else {
      m.reply(msg);
    }
  } catch (e) {
    console.log(e);
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler }