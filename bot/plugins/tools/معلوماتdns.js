// معلوماتDNS - أمر للبحث عن معلومات DNS للنطاق

import config from "../../config.js";
import te from "../../src/lib/maro-error.js";
import { sendToolsPreview } from "../../src/lib/maro-context.js";

const pluginConfig = {
  name: "معلوماتDNS",
  alias: ["lookup"],
  category: "tools",
  description: "البحث عن معلومات DNS للنطاق",
  usage: ".معلوماتDNS <النطاق>",
  example: ".معلوماتDNS google.com",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  let domain = m.args?.[0];

  if (!domain) {
    return m.reply(
      `⚠️ *طريقة الاستخدام*\n\n` +
        `> \`${m.prefix}معلوماتDNS <النطاق>\`\n\n` +
        `> مثال:\n` +
        `> \`${m.prefix}معلوماتDNS google.com\``,
    );
  }

  domain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];

  if (
    !/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z]{2,})+$/.test(domain)
  ) {
    return m.reply(`❌ *صيغة غير صالحة*\n\n> مثال: \`google.com\``);
  }

  await m.react("🕕");
  await m.reply(`🕕 *جاري البحث عن معلومات النطاق...*`);

  try {
    const [dnsRes, whoisRes] = await Promise.allSettled([
      fetch(`https://api.hackertarget.com/dnslookup/?q=${domain}`).then((r) =>
        r.text(),
      ),
      fetch(`https://api.hackertarget.com/whois/?q=${domain}`).then((r) =>
        r.text(),
      ),
    ]);

    const dnsData = dnsRes.status === "fulfilled" ? dnsRes.value : null;
    const whoisData = whoisRes.status === "fulfilled" ? whoisRes.value : null;

    if (!dnsData && !whoisData) {
      await m.react("❌");
      return m.reply(`❌ *فشل*\n\n> لا يمكن معالجة النطاق`);
    }

    let text = `🔍 *معلومات DNS*\n\n`;
    text += `> النطاق: \`${domain}\`\n\n`;

    if (dnsData && !dnsData.includes("error")) {
      const lines = dnsData.split("\n").filter((l) => l.trim());
      const records = {};

      lines.forEach((line) => {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          const type = parts[parts.length - 2] || "أخرى";
          const value = parts[parts.length - 1];
          if (!records[type]) records[type] = [];
          records[type].push(value);
        }
      });

      text += `╭┈┈⬡「 📋 *سجلات DNS* 」\n`;
      if (records["A"])
        text += `┃ 🅰️ A: ${records["A"].slice(0, 3).join(", ")}\n`;
      if (records["AAAA"])
        text += `┃ 🔢 AAAA: ${records["AAAA"].slice(0, 2).join(", ")}\n`;
      if (records["MX"])
        text += `┃ 📧 MX: ${records["MX"].slice(0, 2).join(", ")}\n`;
      if (records["NS"])
        text += `┃ 🌐 NS: ${records["NS"].slice(0, 3).join(", ")}\n`;
      if (records["TXT"])
        text += `┃ 📝 TXT: ${records["TXT"].length} سجل\n`;
      text += `╰┈┈┈┈┈┈┈┈⬡\n\n`;
    }

    if (whoisData && !whoisData.includes("error") && whoisData.length < 2000) {
      const registrar = whoisData.match(/Registrar:\s*(.+)/i)?.[1] || "-";
      const created = whoisData.match(/Creation Date:\s*(.+)/i)?.[1] || "-";
      const expires = whoisData.match(/Expir.*Date:\s*(.+)/i)?.[1] || "-";
      const nameservers =
        whoisData
          .match(/Name Server:\s*(.+)/gi)
          ?.slice(0, 2)
          .map((ns) => ns.split(":")[1]?.trim()) || [];

      text += `╭┈┈⬡「 📄 *معلومات WHOIS* 」\n`;
      text += `┃ 🏢 المسجل: ${registrar.slice(0, 35)}\n`;
      text += `┃ 📅 تاريخ الإنشاء: ${created.slice(0, 20)}\n`;
      text += `┃ ⏰ تاريخ الانتهاء: ${expires.slice(0, 20)}\n`;
      if (nameservers.length > 0)
        text += `┃ 🌐 خوادم الأسماء: ${nameservers.join(", ")}\n`;
      text += `╰┈┈┈┈┈┈┈┈⬡`;
    }

    await m.react("✅");
    await sendToolsPreview(sock, m.chat, text, "🔍 *معلومات DNS*", domain, {
      quoted: m,
    });
  } catch (e) {
    await m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };