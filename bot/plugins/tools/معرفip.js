// معرفip - أمر للبحث عن معلومات عنوان IP

import config from "../../config.js";
import te from "../../src/lib/maro-error.js";
import { sendToolsPreview, saluranCtx } from "../../src/lib/maro-context.js";

const pluginConfig = {
  name: "معرفip",
  alias: ["ipwho"],
  category: "tools",
  description: "البحث عن معلومات عنوان IP",
  usage: ".معرفip <ايبي>",
  example: ".معرفip 8.8.8.8",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const ip = m.args?.[0];

  if (!ip) {
    return m.reply(
      `⚠️ *طريقة الاستخدام*\n\n` +
        `> \`${m.prefix}معرفip <ايبي>\`\n\n` +
        `> مثال:\n` +
        `> \`${m.prefix}معرفip 8.8.8.8\``,
    );
  }

  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ip)) {
    return m.reply(`❌ *صيغة غير صالحة*\n\n> مثال: \`8.8.8.8\``);
  }

  await m.react("🕕");
  await m.reply(`🕕 *جاري البحث عن معلومات الايبي...*`);

  try {
    const res = await fetch(`https://ipwho.is/${ip}`);
    const data = await res.json();

    if (!data.success) {
      await m.react("❌");
      return m.reply(`❌ *الايبي غير موجود*\n\n> الايبي ${ip} غير صالح`);
    }

    // ترجمة الأسماء
    const securityStatus = {
      'vpn': data.security?.vpn ? "✅ نعم" : "❌ لا",
      'proxy': data.security?.proxy ? "✅ نعم" : "❌ لا",
      'tor': data.security?.tor ? "✅ نعم" : "❌ لا"
    };

    if (data.latitude && data.longitude) {
      await sock.sendMessage(
        m.chat,
        {
          location: {
            degreesLatitude: data.latitude,
            degreesLongitude: data.longitude,
          },
        },
        { quoted: m },
      );
    }

    const text =
      `🌐 *بحث الايبي*\n\n` +
      `╭┈┈⬡「 📍 *الموقع* 」\n` +
      `┃ 🔢 الايبي: ${data.ip}\n` +
      `┃ 🌍 الدولة: ${data.country} ${data.country_code}\n` +
      `┃ 🏙️ المدينة: ${data.city || "-"}\n` +
      `┃ 📍 المنطقة: ${data.region || "-"}\n` +
      `┃ 🌐 القارة: ${data.continent || "-"}\n` +
      `┃ 📮 الرمز البريدي: ${data.postal || "-"}\n` +
      `┃ ⏰ المنطقة الزمنية: ${data.timezone?.id || "-"}\n` +
      `╰┈┈┈┈┈┈┈┈⬡\n\n` +
      `╭┈┈⬡「 🔌 *الاتصال* 」\n` +
      `┃ 🏢 مزود الخدمة: ${data.connection?.isp || "-"}\n` +
      `┃ 🌐 المنظمة: ${data.connection?.org || "-"}\n` +
      `┃ 📡 رقم الشبكة: ${data.connection?.asn || "-"}\n` +
      `╰┈┈┈┈┈┈┈┈⬡\n\n` +
      `╭┈┈⬡「 🛡️ *الأمان* 」\n` +
      `┃ 🔒 شبكة خاصة: ${securityStatus.vpn}\n` +
      `┃ 🌐 بروكسي: ${securityStatus.proxy}\n` +
      `┃ 🤖 تور: ${securityStatus.tor}\n` +
      `╰┈┈┈┈┈┈┈┈⬡`;

    await m.react("✅");
    await sendToolsPreview(sock, m.chat, text, "🌐 *بحث الايبي*", data.country, {
      quoted: m,
    });
  } catch (e) {
    await m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };